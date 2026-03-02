/**
 * Tonal-based chord detection utilities.
 * Groups notes by bar and uses Chord.detect() to identify chords.
 */

import { Chord, Note } from 'tonal';
import type { HaydnNote } from '@/lib/midi/types';

export interface DetectedChord {
  bar: number;             // 0-indexed bar number
  barStartTicks: number;
  barEndTicks: number;
  symbol: string;          // e.g. "Cmaj", "Dmin", "G7"
  noteIndices: number[];   // indices into the notes array for this bar
}

/**
 * Detect chords for each bar that contains 3 or more notes.
 *
 * @param notes - All notes in the track
 * @param ppq - Pulses per quarter note (ticks per beat)
 * @param timeSignature - Time signature numerator/denominator
 * @returns Array of DetectedChord for bars where a chord was identified
 */
export function detectChordsPerBar(
  notes: HaydnNote[],
  ppq: number,
  timeSignature: { numerator: number; denominator: number }
): DetectedChord[] {
  const ticksPerBeat = ppq * (4 / timeSignature.denominator);
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;

  // Guard against degenerate inputs
  if (ticksPerBar <= 0 || notes.length === 0) return [];

  const maxTick = Math.max(...notes.map(n => n.ticks + n.durationTicks));
  const numBars = Math.ceil(maxTick / ticksPerBar);

  const result: DetectedChord[] = [];

  for (let bar = 0; bar < numBars; bar++) {
    const barStart = bar * ticksPerBar;
    const barEnd = barStart + ticksPerBar;

    // Collect indices of notes that start within this bar
    const barNoteIndices: number[] = [];
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].ticks >= barStart && notes[i].ticks < barEnd) {
        barNoteIndices.push(i);
      }
    }

    // Need at least 3 notes for chord detection
    if (barNoteIndices.length < 3) continue;

    // Get unique pitch classes for this bar
    const pitchClasses = Array.from(
      new Set(
        barNoteIndices.map(i => Note.pitchClass(Note.fromMidi(notes[i].midi) ?? ''))
      )
    ).filter(pc => pc !== '');

    // Run Tonal chord detection
    const detected = Chord.detect(pitchClasses);
    if (detected.length === 0) continue;

    // Prefer non-slash chord (root position)
    const preferred = detected.find(c => !c.includes('/')) ?? detected[0];

    // Format to short symbol
    const symbol = formatChordSymbol(preferred);
    if (symbol === null) continue;

    result.push({
      bar,
      barStartTicks: barStart,
      barEndTicks: barEnd,
      symbol,
      noteIndices: barNoteIndices,
    });
  }

  return result;
}

/**
 * Convert a full Tonal chord name (e.g. "CM", "Dm7") to a short display symbol.
 *
 * Returns null for slash chords or unrecognised chords without a tonic.
 */
export function formatChordSymbol(chordName: string): string | null {
  // Skip slash chords — they indicate inversions we don't want to display
  if (chordName.includes('/')) return null;

  const chord = Chord.get(chordName);
  if (!chord.tonic) return null;

  const suffixMap: Record<string, string> = {
    'major':              'maj',
    'minor':              'min',
    'augmented':          'aug',
    'diminished':         'dim',
    'dominant seventh':   '7',
    'major seventh':      'maj7',
    'minor seventh':      'min7',
    'diminished seventh': 'dim7',
    'half-diminished':    'm7b5',
    'suspended fourth':   'sus4',
    'suspended second':   'sus2',
  };

  const suffix = suffixMap[chord.type] ?? chord.type;
  return chord.tonic + suffix;
}
