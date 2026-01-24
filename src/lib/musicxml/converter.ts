import type {
  HaydnProject,
  HaydnTrack,
  HaydnNote,
  HaydnMetadata,
  HaydnTempo,
  HaydnTimeSignature,
  HaydnKeySignature,
  ParseResult,
} from '@/lib/midi/types';
import type { MusicXmlParseResult } from './parser';
import { parseMusicXmlFile } from './parser';

// Default PPQ for converted files
const DEFAULT_PPQ = 480;

// MusicXML note names to MIDI note numbers
const NOTE_TO_MIDI: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
};

// Key signature fifths to key name
const FIFTHS_TO_KEY: Record<number, string> = {
  '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb',
  '-2': 'Bb', '-1': 'F', '0': 'C', '1': 'G', '2': 'D',
  '3': 'A', '4': 'E', '5': 'B', '6': 'F#', '7': 'C#',
};

/**
 * Convert a MusicXML file to HaydnProject
 */
export async function convertMusicXmlFile(
  file: File
): Promise<ParseResult<HaydnProject>> {
  const parseResult = await parseMusicXmlFile(file);

  if (!parseResult.success || !parseResult.data) {
    return {
      success: false,
      error: parseResult.error || 'Failed to parse MusicXML',
    };
  }

  try {
    const project = convertMusicXmlToProject(parseResult.data, file.name);
    return {
      success: true,
      data: project,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Conversion error';
    return {
      success: false,
      error: `Failed to convert MusicXML: ${message}`,
    };
  }
}

/**
 * Convert parsed MusicXML to HaydnProject
 */
export function convertMusicXmlToProject(
  parseResult: MusicXmlParseResult,
  fileName: string
): HaydnProject {
  const { document } = parseResult;

  // Get title
  const title = getTitle(document);

  // For now, only handle partwise scores (most common)
  if (!('part' in document) || !document.part) {
    return createEmptyProject(fileName, title);
  }

  const partwiseDoc = document as any;

  // Build part name lookup
  const partNames: Record<string, string> = {};
  if (partwiseDoc['part-list']?.['score-part']) {
    const scoreParts = Array.isArray(partwiseDoc['part-list']['score-part'])
      ? partwiseDoc['part-list']['score-part']
      : [partwiseDoc['part-list']['score-part']];

    for (const sp of scoreParts) {
      if (sp.id && sp['part-name']) {
        partNames[sp.id] = sp['part-name'];
      }
    }
  }

  // Extract metadata from first measure of first part
  const metadata = extractMetadata(partwiseDoc, title);

  // Convert parts to tracks
  const tracks: HaydnTrack[] = [];
  const parts = Array.isArray(partwiseDoc.part) ? partwiseDoc.part : [partwiseDoc.part];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const partId = part.id || `part-${i}`;
    const partName = partNames[partId] || `Part ${i + 1}`;

    const track = convertPartToTrack(part, partName, i, metadata.ppq);
    tracks.push(track);
  }

  // Calculate total duration
  const durationTicks = tracks.reduce((max, track) => {
    const trackMax = track.notes.reduce((noteMax, note) => {
      const end = note.ticks + note.durationTicks;
      return end > noteMax ? end : noteMax;
    }, 0);
    return trackMax > max ? trackMax : max;
  }, 0);

  return {
    originalFileName: fileName,
    sourceFormat: 'musicxml',
    metadata,
    tracks,
    durationTicks,
  };
}

/**
 * Get title from document
 */
function getTitle(doc: any): string {
  return doc['movement-title'] || doc.work?.['work-title'] || '';
}

/**
 * Create empty project for edge cases
 */
function createEmptyProject(fileName: string, title: string): HaydnProject {
  return {
    originalFileName: fileName,
    sourceFormat: 'musicxml',
    metadata: {
      name: title,
      ppq: DEFAULT_PPQ,
      tempos: [{ ticks: 0, bpm: 120 }],
      timeSignatures: [{ ticks: 0, numerator: 4, denominator: 4 }],
      keySignatures: [],
    },
    tracks: [],
    durationTicks: 0,
  };
}

/**
 * Extract metadata from MusicXML document
 */
function extractMetadata(doc: any, title: string): HaydnMetadata {
  const tempos: HaydnTempo[] = [];
  const timeSignatures: HaydnTimeSignature[] = [];
  const keySignatures: HaydnKeySignature[] = [];

  // Get first part and first measure for initial values
  const parts = Array.isArray(doc.part) ? doc.part : [doc.part];
  const firstPart = parts[0];
  const measures = firstPart?.measure
    ? (Array.isArray(firstPart.measure) ? firstPart.measure : [firstPart.measure])
    : [];

  let divisions = 1; // MusicXML divisions per quarter note

  for (const measure of measures) {
    // Get divisions (defines timing resolution)
    if (measure.attributes?.divisions) {
      divisions = measure.attributes.divisions;
    }

    // Get tempo from direction/sound
    const directions = measure.direction
      ? (Array.isArray(measure.direction) ? measure.direction : [measure.direction])
      : [];

    for (const dir of directions) {
      if (dir.sound?.tempo && tempos.length === 0) {
        tempos.push({ ticks: 0, bpm: dir.sound.tempo });
      }
    }

    // Get time signature
    if (measure.attributes?.time && timeSignatures.length === 0) {
      const time = measure.attributes.time;
      timeSignatures.push({
        ticks: 0,
        numerator: parseInt(time.beats, 10) || 4,
        denominator: parseInt(time['beat-type'], 10) || 4,
      });
    }

    // Get key signature
    if (measure.attributes?.key && keySignatures.length === 0) {
      const key = measure.attributes.key;
      const fifths = key.fifths ?? 0;
      const mode = key.mode || 'major';
      keySignatures.push({
        ticks: 0,
        key: FIFTHS_TO_KEY[fifths.toString()] || 'C',
        scale: mode === 'minor' ? 'minor' : 'major',
      });
    }
  }

  // Defaults if not found
  if (tempos.length === 0) {
    tempos.push({ ticks: 0, bpm: 120 });
  }
  if (timeSignatures.length === 0) {
    timeSignatures.push({ ticks: 0, numerator: 4, denominator: 4 });
  }

  return {
    name: title,
    ppq: DEFAULT_PPQ,
    tempos,
    timeSignatures,
    keySignatures,
  };
}

/**
 * Convert a MusicXML part to HaydnTrack
 */
function convertPartToTrack(
  part: any,
  partName: string,
  index: number,
  ppq: number
): HaydnTrack {
  const notes: HaydnNote[] = [];
  let currentTick = 0;
  let divisions = 1;

  const measures = part.measure
    ? (Array.isArray(part.measure) ? part.measure : [part.measure])
    : [];

  for (const measure of measures) {
    // Update divisions if specified
    if (measure.attributes?.divisions) {
      divisions = measure.attributes.divisions;
    }

    const measureNotes = measure.note
      ? (Array.isArray(measure.note) ? measure.note : [measure.note])
      : [];

    for (const note of measureNotes) {
      // Skip rests
      if (note.rest) {
        // Still advance time for rests
        if (note.duration && !note.chord) {
          currentTick += durationToTicks(note.duration, divisions, ppq);
        }
        continue;
      }

      // Skip if no pitch
      if (!note.pitch) {
        continue;
      }

      // Convert pitch to MIDI note number
      const midi = pitchToMidi(note.pitch);

      // Convert duration to ticks
      const durationTicks = durationToTicks(note.duration || divisions, divisions, ppq);

      // For chord notes, don't advance the tick position
      const noteTick = note.chord ? currentTick - durationTicks : currentTick;

      notes.push({
        midi,
        ticks: Math.max(0, noteTick),
        durationTicks,
        velocity: 0.8, // Default velocity (MusicXML dynamics are complex)
      });

      // Advance time (only if not a chord tone)
      if (!note.chord) {
        currentTick += durationTicks;
      }
    }
  }

  return {
    name: partName,
    channel: index % 16, // Assign channels sequentially
    instrumentNumber: 0, // Default to piano
    instrumentName: partName,
    notes,
    controlChanges: [],
  };
}

/**
 * Convert MusicXML pitch to MIDI note number
 */
function pitchToMidi(pitch: { step: string; alter?: number; octave: number }): number {
  const step = NOTE_TO_MIDI[pitch.step.toUpperCase()] ?? 0;
  const alter = pitch.alter ?? 0;
  const octave = pitch.octave;

  // MIDI note: C4 = 60
  // MusicXML octave 4 = MIDI octave 4
  return (octave + 1) * 12 + step + alter;
}

/**
 * Convert MusicXML duration to MIDI ticks
 */
function durationToTicks(duration: number, divisions: number, ppq: number): number {
  // MusicXML duration is in divisions (per quarter note)
  // MIDI ticks are in PPQ (per quarter note)
  // So: ticks = duration * (ppq / divisions)
  return Math.round(duration * (ppq / divisions));
}
