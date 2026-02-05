/**
 * Bass track generator
 *
 * Generates bass lines following chord roots with genre-specific rhythm patterns.
 * Supports root-notes, walking bass, and arpeggiated styles.
 */

import { Chord, Note } from 'tonal';
import type { HaydnNote } from '@/lib/midi/types';
import { GENRE_TEMPLATES } from './genreTemplates';
import type { ChordSymbol } from './chordGenerator';

/**
 * Generate bass track following chord progression
 *
 * @param chordSymbols - Array of chord symbols with timing
 * @param key - Root key (e.g., "C", "F#", "Bb")
 * @param scale - Scale type (e.g., "major", "minor")
 * @param genre - Genre name for template lookup
 * @param ppq - Pulses per quarter note (ticks resolution)
 * @returns HaydnNote array for bass track
 */
export function generateBassTrack(
  chordSymbols: ChordSymbol[],
  key: string,
  scale: string,
  genre: string,
  ppq: number
): HaydnNote[] {
  const notes: HaydnNote[] = [];

  // Get genre template (default to pop if not found)
  const template = GENRE_TEMPLATES[genre] || GENRE_TEMPLATES.pop;
  const config = template.bassConfig;

  // Process each chord
  for (let i = 0; i < chordSymbols.length; i++) {
    const chordSymbol = chordSymbols[i];
    const chord = Chord.get(chordSymbol.chord);

    // Get root note
    const rootNote = chord.tonic;
    if (!rootNote) {
      // Skip chords without root
      continue;
    }

    // Get next chord root for walking bass approach
    const nextChordSymbol = i < chordSymbols.length - 1 ? chordSymbols[i + 1] : null;
    const nextChord = nextChordSymbol ? Chord.get(nextChordSymbol.chord) : null;
    const nextRootNote = nextChord?.tonic;

    // Generate bass notes based on rhythm style
    switch (config.rhythmStyle) {
      case 'root-notes':
        notes.push(...generateRootNotes(chordSymbol, rootNote, config.octave, ppq));
        break;

      case 'walking':
        notes.push(...generateWalkingBass(
          chordSymbol,
          rootNote,
          chord,
          nextRootNote,
          config.octave,
          ppq
        ));
        break;

      case 'arpeggiated':
        notes.push(...generateArpeggiated(chordSymbol, chord, config.octave, ppq));
        break;
    }
  }

  return notes;
}

/**
 * Root-notes style: Play root on beat 1, sustain for full chord duration
 */
function generateRootNotes(
  chordSymbol: ChordSymbol,
  rootNote: string,
  octave: number,
  ppq: number
): HaydnNote[] {
  const midi = Note.midi(`${rootNote}${octave}`);

  if (midi === null || midi === undefined) {
    return [];
  }

  const clampedMidi = Math.max(0, Math.min(127, midi));

  return [{
    midi: clampedMidi,
    ticks: chordSymbol.startTick,
    durationTicks: chordSymbol.durationTicks,
    velocity: 0.8
  }];
}

/**
 * Walking bass style: Root on 1, 3rd on 2, 5th on 3, approach on 4
 */
function generateWalkingBass(
  chordSymbol: ChordSymbol,
  rootNote: string,
  chord: any,
  nextRootNote: string | undefined | null,
  octave: number,
  ppq: number
): HaydnNote[] {
  const notes: HaydnNote[] = [];
  const chordBars = Math.round(chordSymbol.durationTicks / (4 * ppq));

  for (let bar = 0; bar < chordBars; bar++) {
    const barStartTick = chordSymbol.startTick + bar * 4 * ppq;

    // Beat 1: Chord root
    const rootMidi = Note.midi(`${rootNote}${octave}`);
    if (rootMidi !== null && rootMidi !== undefined) {
      notes.push({
        midi: Math.max(0, Math.min(127, rootMidi)),
        ticks: barStartTick,
        durationTicks: ppq,
        velocity: 0.75 + (Math.random() - 0.5) * 0.1
      });
    }

    // Beat 2: Chord 3rd (or scale degree 3 above root)
    const thirdInterval = chord.intervals?.[1] || '3M'; // Major 3rd default
    const thirdNote = Note.transpose(rootNote, thirdInterval);
    const thirdMidi = Note.midi(`${thirdNote}${octave}`);
    if (thirdMidi !== null && thirdMidi !== undefined) {
      notes.push({
        midi: Math.max(0, Math.min(127, thirdMidi)),
        ticks: barStartTick + ppq,
        durationTicks: ppq,
        velocity: 0.75 + (Math.random() - 0.5) * 0.1
      });
    }

    // Beat 3: Chord 5th (or scale degree 5 above root)
    const fifthInterval = chord.intervals?.[2] || '5P'; // Perfect 5th default
    const fifthNote = Note.transpose(rootNote, fifthInterval);
    const fifthMidi = Note.midi(`${fifthNote}${octave}`);
    if (fifthMidi !== null && fifthMidi !== undefined) {
      notes.push({
        midi: Math.max(0, Math.min(127, fifthMidi)),
        ticks: barStartTick + ppq * 2,
        durationTicks: ppq,
        velocity: 0.75 + (Math.random() - 0.5) * 0.1
      });
    }

    // Beat 4: Chromatic approach to next chord root (one semitone below)
    if (nextRootNote && bar === chordBars - 1) {
      // Last bar of this chord - approach next chord
      const nextRootMidi = Note.midi(`${nextRootNote}${octave}`);
      if (nextRootMidi !== null && nextRootMidi !== undefined) {
        const approachMidi = nextRootMidi - 1; // One semitone below
        notes.push({
          midi: Math.max(0, Math.min(127, approachMidi)),
          ticks: barStartTick + ppq * 3,
          durationTicks: ppq,
          velocity: 0.75 + (Math.random() - 0.5) * 0.1
        });
      }
    } else {
      // Not approaching next chord - play root again
      if (rootMidi !== null && rootMidi !== undefined) {
        notes.push({
          midi: Math.max(0, Math.min(127, rootMidi)),
          ticks: barStartTick + ppq * 3,
          durationTicks: ppq,
          velocity: 0.75 + (Math.random() - 0.5) * 0.1
        });
      }
    }
  }

  return notes;
}

/**
 * Arpeggiated style: Cycle through chord tones in 8th notes
 */
function generateArpeggiated(
  chordSymbol: ChordSymbol,
  chord: any,
  octave: number,
  ppq: number
): HaydnNote[] {
  const notes: HaydnNote[] = [];

  // Get chord notes
  const chordNotes = chord.notes || [];
  if (chordNotes.length === 0) {
    return [];
  }

  // Convert to MIDI in bass octave
  const chordMidis: number[] = [];
  for (const noteName of chordNotes) {
    const midi = Note.midi(`${noteName}${octave}`);
    if (midi !== null && midi !== undefined) {
      chordMidis.push(Math.max(0, Math.min(127, midi)));
    }
  }

  if (chordMidis.length === 0) {
    return [];
  }

  // Arpeggiate at 8th notes (every ppq/2 ticks)
  const eighthNoteDuration = Math.floor(ppq / 2);
  const totalEighths = Math.floor(chordSymbol.durationTicks / eighthNoteDuration);

  for (let i = 0; i < totalEighths; i++) {
    const midi = chordMidis[i % chordMidis.length];
    const tick = chordSymbol.startTick + i * eighthNoteDuration;

    notes.push({
      midi,
      ticks: tick,
      durationTicks: eighthNoteDuration,
      velocity: 0.7
    });
  }

  return notes;
}
