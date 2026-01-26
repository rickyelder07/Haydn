import { Midi, Track as ToneTrack } from '@tonejs/midi';
import type {
  HaydnProject,
  HaydnTrack,
  HaydnNote,
  HaydnControlChange,
  HaydnMetadata,
  HaydnTempo,
  HaydnTimeSignature,
  HaydnKeySignature,
  ParseResult,
} from './types';
import { validateMidiFile, hasValidMidiHeader } from './validator';
import {
  getInstrumentName,
  isPercussionChannel,
  getPercussionTrackName,
} from '@/lib/instruments/gm-mapping';

/**
 * Parse a MIDI file into HaydnProject format
 * Validates the file before parsing
 */
export async function parseMidiFile(file: File): Promise<ParseResult<HaydnProject>> {
  // Validate first
  const validation = await validateMidiFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Double-check header (defensive)
    if (!hasValidMidiHeader(arrayBuffer)) {
      return {
        success: false,
        error: 'Invalid MIDI file format',
      };
    }

    // Parse with @tonejs/midi
    const midi = new Midi(arrayBuffer);

    // Convert to HaydnProject
    const project = convertMidiToProject(midi, file.name);

    return {
      success: true,
      data: project,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parsing error';
    return {
      success: false,
      error: `Failed to parse MIDI file: ${message}`,
    };
  }
}

/**
 * Parse MIDI from ArrayBuffer directly (for testing or when file already loaded)
 */
export function parseMidiFromBuffer(
  buffer: ArrayBuffer,
  fileName: string = 'Untitled.mid'
): ParseResult<HaydnProject> {
  if (!hasValidMidiHeader(buffer)) {
    return {
      success: false,
      error: 'Invalid MIDI file format',
    };
  }

  try {
    const midi = new Midi(buffer);
    const project = convertMidiToProject(midi, fileName);
    return {
      success: true,
      data: project,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parsing error';
    return {
      success: false,
      error: `Failed to parse MIDI: ${message}`,
    };
  }
}

/**
 * Convert @tonejs/midi Midi object to HaydnProject
 */
function convertMidiToProject(midi: Midi, fileName: string): HaydnProject {
  const metadata = extractMetadata(midi);

  // Convert all tracks
  const allTracks = midi.tracks.map((track) =>
    convertTrack(track)
  );

  // Filter out empty tracks (no notes)
  // Many MIDI files have conductor/metadata tracks or empty channel tracks
  const tracks = allTracks.filter(track => track.notes.length > 0);

  // Calculate total duration in ticks
  const durationTicks = tracks.reduce((max, track) => {
    const trackMax = track.notes.reduce((noteMax, note) => {
      const endTick = note.ticks + note.durationTicks;
      return endTick > noteMax ? endTick : noteMax;
    }, 0);
    return trackMax > max ? trackMax : max;
  }, 0);

  return {
    originalFileName: fileName,
    sourceFormat: 'midi',
    metadata,
    tracks,
    durationTicks,
  };
}

/**
 * Extract metadata from MIDI header
 */
function extractMetadata(midi: Midi): HaydnMetadata {
  // Tempos - @tonejs/midi provides tempos array
  const tempos: HaydnTempo[] = midi.header.tempos.map((t) => ({
    ticks: t.ticks,
    bpm: t.bpm,
  }));

  // If no tempo events, MIDI defaults to 120 BPM
  if (tempos.length === 0) {
    tempos.push({ ticks: 0, bpm: 120 });
  }

  // Time signatures
  const timeSignatures: HaydnTimeSignature[] = midi.header.timeSignatures.map((ts) => ({
    ticks: ts.ticks,
    numerator: ts.timeSignature[0],
    denominator: ts.timeSignature[1],
  }));

  // Default 4/4 if none specified
  if (timeSignatures.length === 0) {
    timeSignatures.push({ ticks: 0, numerator: 4, denominator: 4 });
  }

  // Key signatures
  const keySignatures: HaydnKeySignature[] = midi.header.keySignatures.map((ks) => ({
    ticks: ks.ticks,
    key: ks.key,
    scale: ks.scale as 'major' | 'minor',
  }));

  return {
    name: midi.header.name || '',
    ppq: midi.header.ppq,
    tempos,
    timeSignatures,
    keySignatures,
  };
}

/**
 * Convert a single track to HaydnTrack format
 */
function convertTrack(track: ToneTrack): HaydnTrack {
  const channel = track.channel;
  const isPercussion = isPercussionChannel(channel);

  // Get instrument info
  const instrumentNumber = track.instrument?.number ?? 0;
  let instrumentName: string;

  if (isPercussion) {
    instrumentName = getPercussionTrackName();
  } else {
    instrumentName = track.instrument?.name || getInstrumentName(instrumentNumber);
  }

  // Generate track name if not provided
  let name = track.name;
  if (!name || name.trim() === '') {
    // Auto-generate based on instrument
    name = isPercussion
      ? 'Drums'
      : `${instrumentName} Track`;
  }

  // Convert notes
  const notes: HaydnNote[] = track.notes.map((note) => ({
    midi: note.midi,
    ticks: note.ticks,
    durationTicks: note.durationTicks,
    velocity: note.velocity,
  }));

  // Convert control changes
  // track.controlChanges is indexed by CC number
  const controlChanges: HaydnControlChange[] = [];
  if (track.controlChanges) {
    Object.entries(track.controlChanges).forEach(([ccNumber, events]) => {
      events.forEach((event) => {
        controlChanges.push({
          number: parseInt(ccNumber, 10),
          value: Math.round(event.value * 127), // @tonejs/midi normalizes to 0-1
          ticks: event.ticks,
        });
      });
    });
  }

  // Sort control changes by time
  controlChanges.sort((a, b) => a.ticks - b.ticks);

  return {
    name,
    channel,
    instrumentNumber,
    instrumentName,
    notes,
    controlChanges,
  };
}

// Re-export types for convenience
export type { ParseResult };
