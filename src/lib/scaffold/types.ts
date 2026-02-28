/**
 * Scaffold Engine — TypeScript interfaces for the AI Compose scaffold pipeline.
 *
 * Flow:
 *   User prompt → Claude (MusicSpec) → resolveProgression() (ResolvedSection[])
 *   → assembleFromScaffold() (HaydnProject) + DisplayOutput
 */

// ---------------------------------------------------------------------------
// LLM output
// ---------------------------------------------------------------------------

export type GenreHint = 'lofi' | 'trap' | 'boom-bap' | 'jazz' | 'classical' | 'pop';
export type ModeType = 'major' | 'minor' | 'dorian' | 'mixolydian' | 'harmonic minor';

export interface MusicSpecSection {
  /** Human-readable section name, e.g. "Verse 1", "Chorus", "Bridge" */
  name: string;
  /** Number of bars in this section (typically 4 or 8) */
  bars: number;
  /** Section role used for drum pattern lookup: "verse" | "chorus" | "bridge" | "intro" | "outro" */
  role: string;
  /** Roman numeral chord progression, e.g. ["I", "V", "vi", "IV"] */
  progression: string[];
  /** Note density 0.0–1.0 for rhythm/bass variation */
  rhythm_density: number;
  /** Explanation of why this harmonic choice fits the section */
  rationale: string;
}

export interface MusicSpec {
  /** Root key, e.g. "C", "F#", "Bb" */
  key: string;
  /** Scale/mode */
  mode: ModeType;
  /** Tempo in BPM (40–240) */
  tempo_bpm: number;
  /** Time signature string, e.g. "4/4" */
  time_signature: string;
  /** Descriptive feel/vibe */
  feel: string;
  /** Stylistic seeds selected by the LLM from STYLISTIC_SEED_VOCABULARY */
  stylistic_seeds: string[];
  /** Narrative description of tension arc across sections */
  tension_arc: string;
  /** Genre hint for drum/bass generator template lookup */
  genre_hint: GenreHint;
  /** Ordered list of sections comprising the full piece */
  sections: MusicSpecSection[];
}

// ---------------------------------------------------------------------------
// Tonal.js resolution output
// ---------------------------------------------------------------------------

export interface ResolvedChord {
  /** Original Roman numeral as given by LLM, e.g. "V/V" */
  romanNumeral: string;
  /** Tonal.js chord name, e.g. "Cmaj7", "Dm", "G7" */
  chordName: string;
  /** Pitch classes (note names without octave), e.g. ["C", "E", "G"] */
  pitchClasses: string[];
  /** MIDI note numbers at octave 4 (chord register) */
  midiNotes: number[];
  /** Root MIDI note at octave 4; used to derive bass note (subtract 24 for oct 2) */
  rootMidi: number;
}

export interface ResolvedSection {
  name: string;
  bars: number;
  role: string;
  rhythmDensity: number;
  rationale: string;
  chords: ResolvedChord[];
}

// ---------------------------------------------------------------------------
// Display output (shown in debug panel and future UI)
// ---------------------------------------------------------------------------

export interface DisplaySection {
  name: string;
  role: string;
  bars: number;
  progressionRoman: string[];
  progressionNamed: string[];
  rationale: string;
}

export interface DisplayOutput {
  title: string;
  key: string;
  tempo: number;
  feel: string;
  tensionArc: string;
  stylisticSeedsUsed: string[];
  sections: DisplaySection[];
}
