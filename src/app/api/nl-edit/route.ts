import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { EditResponseSchema } from '@/lib/openai/schemas';
import { zodResponseFormat } from 'openai/helpers/zod';
import { withExponentialBackoff } from '@/lib/openai/retry';
import type { HaydnNote, HaydnTrack, HaydnProject } from '@/lib/midi/types';
import type { ValidationError } from '@/lib/music-theory/types';
import type { GenrePresetKey } from '@/lib/music-theory/rules/genres';

/**
 * MIDI context provided to GPT-4o for natural language editing.
 *
 * Contains current track, other track summaries, project metadata,
 * and optional theory validation state.
 */
export interface MIDIContext {
  currentTrack: HaydnTrack;
  otherTracks: Array<{
    name: string;
    noteCount: number;
    lowestNote: number;
    highestNote: number;
    instrumentName: string;
  }>;
  project: {
    tempo: number;
    timeSignatureNumerator: number;
    timeSignatureDenominator: number;
    ppq: number;
    keySignature?: {
      key: string;
      scale: 'major' | 'minor';
    };
  };
  theoryValidation?: {
    enabled: boolean;
    genre: GenrePresetKey;
    currentScale?: string;
    recentErrors?: ValidationError[];
  };
}

/**
 * Maximum prompt length to prevent abuse and excessive costs.
 */
const MAX_PROMPT_LENGTH = 500;

/**
 * Build system prompt that provides GPT-4o with full MIDI context.
 *
 * Includes project metadata, current track notes, other track summaries,
 * and optional theory validation state. Instructs GPT to output structured
 * edit operations using ticks (not measures) for precise timing.
 */
function buildSystemPrompt(context: MIDIContext): string {
  const { currentTrack, otherTracks, project, theoryValidation } = context;

  let prompt = `You are a MIDI editing assistant. The user will describe edits to make to their MIDI track. Your job is to output structured edit operations.

## Project Context

- **Tempo:** ${project.tempo} BPM
- **Time Signature:** ${project.timeSignatureNumerator}/${project.timeSignatureDenominator}
- **PPQ (Pulses Per Quarter Note):** ${project.ppq} ticks
${project.keySignature ? `- **Key Signature:** ${project.keySignature.key} ${project.keySignature.scale}` : ''}

## Current Track

**Name:** ${currentTrack.name}
**Instrument:** ${currentTrack.instrumentName} (Program ${currentTrack.instrumentNumber})
**Channel:** ${currentTrack.channel}
**Note Count:** ${currentTrack.notes.length}

**Notes (in chronological order):**
\`\`\`json
${JSON.stringify(currentTrack.notes, null, 2)}
\`\`\`

## Other Tracks (for context)

${otherTracks.map((t) => `- **${t.name}** (${t.instrumentName}): ${t.noteCount} notes, range MIDI ${t.lowestNote}-${t.highestNote}`).join('\n')}
`;

  // Add theory validation context if enabled
  if (theoryValidation?.enabled) {
    prompt += `\n## Music Theory Validation

- **Validation Enabled:** Yes
- **Genre Constraint:** ${theoryValidation.genre}
${theoryValidation.currentScale ? `- **Current Scale:** ${theoryValidation.currentScale}` : ''}
${theoryValidation.recentErrors && theoryValidation.recentErrors.length > 0 ? `\n**Recent Validation Errors:**\n${theoryValidation.recentErrors.map((e) => `- ${e.message}`).join('\n')}` : ''}

⚠️ **Important:** Any notes you add or modify MUST conform to the current scale and genre rules. If the edit would violate theory rules, warn the user in the warnings array.
`;
  }

  prompt += `\n## Instructions

1. **Time is in TICKS, not measures.** Use the PPQ value to calculate tick positions.
2. **MIDI numbers** are 0-127 (C4 = 60, A4 = 69).
3. **Velocity** is 0-1 (0 = silent, 1 = maximum).
4. **Preserve musical coherence.** Consider the existing notes and other tracks.
5. **Output structured edit operations** using the provided schema.
6. **Be conservative.** If the request is ambiguous, make minimal changes and explain in warnings.
${theoryValidation?.enabled ? '7. **Validate theory conformance.** Warn if edits would violate scale or genre rules.' : ''}

## Available Operations

- **add_notes:** Add new notes to the track
- **remove_notes:** Remove notes by index (array position in notes array)
- **modify_notes:** Update existing note properties (midi, ticks, durationTicks, velocity)
- **transpose:** Shift notes by semitones (optionally within tick range)
- **change_tempo:** Update project tempo (affects all tracks)
- **change_key:** Update project key signature (affects all tracks)
- **change_instrument:** Change track instrument using GM program number (0-127, e.g., 65=Alto Sax, 66=Tenor Sax, 0=Acoustic Grand Piano)
`;

  return prompt;
}

/**
 * POST /api/nl-edit
 *
 * Accepts a natural language prompt and MIDI context, returns structured edit operations.
 *
 * Request body:
 * {
 *   prompt: string,
 *   context: MIDIContext
 * }
 *
 * Response:
 * {
 *   result: EditResponse,
 *   usage: { promptTokens, completionTokens, totalTokens }
 * }
 *
 * Error responses:
 * - 400: Invalid request (missing/invalid fields)
 * - 500: API failure (OpenAI error)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { prompt, context } = body as {
      prompt?: string;
      context?: MIDIContext;
    };

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt field' },
        { status: 400 }
      );
    }

    if (prompt.length === 0) {
      return NextResponse.json(
        { error: 'Prompt cannot be empty' },
        { status: 400 }
      );
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    // Validate context
    if (!context || typeof context !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid context field' },
        { status: 400 }
      );
    }

    // Build system prompt from context
    const systemPrompt = buildSystemPrompt(context);

    // Call GPT-4o with retry logic
    const completion = await withExponentialBackoff(() =>
      openai.chat.completions.parse({
        model: 'gpt-4o-2024-08-06',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        response_format: zodResponseFormat(EditResponseSchema, 'edit_response'),
      })
    );

    // Extract parsed response
    const parsed = completion.choices[0]?.message?.parsed;

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse GPT-4o response' },
        { status: 500 }
      );
    }

    // Extract usage stats
    const usage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    return NextResponse.json({
      result: parsed,
      usage,
    });
  } catch (error) {
    console.error('API route error:', error);

    // Return appropriate error response
    if (error && typeof error === 'object' && 'status' in error) {
      return NextResponse.json(
        { error: 'OpenAI API error', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}
