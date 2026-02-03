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
    midi: z.number().int().min(0).max(127).optional(),
    ticks: z.number().min(0).optional(),
    durationTicks: z.number().positive().optional(),
    velocity: z.number().min(0).max(1).optional(),
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
  notes: z.array(NoteSchema).optional(),

  // remove_notes parameters
  noteIndices: z.array(z.number().int().min(0)).optional(),

  // modify_notes parameters
  modifications: z.array(NoteModificationSchema).optional(),

  // transpose parameters
  semitones: z.number().int().min(-48).max(48).optional(),
  startTick: z.number().min(0).optional(),
  endTick: z.number().min(0).optional(),

  // change_tempo parameters
  newTempo: z.number().min(20).max(300).optional(),

  // change_key parameters
  newKey: z.string().optional(),
  newScale: z.enum(['major', 'minor']).optional(),
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
  ]),
  parameters: EditParametersSchema,
  explanation: z.string().describe('Description of what this operation does'),
});

/**
 * Complete structured response from GPT-4o with operations, summary, and warnings.
 */
export const EditResponseSchema = z.object({
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
