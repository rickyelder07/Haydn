/**
 * Chord progression generator
 *
 * Converts roman numeral progressions to MIDI note arrays using music theory.
 * Uses Tonal.js for theory-correct chord-in-key conversion.
 */

import { Progression, Chord, Note } from 'tonal';
import type { HaydnNote } from '@/lib/midi/types';
import { GENRE_TEMPLATES, type SectionType } from './genreTemplates';

// Song structure section
export interface StructureSection {
  section: string;
  bars: number;
}

// Chord symbol with timing information
export interface ChordSymbol {
  chord: string;           // Chord name (e.g., "Cmaj7", "Dm7")
  startTick: number;       // Start time in ticks
  durationTicks: number;   // Duration in ticks
}

// Result type for generateChordProgression
export interface ChordProgressionResult {
  notes: HaydnNote[];
  chordSymbols: ChordSymbol[];
}

/**
 * Generate chord progression as MIDI notes
 *
 * @param key - Root key (e.g., "C", "F#", "Bb")
 * @param scale - Scale type (e.g., "major", "minor")
 * @param structure - Array of sections with bar counts
 * @param genre - Genre name for template lookup
 * @param ppq - Pulses per quarter note (ticks resolution)
 * @returns HaydnNote array and chord symbols with timing
 */
export function generateChordProgression(
  key: string,
  scale: string,
  structure: StructureSection[],
  genre: string,
  ppq: number
): ChordProgressionResult {
  const notes: HaydnNote[] = [];
  const chordSymbols: ChordSymbol[] = [];

  // Get genre template (default to pop if not found)
  const template = GENRE_TEMPLATES[genre] || GENRE_TEMPLATES.pop;

  let currentTick = 0;
  const ticksPerBar = 4 * ppq; // 4 beats per bar

  for (const section of structure) {
    const sectionType = section.section as SectionType;

    // Get chord progressions for this section type (fall back to verse)
    const progressions = template.chordProgressions[sectionType] || template.chordProgressions.verse;

    // Select a progression (use first one for consistency)
    const romanNumerals = progressions[0] || ['I', 'IV', 'V', 'I'];

    // Convert roman numerals to actual chord names using Tonal.js
    let chordNames: string[];
    try {
      chordNames = Progression.fromRomanNumerals(key, romanNumerals);

      // If Tonal returns empty array, fall back to simple I-IV-V-I
      if (chordNames.length === 0) {
        chordNames = Progression.fromRomanNumerals(key, ['I', 'IV', 'V', 'I']);
      }
    } catch (error) {
      // Fall back to simple I-IV-V-I on error
      chordNames = Progression.fromRomanNumerals(key, ['I', 'IV', 'V', 'I']);
    }

    // Generate chord notes for all bars in this section
    for (let bar = 0; bar < section.bars; bar++) {
      // Cycle through chord progression
      const chordIndex = bar % chordNames.length;
      const chordName = chordNames[chordIndex];

      // Skip if chord can't be parsed
      if (!chordName || chordName === '') {
        currentTick += ticksPerBar;
        continue;
      }

      // Get chord information from Tonal.js
      const chord = Chord.get(chordName);

      if (!chord.notes || chord.notes.length === 0) {
        // Skip invalid chords
        currentTick += ticksPerBar;
        continue;
      }

      // Add chord symbol for melody/bass generators
      chordSymbols.push({
        chord: chordName,
        startTick: currentTick,
        durationTicks: ticksPerBar
      });

      // Create MIDI notes for chord voicing
      // Place notes in octave 4 (MIDI 60-72 range)
      for (const noteName of chord.notes) {
        const noteNameWithOctave = noteName + '4';
        const midi = Note.midi(noteNameWithOctave);

        // Skip if MIDI conversion failed
        if (midi === null || midi === undefined) {
          continue;
        }

        // Clamp to valid MIDI range
        const clampedMidi = Math.max(0, Math.min(127, midi));

        notes.push({
          midi: clampedMidi,
          ticks: currentTick,
          durationTicks: ticksPerBar,
          velocity: 0.6 // Chord accompaniment level
        });
      }

      currentTick += ticksPerBar;
    }
  }

  return { notes, chordSymbols };
}
