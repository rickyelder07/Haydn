// Core note representation
export interface HaydnNote {
  midi: number;          // MIDI note number (0-127)
  ticks: number;         // Start time in MIDI ticks
  durationTicks: number; // Duration in ticks
  velocity: number;      // 0-1 normalized
}

// Control change event
export interface HaydnControlChange {
  number: number;        // CC number (0-127)
  value: number;         // CC value (0-127)
  ticks: number;         // Time in ticks
}

// Track representation
export interface HaydnTrack {
  name: string;                      // Display name (auto-generated if empty in source)
  channel: number;                   // MIDI channel (0-15)
  instrumentNumber: number;          // Program number (0-127)
  instrumentName: string;            // Human-readable instrument name
  notes: HaydnNote[];
  controlChanges: HaydnControlChange[];
}

// Time signature
export interface HaydnTimeSignature {
  ticks: number;
  numerator: number;
  denominator: number;
}

// Tempo event
export interface HaydnTempo {
  ticks: number;
  bpm: number;
}

// Key signature
export interface HaydnKeySignature {
  ticks: number;
  key: string;         // e.g., "C", "F#", "Bb"
  scale: 'major' | 'minor';
}

// Project metadata
export interface HaydnMetadata {
  name: string;
  ppq: number;                           // Pulses per quarter note (ticks resolution)
  tempos: HaydnTempo[];
  timeSignatures: HaydnTimeSignature[];
  keySignatures: HaydnKeySignature[];
}

// Complete project
export interface HaydnProject {
  originalFileName: string | null;
  sourceFormat: 'midi' | 'musicxml' | 'new';
  metadata: HaydnMetadata;
  tracks: HaydnTrack[];
  durationTicks: number;                 // Total duration in ticks
}

// Computed display values (derived from ticks, not stored)
export interface TrackDisplayInfo {
  name: string;
  instrumentName: string;
  noteCount: number;
  durationSeconds: number;
  formattedDuration: string;   // e.g., "2:34"
}

// Helper type for parsing results
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
