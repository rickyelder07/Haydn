/**
 * AI Composition Store — Zustand state machine for AI composition mode.
 *
 * Orchestrates the full AI composition flow:
 *   idle → questioning → answering → generating → retrying → success/fallback/error
 *
 * Key responsibilities:
 *  - Clarify phase: POST /api/ai-compose (no generateAttempt) to get questions
 *  - Answer collection: single turn (up to 3 Q&A pairs)
 *  - Generate phase: POST /api/ai-compose with generateAttempt, retry up to 3x
 *  - Validation: createDefaultPipeline() (Scale + Transition validators only)
 *  - Fallback: assembleProject() after 3 failed AI attempts
 *  - Token accumulation: cumulative across clarify and generate calls
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import type { TokenEstimate } from '@/lib/openai/tokenCounter';
import { estimateTokensAndCost, calculateActualCost } from '@/lib/openai/tokenCounter';
import { compositionToHaydnProject } from '@/lib/openai/aiComposeSchema';
import { createDefaultPipeline } from '@/lib/music-theory/validators/ValidationPipeline';
import { assembleProject } from '@/lib/nl-generation/midiAssembler';
import { useProjectStore } from '@/state/projectStore';
import type { GenerationParams } from '@/lib/openai/schemas';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AiCompositionPhase =
  | 'idle'
  | 'questioning'  // Waiting for GPT-4o clarify response
  | 'answering'    // Questions displayed, waiting for user answers
  | 'generating'   // Calling GPT-4o for MIDI JSON (attempt 1-3)
  | 'retrying'     // Validation failed, retrying
  | 'success'
  | 'fallback'     // Used template after 3 failed AI attempts
  | 'error';

export interface ClarifyingTurn {
  questions: string[]; // Up to 3 questions from GPT-4o
  answers: string[];   // One answer per question from user
}

export interface CumulativeTokenUsage {
  clarifyTokens: number;
  generateTokens: number;
  totalTokens: number;
  totalCost: number; // USD
}

// ---------------------------------------------------------------------------
// Store state interface
// ---------------------------------------------------------------------------

interface AiCompositionState {
  phase: AiCompositionPhase;
  originalPrompt: string;
  clarifyingTurn: ClarifyingTurn | null; // Single clarify turn (all questions at once)
  generateAttempt: number;               // 0-based, max 3
  tokenUsage: CumulativeTokenUsage | null;
  costEstimate: TokenEstimate | null;    // Pre-generation estimate
  lastError: string | null;

  // Actions
  startClarification: (prompt: string) => Promise<void>;
  submitAnswers: (answers: string[]) => Promise<void>;
  skipQuestions: () => Promise<void>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type ConversationMessage = { role: 'user' | 'assistant'; content: string };

/** Build clarifying history for API payload from a clarifying turn */
function buildHistory(turn: ClarifyingTurn | null): ConversationMessage[] {
  if (!turn || turn.questions.length === 0) return [];
  return [
    { role: 'assistant', content: turn.questions.join('\n') },
    { role: 'user', content: turn.answers.join('\n') },
  ];
}

/** Detect genre from free-form prompt text. Defaults to 'pop'. */
function extractGenreFromPrompt(
  prompt: string
): 'lofi' | 'trap' | 'boom-bap' | 'jazz' | 'classical' | 'pop' {
  const lower = prompt.toLowerCase();
  if (lower.includes('lofi') || lower.includes('lo-fi') || lower.includes('lo fi'))
    return 'lofi';
  if (lower.includes('trap')) return 'trap';
  if (lower.includes('boom bap') || lower.includes('boom-bap')) return 'boom-bap';
  if (lower.includes('jazz')) return 'jazz';
  if (lower.includes('classical') || lower.includes('orchestral') || lower.includes('symphony'))
    return 'classical';
  return 'pop';
}

// ---------------------------------------------------------------------------
// Internal generate loop (not part of Zustand state)
// ---------------------------------------------------------------------------

async function _runGenerate(
  prompt: string,
  turn: ClarifyingTurn | null,
  set: (partial: Partial<AiCompositionState>) => void,
  get: () => AiCompositionState
): Promise<void> {
  const pipeline = createDefaultPipeline(); // Scale + Transition only, no GenreValidator
  let previousErrors: string[] = [];

  // Accumulate clarify tokens carried in from before the generate phase
  const existingUsage = get().tokenUsage;
  const clarifyTokens = existingUsage?.clarifyTokens ?? 0;
  const clarifyTokensCost = existingUsage
    ? existingUsage.totalCost - existingUsage.generateTokens * 0 // keep clarify cost
    : 0;

  // We'll track clarify cost separately so we can accumulate correctly
  const clarifyBaseCost = existingUsage?.totalCost ?? 0;
  const clarifyBaseTokens = existingUsage?.clarifyTokens ?? 0;

  for (let attempt = 0; attempt < 3; attempt++) {
    // Update phase
    set({
      phase: attempt === 0 ? 'generating' : 'retrying',
      generateAttempt: attempt,
    });

    try {
      const response = await fetch('/api/ai-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          clarifyingHistory: buildHistory(turn),
          generateAttempt: attempt,
          validationErrors: previousErrors.length > 0 ? previousErrors : undefined,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: response.statusText }));
        const errMsg = errBody?.error ?? `HTTP ${response.status}`;
        // On non-OK response, record error and retry next iteration
        previousErrors = [errMsg];
        continue;
      }

      const data = await response.json();

      // Convert to HaydnProject
      const project = compositionToHaydnProject(data.data);

      // Validate — only error severity, skip drums (channel 9)
      const allErrors: string[] = [];
      for (const track of project.tracks) {
        if (track.channel === 9) continue; // skip percussion

        for (const note of track.notes) {
          const context = {
            note,
            track,
            project,
            editType: 'add' as const,
          };
          const result = pipeline.validate(context);
          if (!result.valid) {
            for (const err of result.errors) {
              allErrors.push(err.message);
            }
          }
        }
      }

      const uniqueErrors = [...new Set(allErrors)];

      if (uniqueErrors.length === 0) {
        // Success — accumulate token usage
        const usage = data.usage as
          | { promptTokens: number; completionTokens: number; totalTokens: number }
          | undefined;

        let generateTokens = 0;
        let generateCost = 0;
        if (usage) {
          generateTokens = usage.totalTokens;
          generateCost = calculateActualCost(usage.promptTokens, usage.completionTokens);
        }

        const cumulative: CumulativeTokenUsage = {
          clarifyTokens: clarifyBaseTokens,
          generateTokens,
          totalTokens: clarifyBaseTokens + generateTokens,
          totalCost: clarifyBaseCost + generateCost,
        };

        // Load project into app
        useProjectStore.getState().loadNewProject(project);

        set({ phase: 'success', tokenUsage: cumulative });

        // Show persistent toast — GenerationInput unmounts when project loads,
        // so the in-panel success banner is invisible. The Toaster in page.tsx
        // survives the transition and shows the token/cost summary.
        toast.success('AI composition complete!', {
          description: `${cumulative.totalTokens} tokens (clarify: ${cumulative.clarifyTokens}, generate: ${cumulative.generateTokens}) · ~$${cumulative.totalCost.toFixed(4)}`,
          duration: 8000,
        });

        return;
      }

      // Validation failed — pass errors to next attempt
      previousErrors = uniqueErrors;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      previousErrors = [errMsg];
    }
  }

  // All 3 attempts failed — fall back to assembleProject()
  set({ phase: 'fallback' });

  const genre = extractGenreFromPrompt(prompt);
  const fallbackParams: GenerationParams = {
    genre,
    tempo: 90,
    key: 'C',
    scale: 'minor',
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    structure: [
      { section: 'verse', bars: 8 },
      { section: 'chorus', bars: 8 },
    ],
    emotion: { valence: 0, arousal: 0 },
    instrumentation: [
      { role: 'drums', instrument: 0 },
      { role: 'bass', instrument: 33 },
      { role: 'chords', instrument: 4 },
      { role: 'melody', instrument: 11 },
    ],
    description: prompt,
  };

  const fallbackProject = assembleProject(fallbackParams);
  useProjectStore.getState().loadNewProject(fallbackProject);
}

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

const INITIAL_STATE: Pick<
  AiCompositionState,
  | 'phase'
  | 'originalPrompt'
  | 'clarifyingTurn'
  | 'generateAttempt'
  | 'tokenUsage'
  | 'costEstimate'
  | 'lastError'
> = {
  phase: 'idle',
  originalPrompt: '',
  clarifyingTurn: null,
  generateAttempt: 0,
  tokenUsage: null,
  costEstimate: null,
  lastError: null,
};

export const useAiCompositionStore = create<AiCompositionState>((set, get) => ({
  ...INITIAL_STATE,

  // -------------------------------------------------------------------------
  // startClarification
  // -------------------------------------------------------------------------
  startClarification: async (prompt: string) => {
    set({
      phase: 'questioning',
      originalPrompt: prompt,
      clarifyingTurn: null,
      generateAttempt: 0,
      tokenUsage: null,
      costEstimate: null,
      lastError: null,
    });

    try {
      const response = await fetch('/api/ai-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, clarifyingHistory: [] }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errBody?.error ?? `HTTP ${response.status}`);
      }

      const data = await response.json();
      // API returns { type: 'questions', data: { questions: string[] }, usage }
      const questions: string[] = data.data?.questions ?? [];

      // Accumulate clarify token usage
      const usage = data.usage as
        | { promptTokens: number; completionTokens: number; totalTokens: number }
        | undefined;

      let clarifyUsage: CumulativeTokenUsage | null = null;
      if (usage) {
        const cost = calculateActualCost(usage.promptTokens, usage.completionTokens);
        clarifyUsage = {
          clarifyTokens: usage.totalTokens,
          generateTokens: 0,
          totalTokens: usage.totalTokens,
          totalCost: cost,
        };
      }

      if (questions.length > 0) {
        set({
          phase: 'answering',
          clarifyingTurn: { questions, answers: [] },
          tokenUsage: clarifyUsage,
        });
      } else {
        // Prompt was detailed enough — skip directly to generate
        set({ tokenUsage: clarifyUsage });
        await _runGenerate(prompt, null, set, get);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ phase: 'error', lastError: errorMessage });
    }
  },

  // -------------------------------------------------------------------------
  // submitAnswers
  // -------------------------------------------------------------------------
  submitAnswers: async (answers: string[]) => {
    const { originalPrompt, clarifyingTurn } = get();
    if (!clarifyingTurn) return;

    const updatedTurn: ClarifyingTurn = { ...clarifyingTurn, answers };
    set({ clarifyingTurn: updatedTurn });

    // Estimate cost using full conversation text
    const conversationText = [
      originalPrompt,
      ...clarifyingTurn.questions,
      ...answers,
    ].join('\n');

    const systemPromptApprox =
      'You are an expert music producer and composer. Generate MIDI compositions.';
    const estimate = estimateTokensAndCost(systemPromptApprox, conversationText, 3000);
    set({ costEstimate: estimate });

    await _runGenerate(originalPrompt, updatedTurn, set, get);
  },

  // -------------------------------------------------------------------------
  // skipQuestions
  // -------------------------------------------------------------------------
  skipQuestions: async () => {
    const { originalPrompt } = get();
    set({ clarifyingTurn: null });

    // Estimate cost with just the prompt
    const systemPromptApprox =
      'You are an expert music producer and composer. Generate MIDI compositions.';
    const estimate = estimateTokensAndCost(systemPromptApprox, originalPrompt, 3000);
    set({ costEstimate: estimate });

    await _runGenerate(originalPrompt, null, set, get);
  },

  // -------------------------------------------------------------------------
  // reset
  // -------------------------------------------------------------------------
  reset: () => set({ ...INITIAL_STATE }),
}));
