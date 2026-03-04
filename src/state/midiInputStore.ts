import { create } from 'zustand';
import { getMidiInputEngine } from '@/audio/midi/MidiInputEngine';

// Minimal MIDIAccess shape needed here — mirrors the inline declaration
// in MidiInputEngine.ts without creating a shared-types circular dependency.
interface MIDIAccess {
  inputs: Map<string, { name?: string }>;
  onstatechange: ((event: Event) => void) | null;
}

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
  pendingNotes: Map<number, { startTicks: number; velocity: number }>;
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
  pendingNotes: new Map(),
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
    set({
      isArmed: armed,
      // Disarm while recording → also stop recording
      ...((!armed && state.isRecording) ? { isRecording: false } : {}),
    });
  },

  startRecording: (startTicks: number) => {
    set({
      isRecording: true,
      recordingStartTicks: startTicks,
      pendingNotes: new Map(),
      sustainedNoteOffs: new Set(),
    });
  },

  stopRecording: () => {
    set({ isRecording: false });
  },

  setIsRecording: (recording: boolean) => {
    set({ isRecording: recording });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));

/**
 * Singleton accessor for use outside React components
 * (e.g. from MidiInputEngine callbacks, audio pipeline).
 */
export const getMidiInputStore = () => useMidiInputStore;
