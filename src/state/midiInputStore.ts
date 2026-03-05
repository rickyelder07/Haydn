import { create } from 'zustand';
import * as Tone from 'tone';
import { getMidiInputEngine } from '@/audio/midi/MidiInputEngine';
import { playCountIn } from '@/audio/playback/CountIn';
import { midiToNoteName } from '@/audio/utils/timeConversion';
import { getInstrumentForTrack } from '@/audio/playback/NoteScheduler';
import { getPlaybackController } from '@/audio/playback/PlaybackController';
import { useProjectStore } from '@/state/projectStore';
import { useEditStore } from '@/state/editStore';
import { usePlaybackStore } from '@/state/playbackStore';
import type { HaydnNote } from '@/lib/midi/types';
import type { MIDIMessageEvent } from '@/audio/midi/MidiInputEngine';

// Minimal MIDIAccess shape needed here — mirrors the inline declaration
// in MidiInputEngine.ts without creating a shared-types circular dependency.
interface MIDIAccess {
  inputs: Map<string, { name?: string }>;
  onstatechange: ((event: Event) => void) | null;
}

// ---------- MIDI message decoding types ----------

interface MidiNoteEvent {
  type: 'noteOn' | 'noteOff';
  midi: number;
  velocity: number;    // 0-127 raw
  timestamp: number;   // performance.now() domain
}

interface MidiCCEvent {
  type: 'controlChange';
  controller: number;
  value: number;
  timestamp: number;
}

type MidiEvent = MidiNoteEvent | MidiCCEvent;

// ---------- Module-level helpers ----------

function decodeMidiMessage(event: MIDIMessageEvent): MidiEvent | null {
  if (!event.data || event.data.length < 2) return null;
  const status = event.data[0];
  const data1 = event.data[1];
  const data2 = event.data.length > 2 ? event.data[2] : 0;
  const command = status & 0xF0;
  switch (command) {
    case 0x90:
      // velocity 0 on Note On = Note Off (MIDI running status)
      if (data2 === 0) return { type: 'noteOff', midi: data1, velocity: 0, timestamp: event.timeStamp };
      return { type: 'noteOn', midi: data1, velocity: data2, timestamp: event.timeStamp };
    case 0x80:
      return { type: 'noteOff', midi: data1, velocity: data2, timestamp: event.timeStamp };
    case 0xB0:
      return { type: 'controlChange', controller: data1, value: data2, timestamp: event.timeStamp };
    default:
      return null;
  }
}

function midiTimestampToTicks(midiTimestamp: number, ppq: number, bpm: number): number {
  // MIDIMessageEvent.timeStamp is in performance.now() domain (ms)
  // AudioContext.currentTime is in seconds from page load
  // Offset aligns the two domains
  const audioContext = Tone.getContext().rawContext as AudioContext;
  const timingOffsetSeconds = (performance.now() / 1000) - audioContext.currentTime;
  const midiTimeAudioSeconds = (midiTimestamp / 1000) - timingOffsetSeconds;

  // Transport.seconds = elapsed playback time
  const transportStartAudioTime = audioContext.currentTime - (Tone.getTransport().seconds);
  const elapsedTransportSeconds = midiTimeAudioSeconds - transportStartAudioTime;

  const ticks = Math.round((elapsedTransportSeconds * bpm / 60) * ppq);
  return Math.max(0, ticks);
}

// ---------- Recording helpers ----------

/**
 * Flush completed recording notes to the project store for live piano roll preview.
 * Uses the pre-recording snapshot as the base so we never double-count notes.
 * Does NOT go through editStore, so undo history is not polluted mid-recording.
 */
function flushLiveRecordingToProject(
  completedNotes: HaydnNote[],
  preRecordingNotes: HaydnNote[],
): void {
  const project = useProjectStore.getState().project;
  const selectedTrackIndex = useEditStore.getState().selectedTrackIndex;
  if (!project || selectedTrackIndex === null) return;

  const liveNotes = [...preRecordingNotes, ...completedNotes]
    .sort((a, b) => a.ticks - b.ticks);

  const newTracks = [...project.tracks];
  newTracks[selectedTrackIndex] = { ...newTracks[selectedTrackIndex], notes: liveNotes };
  const newProject = { ...project, tracks: newTracks };

  useProjectStore.getState().setProject(newProject);
  getPlaybackController().updateProject(newProject);
}

/**
 * Restore the track to its pre-recording state when recording is cancelled without commit.
 */
function cancelLiveRecordingPreview(preRecordingNotes: HaydnNote[]): void {
  const project = useProjectStore.getState().project;
  const selectedTrackIndex = useEditStore.getState().selectedTrackIndex;
  if (!project || selectedTrackIndex === null) return;

  const newTracks = [...project.tracks];
  newTracks[selectedTrackIndex] = { ...newTracks[selectedTrackIndex], notes: [...preRecordingNotes] };
  const newProject = { ...project, tracks: newTracks };

  useProjectStore.getState().setProject(newProject);
  getPlaybackController().updateProject(newProject);
}

// ---------- Store interface ----------

interface MidiInputState {
  // Connection
  isSupported: boolean | null;   // null = not checked yet
  isConnected: boolean;
  devices: string[];             // device names for display
  error: string | null;

  // Recording
  isArmed: boolean;
  isRecording: boolean;
  recordingStartTicks: number;
  preRecordingNotes: HaydnNote[];  // Snapshot of track notes at recording start (for live preview + commit)
  pendingNotes: Map<number, { startTicks: number; velocity: number }>;
  completedNotes: HaydnNote[];   // Fully recorded notes (noteOn + noteOff pair complete)
  sustainActive: boolean;
  sustainedNoteOffs: Set<number>;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshDevices: (access: MIDIAccess | null) => void;
  setArmed: (armed: boolean) => void;
  startRecording: (startTicks: number) => void;
  stopRecording: () => void;
  setIsRecording: (recording: boolean) => void;
  setError: (error: string | null) => void;
  handleMidiEvent: (rawEvent: MIDIMessageEvent) => void;
  startRecordingWithCountIn: () => Promise<void>;
  commitRecording: (selectedTrackIndex: number) => void;
}

export const useMidiInputStore = create<MidiInputState>((set, get) => ({
  // Initial state — connection
  isSupported: null,
  isConnected: false,
  devices: [],
  error: null,

  // Initial state — recording
  isArmed: false,
  isRecording: false,
  recordingStartTicks: 0,
  preRecordingNotes: [],
  pendingNotes: new Map(),
  completedNotes: [],
  sustainActive: false,
  sustainedNoteOffs: new Set(),

  // Actions

  connect: async () => {
    const engine = getMidiInputEngine();

    if (!engine.isWebMidiSupported()) {
      set({
        isSupported: false,
        error: 'Web MIDI API is not supported. Please use Chrome, Edge, or Opera.',
      });
      return;
    }

    try {
      await engine.requestAccess();

      // Register MIDI message handler for live play and recording
      engine.addMessageHandler((event) => {
        get().handleMidiEvent(event);
      });

      set({
        isSupported: true,
        isConnected: true,
        devices: engine.getInputDevices(),
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown MIDI error';
      set({ error: message });
    }
  },

  disconnect: () => {
    set({
      isConnected: false,
      devices: [],
      isArmed: false,
      isRecording: false,
    });
  },

  refreshDevices: (_access: MIDIAccess | null) => {
    // Re-read from the engine singleton — the access parameter is provided by
    // MidiInputEngine's onstatechange callback but we go through the engine API
    // to keep device-name logic in one place.
    const engine = getMidiInputEngine();
    set({ devices: engine.getInputDevices() });
  },

  setArmed: (armed: boolean) => {
    const state = get();
    if (!armed && state.isRecording) {
      // Disarming mid-recording — restore the track to its pre-recording state.
      cancelLiveRecordingPreview(state.preRecordingNotes);
    }
    set({
      isArmed: armed,
      ...((!armed && state.isRecording) ? { isRecording: false, preRecordingNotes: [] } : {}),
    });
  },

  startRecording: (startTicks: number) => {
    // Snapshot the track's current notes so live preview and commit use the same baseline.
    const project = useProjectStore.getState().project;
    const selectedTrackIndex = useEditStore.getState().selectedTrackIndex;
    const preRecordingNotes =
      selectedTrackIndex !== null && project
        ? [...(project.tracks[selectedTrackIndex]?.notes ?? [])]
        : [];

    set({
      isRecording: true,
      recordingStartTicks: startTicks,
      preRecordingNotes,
      pendingNotes: new Map(),
      completedNotes: [],
      sustainedNoteOffs: new Set(),
    });
  },

  stopRecording: () => {
    const state = get();
    if (state.isRecording) {
      cancelLiveRecordingPreview(state.preRecordingNotes);
    }
    set({ isRecording: false, preRecordingNotes: [] });
  },

  setIsRecording: (recording: boolean) => {
    set({ isRecording: recording });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // ---------- MIDI event routing ----------

  handleMidiEvent: (rawEvent) => {
    const decoded = decodeMidiMessage(rawEvent);
    if (!decoded) return;

    const state = get();
    const projectStore = useProjectStore.getState();
    const playbackStore = usePlaybackStore.getState();
    const project = projectStore.project;
    const selectedTrackIndex = useEditStore.getState().selectedTrackIndex;

    // --- CC64 Sustain Pedal ---
    if (decoded.type === 'controlChange' && decoded.controller === 64) {
      const pedalDown = decoded.value >= 64;
      if (pedalDown) {
        set({ sustainActive: true });
      } else {
        // Pedal lifted — release all deferred notes immediately
        const instrument = project && selectedTrackIndex !== null
          ? getInstrumentForTrack(selectedTrackIndex, project) : null;
        state.sustainedNoteOffs.forEach(midi => {
          instrument?.triggerRelease?.(midiToNoteName(midi), Tone.now());
        });
        set({ sustainActive: false, sustainedNoteOffs: new Set() });
      }
      return;
    }

    // --- Note On ---
    if (decoded.type === 'noteOn') {
      const instrument = project && selectedTrackIndex !== null
        ? getInstrumentForTrack(selectedTrackIndex, project) : null;

      // Live audio feedback (always — even during recording)
      instrument?.triggerAttack?.(midiToNoteName(decoded.midi), Tone.now(), decoded.velocity / 127);

      // Recording accumulation: store note-on timestamp as pending
      if (state.isArmed && state.isRecording && project) {
        const ppq = project.metadata.ppq;
        const bpm = playbackStore.tempo;
        const startTicks = midiTimestampToTicks(decoded.timestamp, ppq, bpm);
        const updatedPending = new Map(state.pendingNotes);
        updatedPending.set(decoded.midi, { startTicks, velocity: decoded.velocity });
        set({ pendingNotes: updatedPending });
      }
      return;
    }

    // --- Note Off ---
    if (decoded.type === 'noteOff') {
      // Live audio: defer release if sustain pedal is held, otherwise release immediately
      if (state.sustainActive) {
        const updatedDeferred = new Set(state.sustainedNoteOffs);
        updatedDeferred.add(decoded.midi);
        set({ sustainedNoteOffs: updatedDeferred });
        // triggerRelease is deferred until pedal lifts — do NOT call it here
      } else {
        const instrument = project && selectedTrackIndex !== null
          ? getInstrumentForTrack(selectedTrackIndex, project) : null;
        instrument?.triggerRelease?.(midiToNoteName(decoded.midi), Tone.now());
      }

      // Recording: close the matching pending note and move it to completedNotes
      if (state.isArmed && state.isRecording && project) {
        const pending = state.pendingNotes.get(decoded.midi);
        if (pending) {
          const ppq = project.metadata.ppq;
          const bpm = playbackStore.tempo;
          const endTicks = midiTimestampToTicks(decoded.timestamp, ppq, bpm);
          const durationTicks = Math.max(endTicks - pending.startTicks, Math.round(ppq / 16));

          const completedNote: HaydnNote = {
            midi: decoded.midi,
            ticks: pending.startTicks,
            durationTicks,
            velocity: pending.velocity / 127,
          };

          const updatedPending = new Map(state.pendingNotes);
          updatedPending.delete(decoded.midi);
          const newCompletedNotes = [...state.completedNotes, completedNote];
          set({
            pendingNotes: updatedPending,
            completedNotes: newCompletedNotes,
          });

          // Live preview — push completed note into project store so piano roll
          // updates immediately without waiting for Stop/commit.
          flushLiveRecordingToProject(newCompletedNotes, state.preRecordingNotes);
        }
      }
    }
  },

  // ---------- Recording commit ----------

  commitRecording: (selectedTrackIndex) => {
    const state = get();
    const project = useProjectStore.getState().project;
    if (!project || !state.isRecording) return;

    const ppq = project.metadata.ppq;

    // Close any notes still held when recording stopped
    const now = Tone.getTransport().ticks;
    const allNotes: HaydnNote[] = [...state.completedNotes];

    state.pendingNotes.forEach(({ startTicks, velocity }, midi) => {
      const durationTicks = Math.max(now - startTicks, Math.round(ppq / 16));
      // Cap at 2 bars to prevent accidental monster notes
      const maxDuration = ppq * 8; // 2 bars at 4/4
      allNotes.push({
        midi,
        ticks: startTicks,
        durationTicks: Math.min(durationTicks, maxDuration),
        velocity: velocity / 127,
      });
    });

    if (allNotes.length > 0 && selectedTrackIndex !== null) {
      // Merge against preRecordingNotes (snapshot from before recording) so we don't
      // double-count notes that were already live-flushed to the project store.
      const mergedNotes = [...state.preRecordingNotes, ...allNotes].sort((a, b) => a.ticks - b.ticks);
      useEditStore.getState().applyBatchEdit(mergedNotes); // single undo step
    }

    set({ isRecording: false, completedNotes: [], pendingNotes: new Map(), sustainedNoteOffs: new Set(), preRecordingNotes: [] });
  },

  // ---------- Recording with count-in ----------

  startRecordingWithCountIn: async () => {
    const state = get();
    if (!state.isArmed) return;

    const playbackStore = usePlaybackStore.getState();

    // If already playing, start recording immediately (no count-in possible mid-song)
    if (playbackStore.playbackState === 'playing') {
      get().startRecording(Tone.getTransport().ticks);
      return;
    }

    // Capture current transport position — non-zero when paused or seeked while stopped.
    const targetTicks = Tone.getTransport().ticks;

    // From stopped/paused state: 1-bar count-in, then start playback + recording from targetTicks.
    // The count-in is pure audio (no Transport changes), so position is preserved.
    set({ isRecording: false }); // ensure clean state
    try {
      await playCountIn({ bars: 1 });
      get().startRecording(targetTicks); // recording starts from current position
      await playbackStore.play();
    } catch {
      // Count-in cancelled
      set({ isArmed: false });
    }
  },
}));

/**
 * Singleton accessor for use outside React components
 * (e.g. from MidiInputEngine callbacks, audio pipeline).
 */
export const getMidiInputStore = () => useMidiInputStore;
