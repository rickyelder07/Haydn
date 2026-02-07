/**
 * MIDI project assembler for natural language generation
 *
 * Combines outputs from all generators (chords, melody, bass, drums) into a
 * complete HaydnProject with metadata, tracks, and timing information.
 */

import type { HaydnProject, HaydnTrack, HaydnNote } from '@/lib/midi/types';
import type { GenerationParams } from '@/lib/openai/schemas';
import { generateChordProgression } from './chordGenerator';
import { generateMelodyTrack } from './melodyGenerator';
import { generateBassTrack } from './bassGenerator';
import { generateDrumTrack } from './rhythmGenerator';
import { getInstrumentName } from '@/lib/instruments/gm-mapping';

// Standard PPQ for generated projects
const GENERATED_PPQ = 480;

/**
 * Assemble complete HaydnProject from generation parameters
 *
 * Orchestrates all generators to produce a multi-track MIDI project from
 * structured musical parameters. Creates drums, bass, chords, and melody tracks
 * based on genre templates and user-specified instrumentation.
 *
 * @param params - Structured musical parameters from GPT-4o
 * @returns Complete HaydnProject ready to load into app
 */
export function assembleProject(params: GenerationParams): HaydnProject {
  const ppq = GENERATED_PPQ;
  const tracks: HaydnTrack[] = [];

  // Calculate total duration from structure
  const totalBars = params.structure.reduce((sum, section) => sum + section.bars, 0);
  const durationTicks = totalBars * 4 * ppq; // 4 beats per bar

  // Generate chord progression (needed by melody and bass generators)
  const { notes: chordNotes, chordSymbols } = generateChordProgression(
    params.key,
    params.scale,
    params.structure,
    params.genre,
    ppq
  );

  // Generate all tracks based on instrumentation
  console.log('[assembleProject] Processing instrumentation:', params.instrumentation);

  for (const instrument of params.instrumentation) {
    let notes: HaydnNote[] = [];
    let channel = 0;
    let instrumentNumber = instrument.instrument;
    let trackName = '';

    console.log(`[assembleProject] Generating track for role: ${instrument.role}`);

    switch (instrument.role) {
      case 'drums':
        notes = generateDrumTrack(
          params.structure,
          params.genre,
          ppq,
          params.emotion.arousal
        );
        channel = 9; // MIDI channel 10 (0-indexed as 9)
        instrumentNumber = 0; // Standard kit
        trackName = 'Drums';
        break;

      case 'bass':
        notes = generateBassTrack(
          chordSymbols,
          params.key,
          params.scale,
          params.genre,
          ppq
        );
        channel = 1;
        instrumentNumber = instrument.instrument;
        trackName = `Bass - ${getInstrumentName(instrumentNumber) || 'Unknown'}`;
        break;

      case 'chords':
        notes = chordNotes;
        channel = 2;
        instrumentNumber = instrument.instrument;
        trackName = `Chords - ${getInstrumentName(instrumentNumber) || 'Unknown'}`;
        break;

      case 'melody':
        notes = generateMelodyTrack(
          chordSymbols,
          params.key,
          params.scale,
          params.genre,
          ppq,
          params.emotion
        );
        channel = 3;
        instrumentNumber = instrument.instrument;
        trackName = `Melody - ${getInstrumentName(instrumentNumber) || 'Unknown'}`;
        break;
    }

    // Only add track if it has notes
    console.log(`[assembleProject] Role ${instrument.role} generated ${notes.length} notes`);

    if (notes.length > 0) {
      // Special handling for drums (channel 9)
      const instrumentName = channel === 9
        ? 'Standard Drum Kit'
        : getInstrumentName(instrumentNumber) || 'Unknown';

      tracks.push({
        name: trackName,
        channel,
        instrumentNumber,
        instrumentName,
        notes,
        controlChanges: []
      });
      console.log(`[assembleProject] Added track: ${trackName} with ${notes.length} notes`);
    } else {
      console.warn(`[assembleProject] Skipping ${instrument.role} track - no notes generated`);
    }
  }

  // Build metadata
  const metadata = {
    name: `${params.genre.charAt(0).toUpperCase() + params.genre.slice(1)} - ${params.key} ${params.scale}`,
    ppq,
    tempos: [{
      ticks: 0,
      bpm: params.tempo
    }],
    timeSignatures: [{
      ticks: 0,
      numerator: params.timeSignatureNumerator,
      denominator: params.timeSignatureDenominator
    }],
    keySignatures: [{
      ticks: 0,
      key: params.key,
      scale: params.scale === 'major' ? 'major' as const : 'minor' as const
    }]
  };

  return {
    originalFileName: null,
    sourceFormat: 'new',
    metadata,
    tracks,
    durationTicks
  };
}
