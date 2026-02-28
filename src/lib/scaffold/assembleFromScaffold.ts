/**
 * Scaffold Engine — MusicSpec + ResolvedSection[] → HaydnProject assembler.
 *
 * Builds a full HaydnProject from the scaffold pipeline output:
 *  1. Chord track   — pre-resolved MIDI notes from Tonal.js
 *  2. Bass track    — generateBassTrack() with ChordSymbols derived from resolved chords
 *  3. Drum track    — generateDrumTrack() with genre_hint from LLM spec
 */

import type { HaydnProject, HaydnTrack, HaydnNote } from '@/lib/midi/types';
import type { MusicSpec, ResolvedSection, ResolvedChord } from './types';
import { TICKS_PER_BAR, PPQ } from './resolveProgression';
import { generateBassTrack } from '@/lib/nl-generation/bassGenerator';
import { generateDrumTrack } from '@/lib/nl-generation/rhythmGenerator';
import { getInstrumentName } from '@/lib/instruments/gm-mapping';
import type { ChordSymbol, StructureSection } from '@/lib/nl-generation/chordGenerator';
import { GENRE_TEMPLATES } from '@/lib/nl-generation/genreTemplates';

// ---------------------------------------------------------------------------
// Section name normalization for drum template lookup
// ---------------------------------------------------------------------------

const ROLE_MAP: Record<string, string> = {
  verse: 'verse',
  chorus: 'chorus',
  bridge: 'bridge',
  intro: 'intro',
  outro: 'outro',
  'pre-chorus': 'verse',
  prechorus: 'verse',
  breakdown: 'bridge',
  hook: 'chorus',
  refrain: 'chorus',
  interlude: 'bridge',
};

function normalizeRole(role: string): string {
  const lower = role.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
  return ROLE_MAP[lower] ?? ROLE_MAP[lower.replace(/-/g, '')] ?? 'verse';
}

// ---------------------------------------------------------------------------
// Fix overlapping notes (moved from aiComposeSchema.ts)
// ---------------------------------------------------------------------------

function fixOverlappingNotes(project: HaydnProject): HaydnProject {
  return {
    ...project,
    tracks: project.tracks.map(track => {
      const byPitch = new Map<number, typeof track.notes>();
      for (const note of track.notes) {
        const existing = byPitch.get(note.midi) ?? [];
        existing.push({ ...note });
        byPitch.set(note.midi, existing);
      }

      for (const [, pitchNotes] of byPitch) {
        pitchNotes.sort((a, b) => a.ticks - b.ticks);
        for (let i = 0; i < pitchNotes.length - 1; i++) {
          const current = pitchNotes[i];
          const next = pitchNotes[i + 1];
          const currentEnd = current.ticks + current.durationTicks;
          if (currentEnd > next.ticks) {
            current.durationTicks = Math.max(1, next.ticks - current.ticks);
          }
        }
      }

      const fixedNotes = Array.from(byPitch.values())
        .flat()
        .sort((a, b) => a.ticks - b.ticks || a.midi - b.midi);

      return { ...track, notes: fixedNotes };
    }),
  };
}

// ---------------------------------------------------------------------------
// Instrument number lookup from genre template
// ---------------------------------------------------------------------------

function getChordsInstrument(genre: string): number {
  const template = GENRE_TEMPLATES[genre] ?? GENRE_TEMPLATES.pop;
  return template?.defaultInstrumentation?.chords ?? 4; // default: Electric Piano 1
}

function getBassInstrument(genre: string): number {
  const template = GENRE_TEMPLATES[genre] ?? GENRE_TEMPLATES.pop;
  return template?.defaultInstrumentation?.bass ?? 32; // default: Acoustic Bass
}

// ---------------------------------------------------------------------------
// Flat ChordSymbol list from resolved sections
// ---------------------------------------------------------------------------

/**
 * Convert ResolvedSection[] to a flat ChordSymbol[] with absolute tick positions.
 * One ChordSymbol per bar (each resolved chord spans exactly one bar).
 */
function buildChordSymbols(sections: ResolvedSection[]): ChordSymbol[] {
  const symbols: ChordSymbol[] = [];
  let currentTick = 0;

  for (const section of sections) {
    for (const chord of section.chords) {
      symbols.push({
        chord: chord.chordName,
        startTick: currentTick,
        durationTicks: TICKS_PER_BAR,
      });
      currentTick += TICKS_PER_BAR;
    }
  }

  return symbols;
}

// ---------------------------------------------------------------------------
// Chord track notes from resolved chords
// ---------------------------------------------------------------------------

/**
 * Build chord track HaydnNote[] from resolved sections.
 * Chord tones at octave 4, root doubling at octave 2 (bass register).
 */
function buildChordTrackNotes(sections: ResolvedSection[]): HaydnNote[] {
  const notes: HaydnNote[] = [];
  let currentTick = 0;

  for (const section of sections) {
    for (const chord of section.chords) {
      // Chord tones at octave 4 (midiNotes already resolved at oct 4)
      for (const midi of chord.midiNotes) {
        notes.push({
          midi: Math.max(0, Math.min(127, midi)),
          ticks: currentTick,
          durationTicks: TICKS_PER_BAR - 10, // slight release before next chord
          velocity: 0.62,
        });
      }
      currentTick += TICKS_PER_BAR;
    }
  }

  return notes;
}

// ---------------------------------------------------------------------------
// StructureSection list for drum generator
// ---------------------------------------------------------------------------

function buildStructureSections(sections: ResolvedSection[]): StructureSection[] {
  return sections.map(section => ({
    section: normalizeRole(section.role),
    bars: section.bars,
  }));
}

// ---------------------------------------------------------------------------
// Main assembler
// ---------------------------------------------------------------------------

/**
 * Assemble a complete HaydnProject from the scaffold pipeline output.
 *
 * @param spec          - Claude-generated MusicSpec
 * @param resolvedSections - Tonal.js resolved chord data per section
 * @returns HaydnProject ready for loadNewProject()
 */
export function assembleFromScaffold(
  spec: MusicSpec,
  resolvedSections: ResolvedSection[]
): HaydnProject {
  const tonic = spec.key;
  const genre = spec.genre_hint;
  const tracks: HaydnTrack[] = [];

  // --- Chord track ---
  const chordNotes = buildChordTrackNotes(resolvedSections);
  const chordsInstrumentNumber = getChordsInstrument(genre);
  if (chordNotes.length > 0) {
    tracks.push({
      name: `Chords - ${getInstrumentName(chordsInstrumentNumber) || 'Piano'}`,
      channel: 2,
      instrumentNumber: chordsInstrumentNumber,
      instrumentName: getInstrumentName(chordsInstrumentNumber) || 'Piano',
      notes: chordNotes,
      controlChanges: [],
    });
  }

  // --- Bass track ---
  const chordSymbols = buildChordSymbols(resolvedSections);
  const bassNotes = generateBassTrack(chordSymbols, tonic, spec.mode, genre, PPQ);
  const bassInstrumentNumber = getBassInstrument(genre);
  if (bassNotes.length > 0) {
    tracks.push({
      name: `Bass - ${getInstrumentName(bassInstrumentNumber) || 'Bass'}`,
      channel: 1,
      instrumentNumber: bassInstrumentNumber,
      instrumentName: getInstrumentName(bassInstrumentNumber) || 'Bass',
      notes: bassNotes,
      controlChanges: [],
    });
  }

  // --- Drum track ---
  const structureSections = buildStructureSections(resolvedSections);
  if (genre !== 'classical') {
    const drumNotes = generateDrumTrack(structureSections, genre, PPQ, 0);
    if (drumNotes.length > 0) {
      tracks.push({
        name: 'Drums',
        channel: 9,
        instrumentNumber: 0,
        instrumentName: 'Standard Drum Kit',
        notes: drumNotes,
        controlChanges: [],
      });
    }
  }

  // --- Metadata ---
  const totalBars = resolvedSections.reduce((sum, s) => sum + s.bars, 0);
  const durationTicks = totalBars * TICKS_PER_BAR;
  const scaleForMeta = spec.mode === 'major' ? 'major' as const : 'minor' as const;

  const project: HaydnProject = {
    originalFileName: null,
    sourceFormat: 'new',
    metadata: {
      name: `${spec.feel} — ${spec.key} ${spec.mode}`,
      ppq: PPQ,
      tempos: [{ ticks: 0, bpm: spec.tempo_bpm }],
      timeSignatures: [{ ticks: 0, numerator: 4, denominator: 4 }],
      keySignatures: [{ ticks: 0, key: spec.key, scale: scaleForMeta }],
    },
    tracks,
    durationTicks,
  };

  return fixOverlappingNotes(project);
}

// ---------------------------------------------------------------------------
// Re-export for convenience
// ---------------------------------------------------------------------------

export type { ResolvedChord };
