import type { HaydnNote, HaydnTrack, HaydnProject } from '@/lib/midi/types';

// Validation error severity
export type ValidationSeverity = 'error' | 'warning';

// Individual validation error
export interface ValidationError {
  type: 'scale' | 'progression' | 'transition' | 'genre';
  severity: ValidationSeverity;
  message: string;              // User-friendly (e.g., "F# is not in C major scale")
  technicalDetail: string;      // Dev info (e.g., "MIDI 66 pitch class 6 not in scale [0,2,4,5,7,9,11]")
  affectedMidi?: number;        // The MIDI note that caused the issue
}

// Discriminated union Result type (no library needed)
export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };

// Context passed to every validator
export interface ValidationContext {
  note: HaydnNote;               // The note being validated
  track: HaydnTrack;             // The track it belongs to
  project: HaydnProject;         // Full project for metadata access
  editType: 'add' | 'move' | 'update';
}

// Validator interface -- all validators implement this
export interface Validator {
  name: string;
  validate(context: ValidationContext): ValidationResult;
}

// Genre rule configuration (data, not code)
export interface GenreRules {
  name: string;
  displayName: string;
  allowedScales: string[];           // Tonal scale names (e.g., "minor", "harmonic minor")
  preferredIntervals: number[];      // Semitone intervals typical for genre
  avoidedIntervals: number[];        // Semitone intervals unusual for genre
  allowedChordTypes: string[];       // Tonal chord types
  strictness: 'strict' | 'moderate' | 'permissive';
}

// Note conformance info for visual feedback
export interface NoteConformance {
  midi: number;
  inScale: boolean;
  scaleName?: string;
}
