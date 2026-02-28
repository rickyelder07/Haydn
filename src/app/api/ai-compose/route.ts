import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { QuestionsSchema, MidiCompositionSchema } from '@/lib/openai/aiComposeSchema';
import { zodResponseFormat } from 'openai/helpers/zod';
import { withExponentialBackoff } from '@/lib/openai/retry';

/**
 * POST /api/ai-compose
 *
 * Unified clarify + generate endpoint for AI composition mode.
 *
 * Clarify call (no generateAttempt):
 *   Body: { prompt, clarifyingHistory? }
 *   Response: { type: 'questions', data: { questions: string[] }, usage }
 *
 * Generate call (generateAttempt present):
 *   Body: { prompt, clarifyingHistory?, generateAttempt, validationErrors? }
 *   Response: { type: 'composition', data: MidiComposition, usage }
 *
 * Error responses:
 * - 400: Invalid request (missing/invalid prompt, prompt too long)
 * - 500: OpenAI API error or parse failure
 */

// ---------------------------------------------------------------------------
// System prompt builders
// ---------------------------------------------------------------------------

function buildClarifySystemPrompt(): string {
  return `You are a music composition assistant. A user wants you to compose original MIDI music.
Ask up to 3 clarifying questions to better understand their musical vision.

Ask ONLY questions that will meaningfully change the composition:
- Mood or emotion (e.g., melancholic, energetic, peaceful)
- Length (e.g., 16 bars, 32 bars)
- Specific instruments or style elements

Rules:
- Ask at most 3 questions
- Ask all questions at once (not one at a time)
- If the user's prompt is already detailed, return an empty questions array
- Keep questions concise and non-technical`;
}

function buildGenerateSystemPrompt(): string {
  return `You are a MIDI composer. Generate a complete, original MIDI composition as structured JSON.

## Clarifying Answers (HIGHEST PRIORITY)
If the user's prompt contains a "Clarifying answers" section, those answers are hard constraints.
Apply every stated answer directly to the composition:
- Stated mood/emotion → shape velocity, note density, melodic contour, and harmonic choices
- Stated length in bars → target exactly that number of bars
- Stated instruments or sounds → use those as the track roles
- Stated key or scale → use that key and scale throughout
- Stated tempo → use that BPM
- Stated style or genre → reflect it in rhythm, harmony, and instrumentation
Answers override all defaults. Do not ignore them.

## Timing Rules (CRITICAL)
PPQ (Pulses Per Quarter Note) = 480
- Beat 1 of bar 1 = tick 0
- Each beat = 480 ticks
- Bar length (4/4) = 4 beats × 480 = 1920 ticks
- Bar 2 beat 1 = 1920, bar 3 beat 1 = 3840, bar 3 beat 2 = 3840 + 480 = 4320
- Align ALL note start times to beat grid (multiples of 480)

## Bar Count (CRITICAL)
If the user specifies a number of bars, you MUST fill the entire length. Short compositions will be rejected.
- 4 bars  = last note ends near tick 7680
- 8 bars  = last note ends near tick 15360
- 12 bars = last note ends near tick 23040
- 16 bars = last note ends near tick 30720
- 32 bars = last note ends near tick 61440
Rules: start at tick 0, continue through the target tick, repeat and develop patterns across ALL bars.
Do NOT stop writing notes at bar 4 when more bars are requested.

## Composition Rules
- If no bar count is specified, default to 8 bars. Never exceed 32 bars.
- Use multiple tracks: drums on channel 9, melodic tracks on channels 0-3
- Velocity: 0.0-1.0 range (typical notes: 0.6-0.85, accents: 0.9)
- Do NOT overlap notes on the same pitch in the same track
- Drums use channel 9 (GM standard percussion map: kick=36, snare=38, hihat=42/44/46)

## Quality Standards
- Produce musical, rhythmically coherent output
- Bass notes should mostly align with chord root notes
- Melodies should move mostly by steps with occasional leaps
- Include dynamics: vary velocity across notes (not all identical)`;
}

// ---------------------------------------------------------------------------
// Clarify handler
// ---------------------------------------------------------------------------

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

async function handleClarify(
  prompt: string,
  history: ChatMessage[]
): Promise<NextResponse> {
  try {
    const completion = await withExponentialBackoff(() =>
      openai.chat.completions.parse({
        model: 'gpt-4o-2024-08-06',
        messages: [
          { role: 'system', content: buildClarifySystemPrompt() },
          { role: 'user', content: prompt },
          ...history,
        ],
        response_format: zodResponseFormat(QuestionsSchema, 'questions'),
      })
    );

    const parsed = completion.choices[0]?.message?.parsed;

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse GPT-4o clarify response' },
        { status: 500 }
      );
    }

    const usage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    return NextResponse.json({ type: 'questions', data: parsed, usage });
  } catch (error) {
    console.error('[ai-compose] handleClarify error:', error);
    return NextResponse.json(
      { error: 'Clarify phase failed', message: String(error) },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Generate handler
// ---------------------------------------------------------------------------

/**
 * Merges the original prompt and Q&A history into a single enriched user message
 * so the model cannot miss the answers when generating under Structured Outputs.
 */
function buildEnrichedPrompt(prompt: string, history: ChatMessage[]): string {
  const questionsMsg = history.find(m => m.role === 'assistant');
  const answersMsg = history.findLast(m => m.role === 'user');
  if (!questionsMsg || !answersMsg) return prompt;

  const questions = questionsMsg.content.split('\n').filter(Boolean);
  const answers = answersMsg.content.split('\n').filter(Boolean);

  const qaLines = questions
    .map((q, i) => `Q: ${q}\nA: ${answers[i] ?? '(no answer)'}`)
    .join('\n\n');

  return `${prompt}\n\nClarifying answers:\n${qaLines}`;
}

async function handleGenerate(
  prompt: string,
  history: ChatMessage[],
  attempt: number,
  validationErrors?: string[]
): Promise<NextResponse> {
  try {
    const enrichedPrompt = buildEnrichedPrompt(prompt, history);

    const messages: ChatMessage[] = [
      { role: 'system', content: buildGenerateSystemPrompt() },
      { role: 'user', content: enrichedPrompt },
    ];

    // On retry attempts, append correction context
    if (attempt > 0 && validationErrors?.length) {
      messages.push({
        role: 'user',
        content: `Previous attempt failed music theory validation:\n${validationErrors.join('\n')}\nPlease fix these issues in the new composition.`,
      });
    }

    const completion = await withExponentialBackoff(() =>
      openai.chat.completions.parse({
        model: 'gpt-4o-2024-08-06',
        messages,
        response_format: zodResponseFormat(MidiCompositionSchema, 'midi_composition'),
      })
    );

    const parsed = completion.choices[0]?.message?.parsed;

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse GPT-4o composition response' },
        { status: 500 }
      );
    }

    const usage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    return NextResponse.json({ type: 'composition', data: parsed, usage });
  } catch (error) {
    console.error('[ai-compose] handleGenerate error:', error);
    return NextResponse.json(
      { error: 'Generate phase failed', message: String(error) },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Main POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Parse request body
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    prompt,
    clarifyingHistory = [],
    generateAttempt,
    validationErrors,
  } = body as {
    prompt?: unknown;
    clarifyingHistory?: ChatMessage[];
    generateAttempt?: number;
    validationErrors?: string[];
  };

  // Validate prompt
  if (!prompt || typeof prompt !== 'string' || prompt.length === 0) {
    return NextResponse.json(
      { error: 'Missing or invalid prompt' },
      { status: 400 }
    );
  }

  if (prompt.length > 500) {
    return NextResponse.json(
      { error: 'Prompt exceeds 500 character limit' },
      { status: 400 }
    );
  }

  // Dispatch to correct handler based on generateAttempt presence
  if (generateAttempt !== undefined) {
    return handleGenerate(prompt, clarifyingHistory, generateAttempt, validationErrors);
  } else {
    return handleClarify(prompt, clarifyingHistory);
  }
}
