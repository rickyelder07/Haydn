/**
 * Scaffold Engine — Roman numeral → MIDI resolver using Tonal.js.
 *
 * Handles:
 *  - Simple diatonic numerals: I, ii, iii, IV, V, vi, vii°
 *  - Seventh chords: Imaj7, ii7, V7, vii°7
 *  - Secondary dominants: V/V, V7/IV, viio7/vi, etc.
 *  - NUMERAL_OVERRIDES: escape hatch for edge cases found during testing
 */

import { Progression, Chord, Note, RomanNumeral } from 'tonal';
import type { ModeType, ResolvedChord, ResolvedSection, MusicSpecSection } from './types';

// ---------------------------------------------------------------------------
// Override map — add entries here when Tonal.js produces wrong results
// ---------------------------------------------------------------------------

/**
 * Map of (numeral + tonic) → forced chord name.
 * Key format: `${numeral}@${tonic}`, e.g. "bVII@C" → "Bb"
 */
export const NUMERAL_OVERRIDES: Map<string, string> = new Map([
  // Example (uncomment to activate):
  // ['bVII@C', 'Bb'],
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const PPQ = 480;
const TICKS_PER_BAR = 4 * PPQ; // 1920

/**
 * Resolve a single chord name to a ResolvedChord.
 * Uses chordName directly (already resolved by Progression.fromRomanNumerals).
 */
function chordNameToResolved(
  romanNumeral: string,
  chordName: string
): ResolvedChord | null {
  const chord = Chord.get(chordName);
  if (!chord.tonic || chord.notes.length === 0) return null;

  const midiNotes: number[] = [];
  for (const noteName of chord.notes) {
    const midi = Note.midi(`${noteName}4`);
    if (midi !== null && midi !== undefined) {
      midiNotes.push(Math.max(0, Math.min(127, midi)));
    }
  }

  if (midiNotes.length === 0) return null;

  const rootMidi = Note.midi(`${chord.tonic}4`);
  return {
    romanNumeral,
    chordName,
    pitchClasses: chord.notes,
    midiNotes,
    rootMidi: rootMidi !== null && rootMidi !== undefined
      ? Math.max(0, Math.min(127, rootMidi))
      : midiNotes[0],
  };
}

/**
 * Resolve a simple (non-secondary-dominant) Roman numeral in a given tonic.
 */
function resolveSimpleNumeral(numeral: string, tonic: string): ResolvedChord | null {
  // Check override map first
  const overrideKey = `${numeral}@${tonic}`;
  const overrideChord = NUMERAL_OVERRIDES.get(overrideKey);
  if (overrideChord) {
    return chordNameToResolved(numeral, overrideChord);
  }

  // Use Tonal.js to convert roman numeral to chord name
  let chordNames: string[];
  try {
    chordNames = Progression.fromRomanNumerals(tonic, [numeral]);
  } catch {
    return null;
  }

  const chordName = chordNames[0];
  if (!chordName) return null;

  return chordNameToResolved(numeral, chordName);
}

/**
 * Resolve a secondary dominant like V/V, V7/IV, viio7/vi.
 * Returns null if the numeral is not a secondary dominant pattern.
 */
function resolveSecondaryDominant(numeral: string, tonic: string): ResolvedChord | null {
  // Match patterns: V/V, V7/IV, viio/V, viio7/vi, etc.
  const match = numeral.match(/^(V7?|viio?7?)\/(.+)$/);
  if (!match) return null;

  const [, dominant, target] = match;

  // Resolve the target numeral in the main key to find its root note
  let targetChordName: string;
  try {
    const targetNames = Progression.fromRomanNumerals(tonic, [target]);
    targetChordName = targetNames[0];
  } catch {
    return null;
  }

  if (!targetChordName) {
    // Try RomanNumeral.get for the target
    const targetRn = RomanNumeral.get(target);
    if (targetRn.empty || !targetRn.interval) return null;
    const secondaryTonic = Note.transpose(tonic, targetRn.interval);
    const resolved = resolveSimpleNumeral(dominant, secondaryTonic);
    return resolved ? { ...resolved, romanNumeral: numeral } : null;
  }

  const targetChord = Chord.get(targetChordName);
  if (!targetChord.tonic) return null;

  // Resolve the dominant numeral in the secondary tonic's key
  const resolved = resolveSimpleNumeral(dominant, targetChord.tonic);
  return resolved ? { ...resolved, romanNumeral: numeral } : null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve an array of Roman numerals in a given key+mode to ResolvedChord[].
 *
 * Each numeral is spread across bars_per_chord ticks (default: 1 bar = 1920 ticks).
 * The returned array has one entry per numeral — timing is NOT embedded here;
 * assembleFromScaffold handles timing via section/bar math.
 */
export function resolveProgression(
  romanNumerals: string[],
  tonic: string,
  _mode: ModeType  // reserved for future mode-aware resolution
): ResolvedChord[] {
  const resolved: ResolvedChord[] = [];

  for (const numeral of romanNumerals) {
    // Try secondary dominant first
    const secondary = resolveSecondaryDominant(numeral, tonic);
    if (secondary) {
      resolved.push(secondary);
      continue;
    }

    // Fall back to simple resolution
    const simple = resolveSimpleNumeral(numeral, tonic);
    if (simple) {
      resolved.push(simple);
    } else {
      // Last resort: use I chord
      console.warn(`[resolveProgression] Could not resolve "${numeral}" in ${tonic}, using I`);
      const fallback = resolveSimpleNumeral('I', tonic);
      if (fallback) resolved.push({ ...fallback, romanNumeral: numeral });
    }
  }

  return resolved;
}

/**
 * Resolve all sections in a MusicSpec to ResolvedSection[].
 * Each section's progression is resolved per bar (cycling through the numeral array).
 */
export function resolveAllSections(
  sections: MusicSpecSection[],
  tonic: string,
  mode: ModeType
): ResolvedSection[] {
  return sections.map(section => {
    const progression = section.progression.length > 0
      ? section.progression
      : ['I', 'IV', 'V', 'I'];

    // Expand progression to cover all bars (cycling)
    const expandedNumerals: string[] = [];
    for (let bar = 0; bar < section.bars; bar++) {
      expandedNumerals.push(progression[bar % progression.length]);
    }

    const chords = resolveProgression(expandedNumerals, tonic, mode);

    return {
      name: section.name,
      bars: section.bars,
      role: section.role,
      rhythmDensity: section.rhythm_density,
      rationale: section.rationale,
      chords,
    };
  });
}

export { TICKS_PER_BAR, PPQ };
