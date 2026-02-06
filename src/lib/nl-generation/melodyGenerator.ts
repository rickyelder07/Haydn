/**
 * Melody track generator
 *
 * Generates melodic lines over chord progressions using weighted random walk.
 * Prefers chord tones on strong beats, stepwise motion, and scale conformance.
 */

import { Scale, Chord, Note } from 'tonal';
import type { HaydnNote } from '@/lib/midi/types';
import { GENRE_TEMPLATES } from './genreTemplates';
import type { ChordSymbol } from './chordGenerator';

// Emotion parameters
export interface Emotion {
  valence: number;  // -1 (sad) to 1 (happy)
  arousal: number;  // -1 (calm) to 1 (energetic)
}

/**
 * Generate melody track over chord progression
 *
 * @param chordSymbols - Array of chord symbols with timing
 * @param key - Root key (e.g., "C", "F#", "Bb")
 * @param scale - Scale type (e.g., "major", "minor")
 * @param genre - Genre name for template lookup
 * @param ppq - Pulses per quarter note (ticks resolution)
 * @param emotion - Valence and arousal parameters
 * @returns HaydnNote array for melody track
 */
export function generateMelodyTrack(
  chordSymbols: ChordSymbol[],
  key: string,
  scale: string,
  genre: string,
  ppq: number,
  emotion: Emotion
): HaydnNote[] {
  const notes: HaydnNote[] = [];

  // Get genre template (default to pop if not found)
  const template = GENRE_TEMPLATES[genre] || GENRE_TEMPLATES.pop;
  const config = template.melodyConfig;

  // Get scale pitch classes (chromas 0-11)
  const scaleInfo = Scale.get(`${key} ${scale}`);
  const scaleNotes = scaleInfo.notes || [];
  const scaleChromas = new Set(scaleNotes.map(n => Note.chroma(n)).filter(c => c !== undefined) as number[]);

  // Determine notes per bar based on arousal
  const arousalNormalized = (emotion.arousal + 1) / 2; // Map -1..1 to 0..1
  const notesPerBar = Math.round(
    config.noteDensityRange[0] + arousalNormalized * (config.noteDensityRange[1] - config.noteDensityRange[0])
  );

  // Start on tonic in middle of octave range
  const startOctave = config.octaveRange[0];
  let currentMidi = Note.midi(`${key}${startOctave}`) || 60;

  // Generate notes for each chord
  for (const chordSymbol of chordSymbols) {
    // Get chord tones (chromas)
    const chord = Chord.get(chordSymbol.chord);
    const chordNotes = chord.notes || [];
    const chordChromas = new Set(chordNotes.map(n => Note.chroma(n)).filter(c => c !== undefined) as number[]);

    // Calculate bars spanned by this chord
    const chordBars = Math.round(chordSymbol.durationTicks / (4 * ppq));

    // Generate notes for each bar this chord spans
    for (let bar = 0; bar < chordBars; bar++) {
      const barStartTick = chordSymbol.startTick + bar * 4 * ppq;

      // Evenly space notes within the bar
      const tickSpacing = Math.floor((4 * ppq) / notesPerBar);

      for (let noteIndex = 0; noteIndex < notesPerBar; noteIndex++) {
        const tickOffset = noteIndex * tickSpacing;
        const noteTick = barStartTick + tickOffset;

        // Determine if this is a strong beat (beats 1 and 3)
        const beatInBar = Math.floor(tickOffset / ppq);
        const isStrongBeat = beatInBar === 0 || beatInBar === 2;

        // Select next note using weighted random walk
        const nextMidi = selectNextNote(
          currentMidi,
          chordChromas,
          scaleChromas,
          isStrongBeat,
          config.octaveRange
        );

        // Determine duration (last note in phrase gets longer duration)
        const isLastNote = noteIndex === notesPerBar - 1;
        const duration = isLastNote ? ppq * 2 : ppq; // Half note vs quarter note

        // Calculate velocity with emotion modifier
        const baseVelocity = 0.7;
        const randomVariation = (Math.random() - 0.5) * 0.2; // ±0.1
        const valenceModifier = emotion.valence > 0 ? 0.05 : 0; // Happy = slightly louder
        const velocity = Math.max(0, Math.min(1, baseVelocity + randomVariation + valenceModifier));

        notes.push({
          midi: nextMidi,
          ticks: noteTick,
          durationTicks: duration,
          velocity
        });

        currentMidi = nextMidi;
      }
    }
  }

  return notes;
}

/**
 * Select next melody note using weighted random walk
 */
function selectNextNote(
  currentMidi: number,
  chordChromas: Set<number>,
  scaleChromas: Set<number>,
  isStrongBeat: boolean,
  octaveRange: [number, number]
): number {
  const currentChroma = currentMidi % 12;

  // Adjust probabilities for strong beats (prefer chord tones)
  // Strong beats: 70% chord, 25% scale, 5% chromatic
  // Weak beats: 40% chord, 40% scale, 20% chromatic
  const chordToneProb = isStrongBeat ? 0.7 : 0.4;
  const scaleToneProb = isStrongBeat ? 0.25 : 0.4;

  // Choose note type
  const rand = Math.random();
  let targetChromas: number[];

  if (rand < chordToneProb) {
    // Chord tone
    targetChromas = Array.from(chordChromas);
  } else if (rand < chordToneProb + scaleToneProb) {
    // Scale tone (not necessarily in chord)
    targetChromas = Array.from(scaleChromas);
  } else {
    // Chromatic passing tone (any note)
    targetChromas = Array.from({ length: 12 }, (_, i) => i);
  }

  // If no valid targets, fall back to scale
  if (targetChromas.length === 0) {
    targetChromas = Array.from(scaleChromas);
  }

  // If still no targets, use chromatic
  if (targetChromas.length === 0) {
    targetChromas = Array.from({ length: 12 }, (_, i) => i);
  }

  // Generate candidate MIDI notes in octave range
  const candidates: number[] = [];
  const minMidi = octaveRange[0] * 12;
  const maxMidi = (octaveRange[1] + 1) * 12 - 1;

  for (const chroma of targetChromas) {
    // Try different octaves
    for (let octave = octaveRange[0]; octave <= octaveRange[1]; octave++) {
      const midi = octave * 12 + chroma;
      if (midi >= minMidi && midi <= maxMidi) {
        candidates.push(midi);
      }
    }
  }

  // If no candidates, return current note
  if (candidates.length === 0) {
    return currentMidi;
  }

  // Apply stepwise preference: choose candidate closest to current MIDI
  // This enforces smoother melodic lines with smaller intervals
  const sorted = candidates.sort((a, b) => {
    const distA = Math.abs(a - currentMidi);
    const distB = Math.abs(b - currentMidi);
    return distA - distB;
  });

  // Always pick the closest note for strong stepwise motion
  const selectedMidi = sorted[0];

  // Clamp to valid MIDI range
  return Math.max(0, Math.min(127, selectedMidi));
}
