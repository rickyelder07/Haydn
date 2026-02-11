import { z } from 'zod';

/**
 * Zod schemas for GPT-4o structured output (OpenAI Structured Outputs API).
 *
 * IMPORTANT: Due to Structured Outputs constraints, we use a flat parameters
 * object approach instead of discriminated unions at root. All parameter fields
 * are optional, and the operation type determines which fields are relevant.
 *
 * Supported edit operations:
 * - add_notes: Add new notes to track
 * - remove_notes: Remove notes by index
 * - modify_notes: Update existing note properties
 * - transpose: Shift notes by semitones
 * - change_tempo: Update project tempo
 * - change_key: Update project key signature
 * - change_instrument: Change track instrument (GM program 0-127)
 */

// Individual parameter schemas for each operation type

const NoteSchema = z.object({
  midi: z.number().int().min(0).max(127),
  ticks: z.number().min(0),
  durationTicks: z.number().positive(),
  velocity: z.number().min(0).max(1),
});

const NoteModificationSchema = z.object({
  noteIndex: z.number().int().min(0),
  updates: z.object({
    midi: z.number().int().min(0).max(127).optional().nullable(),
    ticks: z.number().min(0).optional().nullable(),
    durationTicks: z.number().positive().optional().nullable(),
    velocity: z.number().min(0).max(1).optional().nullable(),
  }),
});

/**
 * Flat parameters object containing all possible fields for all operation types.
 * The operation type determines which fields are relevant.
 *
 * This approach avoids discriminated unions at root, which are not supported
 * by OpenAI Structured Outputs.
 */
const EditParametersSchema = z.object({
  // add_notes parameters
  notes: z.array(NoteSchema).optional().nullable(),

  // remove_notes parameters
  noteIndices: z.array(z.number().int().min(0)).optional().nullable(),

  // modify_notes parameters
  modifications: z.array(NoteModificationSchema).optional().nullable(),

  // transpose parameters
  semitones: z.number().int().min(-48).max(48).optional().nullable(),
  startTick: z.number().min(0).optional().nullable(),
  endTick: z.number().min(0).optional().nullable(),

  // change_tempo parameters
  newTempo: z.number().min(20).max(300).optional().nullable(),

  // change_key parameters
  newKey: z.string().optional().nullable(),
  newScale: z.enum(['major', 'minor']).optional().nullable(),

  // change_instrument parameters
  newInstrument: z.number().int().min(0).max(127).optional().nullable(),
});

/**
 * Single edit operation with operation type, parameters, and explanation.
 */
export const EditOperationSchema = z.object({
  operation: z.enum([
    'add_notes',
    'remove_notes',
    'modify_notes',
    'transpose',
    'change_tempo',
    'change_key',
    'change_instrument',
  ]),
  parameters: EditParametersSchema,
  explanation: z.string().describe('Description of what this operation does'),
});

/**
 * Complete structured response from GPT-4o with operations, summary, and warnings.
 */
export const EditResponseSchema = z.object({
  targetTrack: z
    .string()
    .optional()
    .nullable()
    .describe(
      'Name of the track to modify (e.g., "bass", "drums"). Only needed if user mentions a different track than the active one. Leave null to modify currently selected track.'
    ),
  operations: z.array(EditOperationSchema),
  summary: z.string().describe('Overall description of what changed'),
  warnings: z
    .array(z.string())
    .describe('Theory violations or concerns about the edit'),
});

// Inferred TypeScript types
export type EditOperation = z.infer<typeof EditOperationSchema>;
export type EditResponse = z.infer<typeof EditResponseSchema>;
export type EditParameters = z.infer<typeof EditParametersSchema>;

/**
 * Generation parameters schema for natural language MIDI generation.
 *
 * Defines structured musical parameters that GPT-4o extracts from a user's
 * generation prompt. All fields are required - GPT must fill in genre-appropriate
 * defaults for any values not explicitly specified in the prompt.
 */
export const GenerationParamsSchema = z.object({
  genre: z
    .enum(['lofi', 'trap', 'boom-bap', 'jazz', 'classical', 'pop'])
    .describe('Musical genre that determines overall style and feel'),
  tempo: z
    .number()
    .int()
    .min(40)
    .max(240)
    .describe('Tempo in beats per minute (BPM)'),
  key: z.string().describe('Musical key like "C", "D#", "Bb"'),
  scale: z
    .enum(['major', 'minor', 'harmonic minor', 'dorian', 'mixolydian'])
    .describe('Scale type that defines harmonic content'),
  timeSignatureNumerator: z
    .number()
    .int()
    .min(2)
    .max(16)
    .describe('Top number of time signature (beats per bar)'),
  timeSignatureDenominator: z
    .number()
    .int()
    .min(2)
    .max(16)
    .describe('Bottom number of time signature (note value per beat)'),
  structure: z
    .array(
      z.object({
        section: z
          .enum(['intro', 'verse', 'chorus', 'bridge', 'outro'])
          .describe('Section type'),
        bars: z
          .number()
          .int()
          .min(1)
          .max(64)
          .describe('Number of bars for this section'),
      })
    )
    .describe('Song structure as sequence of sections'),
  emotion: z
    .object({
      valence: z
        .number()
        .min(-1)
        .max(1)
        .describe('Emotional valence: happy (1) to sad (-1)'),
      arousal: z
        .number()
        .min(-1)
        .max(1)
        .describe('Energy level: energetic (1) to calm (-1)'),
    })
    .describe('Emotional character of the music'),
  instrumentation: z
    .array(
      z.object({
        role: z
          .enum(['drums', 'bass', 'melody', 'chords'])
          .describe('Musical role in the arrangement'),
        instrument: z
          .number()
          .int()
          .min(0)
          .max(127)
          .describe('General MIDI instrument number (0-127)'),
      })
    )
    .describe('Instruments and their roles in the arrangement'),
  description: z
    .string()
    .describe('Original user prompt preserved for reference'),
});

export type GenerationParams = z.infer<typeof GenerationParamsSchema>;
