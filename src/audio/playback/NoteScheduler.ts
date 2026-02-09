import { Transport, Part } from 'tone';
import type { HaydnProject, HaydnTrack, HaydnNote } from '@/lib/midi/types';
import { createInstrument, type InstrumentInstance } from '@/audio/instruments/InstrumentFactory';
import { ticksToSeconds, midiToNoteName } from '@/audio/utils/timeConversion';
import { isPercussionChannel } from '@/lib/instruments/gm-mapping';

// Store references to scheduled parts and instruments for cleanup
let scheduledParts: Part[] = [];
let trackParts: Map<number, Part> = new Map();
let loadedInstruments: Map<number | string, InstrumentInstance> = new Map();

interface ScheduledNote {
  time: number;      // Start time in seconds
  note: string;      // Note name (e.g., "C4")
  duration: number;  // Duration in seconds
  velocity: number;  // 0-1
}

/**
 * Schedule all notes from a HaydnProject to Tone.Transport.
 * Must be called after AudioEngine.initialize().
 */
export async function scheduleNotes(project: HaydnProject): Promise<void> {
  // Clear any existing scheduled notes
  clearScheduledNotes();

  // Clear track parts map
  trackParts.clear();

  const { ppq, tempos } = project.metadata;

  // Schedule tempo events to Transport
  if (tempos.length > 0) {
    // Set initial tempo
    Transport.bpm.value = tempos[0].bpm;

    // Schedule tempo changes
    tempos.forEach((tempo) => {
      const timeInSeconds = ticksToSeconds(tempo.ticks, ppq, tempos.slice(0, tempos.indexOf(tempo)));
      if (tempo.ticks > 0) {
        Transport.bpm.setValueAtTime(tempo.bpm, timeInSeconds);
      }
    });
  } else {
    Transport.bpm.value = 120; // Default
  }

  // Create instruments and schedule notes for each track
  for (let trackIndex = 0; trackIndex < project.tracks.length; trackIndex++) {
    const track = project.tracks[trackIndex];

    // Skip empty tracks
    if (track.notes.length === 0) continue;

    // Determine instrument key for reuse/sharing
    const isPercussion = isPercussionChannel(track.channel);
    const isPiano = !isPercussion && (track.instrumentNumber >= 0 && track.instrumentNumber <= 7);

    // Use unique keys:
    // - Percussion: 'percussion' (channel 9, any program)
    // - Piano: 0 (programs 0-7 share)
    // - Others: their program number
    const instrumentKey = isPercussion ? 'percussion' : (isPiano ? 0 : track.instrumentNumber);

    // Create or reuse instrument for this GM program
    let instrument = loadedInstruments.get(instrumentKey);
    if (!instrument) {
      instrument = await createInstrument(track.instrumentNumber, track.channel);
      loadedInstruments.set(instrumentKey, instrument);
    }

    // Convert notes to scheduled events
    const scheduledNotes: ScheduledNote[] = track.notes.map((note) => {
      const startTime = ticksToSeconds(note.ticks, ppq, tempos);
      const endTime = ticksToSeconds(note.ticks + note.durationTicks, ppq, tempos);

      return {
        time: startTime,
        note: midiToNoteName(note.midi),
        duration: endTime - startTime,
        velocity: note.velocity, // Already 0-1 normalized
      };
    });

    // Create Tone.Part for this track
    const part = new Part((time, event) => {
      if (typeof event === 'object' && event !== null) {
        const note = event as ScheduledNote;
        instrument!.triggerAttackRelease(
          note.note,
          note.duration,
          time,
          note.velocity
        );
      }
    }, scheduledNotes.map(n => [n.time, n]));

    part.start(0);
    scheduledParts.push(part);

    // Store reference for mute control
    trackParts.set(trackIndex, part);
  }
}

/**
 * Clear all scheduled notes and dispose instruments.
 */
export function clearScheduledNotes(): void {
  // Stop and dispose all parts
  scheduledParts.forEach(part => {
    part.stop();
    part.dispose();
  });
  scheduledParts = [];

  // Clear track parts map
  trackParts.clear();

  // Release all instruments but keep them loaded
  loadedInstruments.forEach(instrument => {
    instrument.releaseAll();
  });
}

/**
 * Fully dispose all instruments (call on project change).
 */
export function disposeAllInstruments(): void {
  clearScheduledNotes();
  loadedInstruments.forEach(instrument => {
    instrument.dispose();
  });
  loadedInstruments.clear();
}

/**
 * Get count of loaded instruments (for debugging).
 */
export function getLoadedInstrumentCount(): number {
  return loadedInstruments.size;
}

/**
 * Set mute state for a specific track (real-time, no reschedule).
 */
export function setTrackMuted(trackIndex: number, muted: boolean): void {
  const part = trackParts.get(trackIndex);
  if (part) {
    part.mute = muted;
  }
}

/**
 * Update all track mute states based on isAudible callback.
 * Call this when solo/mute state changes.
 */
export function updateTrackMuteStates(isAudible: (trackIndex: number) => boolean): void {
  trackParts.forEach((part, trackIndex) => {
    part.mute = !isAudible(trackIndex);
  });
}
