import { z } from 'zod';
import type { HaydnProject } from '@/lib/midi/types';
import { getInstrumentName } from '@/lib/instruments/gm-mapping';

/**
 * AI Composition Schema — Zod contracts for GPT-4o AI composition mode.
 *
 * QuestionsSchema: shape of clarify response (up to 3 questions)
 * MidiCompositionSchema: shape of generate response (full MIDI composition)
 * compositionToHaydnProject: converter from AI output to HaydnProject
 *
 * PPQ = 480. Beat = 480 ticks. Bar = 1920 ticks.
 */

// ---------------------------------------------------------------------------
// QuestionsSchema — clarify phase response
// ---------------------------------------------------------------------------

export const QuestionsSchema = z.object({
  questions: z
    .array(z.string())
    .max(3)
    .describe('Up to 3 clarifying questions. Empty array if prompt is already detailed enough.'),
});

export type QuestionsResponse = z.infer<typeof QuestionsSchema>;

// ---------------------------------------------------------------------------
// MidiCompositionSchema — generate phase response
// ---------------------------------------------------------------------------

const AiNoteSchema = z.object({
  midi: z.number().int().min(0).max(127).describe('MIDI note number 0-127'),
  ticks: z.number().int().min(0).describe('Start time in ticks (PPQ=480, beat=480, bar=1920)'),
  durationTicks: z.number().int().min(1).describe('Duration in ticks; 480=quarter note'),
  velocity: z.number().min(0).max(1).describe('Note velocity 0.0-1.0; typical 0.6-0.85'),
});

const AiTrackSchema = z.object({
  name: z.string().describe('Track name e.g. "Melody - Piano"'),
  channel: z.number().int().min(0).max(15).describe('MIDI channel; 9=drums, others 0-8'),
  instrumentNumber: z.number().int().min(0).max(127).describe('GM program 0-127'),
  notes: z.array(AiNoteSchema).min(1).describe('All notes in this track'),
});

export const MidiCompositionSchema = z.object({
  genre: z.enum(['lofi', 'trap', 'boom-bap', 'jazz', 'classical', 'pop']),
  tempo: z.number().int().min(40).max(240).describe('BPM'),
  key: z.string().describe('Musical key e.g. "C", "Bb", "F#"'),
  scale: z.enum(['major', 'minor', 'harmonic minor', 'dorian', 'mixolydian']),
  tracks: z
    .array(AiTrackSchema)
    .min(1)
    .describe('All tracks; include drums on ch 9 for non-classical'),
});

export type MidiComposition = z.infer<typeof MidiCompositionSchema>;
export type AiTrack = z.infer<typeof AiTrackSchema>;
export type AiNote = z.infer<typeof AiNoteSchema>;

// ---------------------------------------------------------------------------
// Post-processing helpers
// ---------------------------------------------------------------------------

/**
 * Fix overlapping notes within each track on the same pitch.
 * Sorts notes by tick, then trims durationTicks when a note overlaps the
 * next note on the same MIDI pitch. Prevents piano roll rendering issues.
 */
function fixOverlappingNotes(project: HaydnProject): HaydnProject {
  return {
    ...project,
    tracks: project.tracks.map(track => {
      // Group notes by MIDI pitch
      const byPitch = new Map<number, typeof track.notes>();
      for (const note of track.notes) {
        const existing = byPitch.get(note.midi) ?? [];
        existing.push({ ...note });
        byPitch.set(note.midi, existing);
      }

      // Sort each pitch group by start tick, then trim overlaps
      for (const [, pitchNotes] of byPitch) {
        pitchNotes.sort((a, b) => a.ticks - b.ticks);
        for (let i = 0; i < pitchNotes.length - 1; i++) {
          const current = pitchNotes[i];
          const next = pitchNotes[i + 1];
          const currentEnd = current.ticks + current.durationTicks;
          if (currentEnd > next.ticks) {
            // Trim current note so it ends exactly when the next one starts
            current.durationTicks = Math.max(1, next.ticks - current.ticks);
          }
        }
      }

      // Rebuild notes array sorted by ticks (merge all pitch groups)
      const fixedNotes = Array.from(byPitch.values())
        .flat()
        .sort((a, b) => a.ticks - b.ticks || a.midi - b.midi);

      return { ...track, notes: fixedNotes };
    }),
  };
}

// ---------------------------------------------------------------------------
// Converter: MidiComposition -> HaydnProject
// ---------------------------------------------------------------------------

/**
 * Convert a GPT-4o MidiComposition response to a HaydnProject.
 *
 * Maps 1:1 to HaydnProject format using PPQ=480.
 * Applies fixOverlappingNotes before returning to prevent rendering issues.
 */
export function compositionToHaydnProject(comp: MidiComposition): HaydnProject {
  const ppq = 480; // GENERATED_PPQ

  const maxTick = Math.max(
    0,
    ...comp.tracks.flatMap(t => t.notes.map(n => n.ticks + n.durationTicks))
  );

  const project: HaydnProject = {
    originalFileName: null,
    sourceFormat: 'new',
    metadata: {
      name: `${comp.genre} - ${comp.key} ${comp.scale}`,
      ppq,
      tempos: [{ ticks: 0, bpm: comp.tempo }],
      timeSignatures: [{ ticks: 0, numerator: 4, denominator: 4 }],
      keySignatures: [
        {
          ticks: 0,
          key: comp.key,
          scale: comp.scale === 'major' ? 'major' : 'minor',
        },
      ],
    },
    tracks: comp.tracks.map(t => ({
      name: t.name,
      channel: t.channel,
      instrumentNumber: t.instrumentNumber,
      instrumentName: getInstrumentName(t.instrumentNumber) || 'Unknown',
      notes: t.notes,
      controlChanges: [],
    })),
    durationTicks: maxTick,
  };

  return fixOverlappingNotes(project);
}
