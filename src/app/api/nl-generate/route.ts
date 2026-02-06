import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { GenerationParamsSchema } from '@/lib/openai/schemas';
import { zodResponseFormat } from 'openai/helpers/zod';
import { withExponentialBackoff } from '@/lib/openai/retry';

/**
 * Maximum prompt length to prevent abuse and excessive costs.
 */
const MAX_PROMPT_LENGTH = 500;

/**
 * Build system prompt that instructs GPT-4o to extract generation parameters.
 *
 * Includes role, genre defaults, default structure, and instructions for
 * filling in unspecified parameters with genre-appropriate values.
 */
function buildSystemPrompt(): string {
  return `You are a music generation parameter extractor. Your job is to parse the user's natural language prompt and extract structured musical parameters.

## Genre Defaults

When the user specifies a genre, use these defaults for any unspecified parameters:

**lofi:**
- Tempo: 70-90 BPM
- Scale: minor
- Time Signature: 4/4
- Common Keys: Eb, Bb, Ab
- Emotion: valence -0.3 (slightly melancholic), arousal -0.5 (calm)
- Instruments: drums (0 - Acoustic Grand Piano for drum programming), bass (33 - Acoustic Bass), chords (4 - Electric Piano 1), melody (11 - Vibraphone)

**trap:**
- Tempo: 140-160 BPM
- Scale: minor
- Time Signature: 4/4
- Common Keys: C#m, Fm, Gm
- Emotion: valence -0.2 (dark), arousal 0.7 (high energy)
- Instruments: drums (0), bass (38 - Synth Bass 1), chords (90 - Pad 3 polysynth), melody (81 - Lead 2 sawtooth)

**boom-bap:**
- Tempo: 85-95 BPM
- Scale: minor
- Time Signature: 4/4
- Common Keys: Em, Am, Dm
- Emotion: valence 0.0 (neutral), arousal 0.3 (moderate)
- Instruments: drums (0), bass (33 - Acoustic Bass), chords (4 - Electric Piano 1), melody (65 - Alto Sax)

**jazz:**
- Tempo: 120-180 BPM
- Scale: dorian or mixolydian
- Time Signature: 4/4
- Common Keys: Bb, Eb, F
- Emotion: valence 0.4 (upbeat), arousal 0.6 (energetic)
- Instruments: drums (0), bass (32 - Acoustic Bass), chords (0 - Acoustic Grand Piano), melody (66 - Tenor Sax)

**classical:**
- Tempo: 60-120 BPM
- Scale: major or minor (depends on mood)
- Time Signature: varies (4/4 common, but 3/4, 6/8 also used)
- Common Keys: C, G, D, Am
- Emotion: varies widely (valence -0.5 to 0.8, arousal -0.3 to 0.7)
- Instruments: no drums, bass (42 - Cello), chords (0 - Acoustic Grand Piano), melody (40 - Violin)

**pop:**
- Tempo: 100-130 BPM
- Scale: major
- Time Signature: 4/4
- Common Keys: C, G, D, A
- Emotion: valence 0.5 (happy), arousal 0.5 (moderate energy)
- Instruments: drums (0), bass (33 - Acoustic Bass), chords (0 - Acoustic Grand Piano), melody (0 - Acoustic Grand Piano)

## Default Structure

If the user doesn't specify structure, use:
- intro: 4 bars
- verse: 8 bars
- chorus: 8 bars
- verse: 8 bars
- chorus: 8 bars
- outro: 4 bars

## Instructions

1. **Extract all parameters** from the user's prompt
2. **CRITICAL: User requirements ALWAYS override genre defaults**
   - If user says "with a bass part" or "with bass" → { role: "bass", instrument: <genre-bass-number> } MUST be in instrumentation
   - If user says "with piano" or "piano chords" → { role: "chords", instrument: 0 } MUST be in instrumentation
   - If user says "with melody" or "melodic" → { role: "melody", instrument: <genre-melody-number> } MUST be in instrumentation
   - If user says "with drums" or "beat" → { role: "drums", instrument: 0 } MUST be in instrumentation
3. **Validate completeness**: Before returning, verify that EVERY instrument/part mentioned in the user's prompt appears in the instrumentation array
4. **Fill in genre-appropriate defaults** ONLY for unspecified values (don't remove user-requested parts)
5. **Be smart about interpretation**: "upbeat jazz tune" → jazz genre, higher tempo (160 BPM), major scale, positive valence
6. **Preserve the original prompt** in the description field
7. **Output ONLY the structured parameters** - no explanatory text

## Instrumentation Rules

- If user mentions specific instruments (e.g., "with bass", "add piano", "include strings"), those MUST appear in the instrumentation array
- Genre defaults provide baseline instrumentation, but user requests override and extend
- Each role (drums, bass, melody, chords) can only appear once in the instrumentation array
- If user doesn't mention instrumentation at all, use the full genre default (all 4 roles)

## Examples

**Prompt:** "make a trap beat with a bass part"
→ instrumentation MUST include: [{ role: "drums", instrument: 0 }, { role: "bass", instrument: 38 }]
→ User explicitly requested bass, so it's included even if they didn't mention other parts

**Prompt:** "create a lo-fi beat"
→ instrumentation: Use all 4 default lofi roles (drums, bass, chords, melody)
→ No specific requests, so use complete genre defaults

**Prompt:** "trap beat with piano chords and heavy bass"
→ instrumentation MUST include: [{ role: "drums", instrument: 0 }, { role: "bass", instrument: 38 }, { role: "chords", instrument: 0 }]
→ User mentioned "piano chords" (instrument 0 for chords role) and "bass"

If the user doesn't specify a genre, infer it from their description or default to "pop".`;
}

/**
 * POST /api/nl-generate
 *
 * Accepts a natural language generation prompt, returns structured musical parameters.
 *
 * Request body:
 * {
 *   prompt: string
 * }
 *
 * Response:
 * {
 *   params: GenerationParams,
 *   usage: { promptTokens, completionTokens, totalTokens }
 * }
 *
 * Error responses:
 * - 400: Invalid request (missing/invalid prompt)
 * - 500: API failure (OpenAI error)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { prompt } = body as { prompt?: string };

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

    // Build system prompt
    const systemPrompt = buildSystemPrompt();

    // Call GPT-4o with retry logic
    const completion = await withExponentialBackoff(() =>
      openai.chat.completions.parse({
        model: 'gpt-4o-2024-08-06',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        response_format: zodResponseFormat(
          GenerationParamsSchema,
          'generation_params'
        ),
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

    // Debug logging to see what GPT-4o returns
    console.log('[nl-generate] User prompt:', prompt);
    console.log('[nl-generate] GPT-4o returned instrumentation:', parsed.instrumentation);

    // Server-side validation: ensure user-mentioned instruments are included
    // This is a safety net in case GPT-4o ignores the system prompt
    const promptLower = prompt.toLowerCase();
    const hasRoleInInstrumentation = (role: string) =>
      parsed.instrumentation.some(inst => inst.role === role);

    // Get genre-specific instrument numbers for filling in missing parts
    const genreDefaults: Record<string, { drums: number; bass: number; chords: number; melody: number }> = {
      trap: { drums: 0, bass: 38, chords: 90, melody: 81 },
      lofi: { drums: 0, bass: 33, chords: 4, melody: 11 },
      'boom-bap': { drums: 0, bass: 33, chords: 4, melody: 65 },
      jazz: { drums: 0, bass: 32, chords: 0, melody: 66 },
      classical: { drums: 0, bass: 42, chords: 0, melody: 40 },
      pop: { drums: 0, bass: 33, chords: 0, melody: 0 },
    };

    const defaults = genreDefaults[parsed.genre] || genreDefaults.pop;

    // Check for bass mentions
    if ((promptLower.includes('bass') || promptLower.includes('low end')) && !hasRoleInInstrumentation('bass')) {
      console.warn('[nl-generate] User mentioned bass but GPT-4o did not include it. Adding bass.');
      parsed.instrumentation.push({ role: 'bass', instrument: defaults.bass });
    }

    // Check for melody mentions
    if ((promptLower.includes('melody') || promptLower.includes('melodic') || promptLower.includes('lead')) && !hasRoleInInstrumentation('melody')) {
      console.warn('[nl-generate] User mentioned melody but GPT-4o did not include it. Adding melody.');
      parsed.instrumentation.push({ role: 'melody', instrument: defaults.melody });
    }

    // Check for chord mentions
    if ((promptLower.includes('chord') || promptLower.includes('piano') || promptLower.includes('pad')) && !hasRoleInInstrumentation('chords')) {
      console.warn('[nl-generate] User mentioned chords but GPT-4o did not include it. Adding chords.');
      parsed.instrumentation.push({ role: 'chords', instrument: defaults.chords });
    }

    // Check for drum mentions (beat, drums, rhythm)
    if ((promptLower.includes('beat') || promptLower.includes('drum') || promptLower.includes('rhythm')) && !hasRoleInInstrumentation('drums')) {
      console.warn('[nl-generate] User mentioned drums but GPT-4o did not include it. Adding drums.');
      parsed.instrumentation.push({ role: 'drums', instrument: defaults.drums });
    }

    console.log('[nl-generate] Final instrumentation after validation:', parsed.instrumentation);

    // Extract usage stats
    const usage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    return NextResponse.json({
      params: parsed,
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
