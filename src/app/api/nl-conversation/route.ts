import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { EditResponseSchema } from '@/lib/openai/schemas';
import { zodResponseFormat } from 'openai/helpers/zod';
import { withExponentialBackoff } from '@/lib/openai/retry';
import type { MIDIContext } from '@/app/api/nl-edit/route';
import {
  buildMessagesFromTurns,
  buildSystemPromptForConversation,
} from '@/lib/nl-conversation/messageBuilder';

/**
 * Maximum prompt length to prevent abuse and excessive costs.
 */
const MAX_PROMPT_LENGTH = 500;

/**
 * POST /api/nl-conversation
 *
 * Accepts a natural language prompt with conversation history and MIDI context,
 * returns structured edit operations with full conversation context.
 *
 * Request body:
 * {
 *   prompt: string,
 *   conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
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
    const { prompt, conversationHistory, context } = body as {
      prompt?: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
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

    // conversationHistory is optional (defaults to empty array for first turn)
    const history = conversationHistory || [];

    // Build system prompt from context with conversation-specific instructions
    const systemPrompt = buildSystemPromptForConversation(context);

    // Build messages array: system prompt + conversation history + new prompt
    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: prompt },
    ];

    // Call GPT-4o with retry logic
    const completion = await withExponentialBackoff(() =>
      openai.chat.completions.parse({
        model: 'gpt-4o-2024-08-06',
        messages,
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
