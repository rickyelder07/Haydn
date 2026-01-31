import type { GenreRules } from '../types';

// Genre preset keys
export type GenrePresetKey = 'classical' | 'jazz' | 'trap' | 'pop' | 'none';

// Genre rule presets as plain data
export const GENRE_PRESETS: Record<GenrePresetKey, GenreRules> = {
  classical: {
    name: 'classical',
    displayName: 'Classical',
    allowedScales: ['major', 'minor', 'harmonic minor'],
    preferredIntervals: [2, 3, 4, 5, 7], // Major 2nd, minor 3rd, major 3rd, perfect 4th, perfect 5th
    avoidedIntervals: [6], // Tritone (augmented 4th/diminished 5th)
    allowedChordTypes: ['major', 'minor', 'diminished', 'augmented'],
    strictness: 'strict',
  },

  jazz: {
    name: 'jazz',
    displayName: 'Jazz',
    allowedScales: ['major', 'dorian', 'mixolydian', 'lydian', 'altered'],
    preferredIntervals: [3, 4, 10, 11], // Minor 3rd, major 3rd, minor 7th, major 7th
    avoidedIntervals: [], // Jazz is permissive
    allowedChordTypes: [
      'major',
      'minor',
      'dominant',
      'major7',
      'minor7',
      'dominant7',
      'diminished7',
      'half-diminished7',
    ],
    strictness: 'permissive',
  },

  trap: {
    name: 'trap',
    displayName: 'Trap',
    allowedScales: ['minor', 'harmonic minor', 'phrygian'],
    preferredIntervals: [1, 3, 6], // Minor 2nd, minor 3rd, tritone
    avoidedIntervals: [4, 5, 11], // Major 3rd, perfect 4th, major 7th (less common)
    allowedChordTypes: ['minor', 'diminished', 'minor7'],
    strictness: 'moderate',
  },

  pop: {
    name: 'pop',
    displayName: 'Pop',
    allowedScales: ['major', 'minor', 'mixolydian'],
    preferredIntervals: [3, 4, 5, 7], // Major 3rd, perfect 4th, perfect 5th, perfect 5th
    avoidedIntervals: [1, 6, 11], // Minor 2nd, tritone, major 7th
    allowedChordTypes: ['major', 'minor', 'major7', 'minor7', 'dominant7'],
    strictness: 'moderate',
  },

  none: {
    name: 'none',
    displayName: 'No Genre Constraints',
    allowedScales: [],
    preferredIntervals: [],
    avoidedIntervals: [],
    allowedChordTypes: [],
    strictness: 'permissive',
  },
};
