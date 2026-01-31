import { Note, Scale } from 'tonal';

/**
 * Converts a MIDI note number to a pitch class (0-11)
 * @param midi MIDI note number (0-127)
 * @returns Pitch class (0-11) where C=0, C#=1, D=2, etc.
 */
export function midiToPitchClass(midi: number): number {
  return midi % 12;
}

/**
 * Converts a MIDI note number to a note name with octave
 * @param midi MIDI note number (0-127)
 * @returns Note name like "C4", "F#5", "Bb3"
 */
export function midiToNoteName(midi: number): string {
  return Note.fromMidi(midi);
}

/**
 * Converts a MIDI note number to a pitch class name (no octave)
 * @param midi MIDI note number (0-127)
 * @returns Pitch class name like "C", "F#", "Bb"
 */
export function midiToPitchClassName(midi: number): string {
  const noteName = Note.fromMidi(midi);
  return Note.pitchClass(noteName);
}

/**
 * Checks if a MIDI note is in a given scale using enharmonic-safe comparison
 * @param midiNote MIDI note number (0-127)
 * @param scaleName Tonal scale name (e.g., "C major", "A minor")
 * @returns true if the note's pitch class is in the scale, false otherwise
 */
export function isNoteInScale(midiNote: number, scaleName: string): boolean {
  const scale = Scale.get(scaleName);

  // Permissive: if scale is invalid or empty, return true (don't block on bad data)
  if (!scale.notes || scale.notes.length === 0) {
    return true;
  }

  const noteName = Note.fromMidi(midiNote);
  const noteChroma = Note.chroma(noteName);

  // Use chroma comparison for enharmonic equivalence (F# vs Gb both have chroma 6)
  return scale.notes.some(scaleNote => Note.chroma(scaleNote) === noteChroma);
}

/**
 * Gets all pitch classes (0-11) in a scale
 * @param scaleName Tonal scale name (e.g., "C major", "A minor")
 * @returns Array of pitch class numbers, empty array if scale is invalid
 */
export function getScaleNotes(scaleName: string): number[] {
  const scale = Scale.get(scaleName);

  if (!scale.notes || scale.notes.length === 0) {
    return [];
  }

  return scale.notes.map(note => Note.chroma(note) as number);
}

/**
 * Convenience function to get scale pitch classes as a Set for fast lookup
 * @param key Root note (e.g., "C", "F#", "Bb")
 * @param scale Scale type (e.g., "major", "minor", "harmonic minor")
 * @returns Set of pitch class numbers (0-11)
 */
export function getScalePitchClasses(key: string, scale: string): Set<number> {
  const scaleName = `${key} ${scale}`;
  const pitchClasses = getScaleNotes(scaleName);
  return new Set(pitchClasses);
}
