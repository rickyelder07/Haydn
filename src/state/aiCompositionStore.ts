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

export type DebugLogType =
  | 'clarify-request'
  | 'clarify-response'
  | 'generate-request'
  | 'generate-response'
  | 'validation-pass'
  | 'validation-fail'
  | 'fallback';

export interface DebugLogEntry {
  type: DebugLogType;
  label: string;
  detail: string;
  timestamp: number; // ms since session epoch
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
  debugLogs: DebugLogEntry[];
  debugEpoch: number;                    // ms wall time when current session started

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
  get: () => AiCompositionState,
  epoch: number
): Promise<void> {
  const pipeline = createDefaultPipeline(); // Scale + Transition only, no GenreValidator
  let previousErrors: string[] = [];

  const addLog = (entry: Omit<DebugLogEntry, 'timestamp'>) => {
    set({ debugLogs: [...get().debugLogs, { ...entry, timestamp: Date.now() - epoch }] });
  };

  // We'll track clarify cost separately so we can accumulate correctly
  const existingUsage = get().tokenUsage;
  const clarifyBaseCost = existingUsage?.totalCost ?? 0;
  const clarifyBaseTokens = existingUsage?.clarifyTokens ?? 0;

  const history = buildHistory(turn);

  for (let attempt = 0; attempt < 3; attempt++) {
    // Update phase
    set({
      phase: attempt === 0 ? 'generating' : 'retrying',
      generateAttempt: attempt,
    });

    const historyDesc = turn
      ? `${turn.questions.length} Q&A pair(s) included`
      : 'No clarifying Q&A (skipped or not asked)';
    const errorsDesc = previousErrors.length > 0
      ? `Correction errors from attempt ${attempt}: ${previousErrors.join(' | ')}`
      : '';

    addLog({
      type: 'generate-request',
      label: `Generate — attempt ${attempt + 1}/3`,
      detail: [
        `Prompt: "${prompt}"`,
        historyDesc,
        errorsDesc,
      ].filter(Boolean).join('\n'),
    });

    try {
      const response = await fetch('/api/ai-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          clarifyingHistory: history,
          generateAttempt: attempt,
          validationErrors: previousErrors.length > 0 ? previousErrors : undefined,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: response.statusText }));
        const errMsg = errBody?.error ?? `HTTP ${response.status}`;
        previousErrors = [errMsg];
        addLog({ type: 'validation-fail', label: `HTTP error on attempt ${attempt + 1}`, detail: errMsg });
        continue;
      }

      const data = await response.json();
      const comp = data.data;

      // Log what GPT-4o returned
      const totalNotes = comp.tracks?.reduce((sum: number, t: { notes: unknown[] }) => sum + (t.notes?.length ?? 0), 0) ?? 0;
      const maxTick = comp.tracks?.flatMap((t: { notes: { ticks: number; durationTicks: number }[] }) => t.notes.map((n) => n.ticks + n.durationTicks)).reduce((a: number, b: number) => Math.max(a, b), 0) ?? 0;
      const approxBars = Math.round(maxTick / 1920);
      const trackList = comp.tracks?.map((t: { name: string; channel: number }) => `${t.name} (ch${t.channel})`).join(', ') ?? '';
      addLog({
        type: 'generate-response',
        label: `GPT-4o response — ${comp.tempo} BPM, ${comp.key} ${comp.scale}, ~${approxBars} bars`,
        detail: [
          `Tempo: ${comp.tempo} BPM`,
          `Key: ${comp.key} ${comp.scale}`,
          `Genre label: ${comp.genre}`,
          `Tracks (${comp.tracks?.length ?? 0}): ${trackList}`,
          `Total notes: ${totalNotes}`,
          `Approximate length: ${approxBars} bars`,
        ].join('\n'),
      });

      // Bar count check — reject early if composition is significantly too short
      const barMatch = prompt.match(/(\d+)\s*bars?/i);
      if (barMatch) {
        const requestedBars = parseInt(barMatch[1], 10);
        const targetTicks = requestedBars * 1920;
        if (approxBars < Math.floor(requestedBars * 0.6)) {
          addLog({
            type: 'validation-fail',
            label: `Too short: ~${approxBars} bars generated, ${requestedBars} requested`,
            detail: `Composition spans ~${maxTick} ticks (~${approxBars} bars). Target: ${requestedBars} bars = ${targetTicks} ticks.`,
          });
          previousErrors = [
            `Composition is only ~${approxBars} bars but ${requestedBars} bars were requested. ` +
            `Target end tick is ${targetTicks} (${requestedBars} × 1920 ticks/bar). ` +
            `Extend all tracks so notes continue through tick ${targetTicks}. Repeat and develop your patterns to fill the full length.`,
          ];
          continue;
        }
      }

      // Convert to HaydnProject
      const project = compositionToHaydnProject(comp);

      // Validate — threshold-based scale check + other validators
      const allErrors: string[] = [];
      let melodicNoteCount = 0;
      let scaleViolationCount = 0;

      for (const track of project.tracks) {
        if (track.channel === 9) continue; // skip percussion

        for (const note of track.notes) {
          melodicNoteCount++;
          const context = {
            note,
            track,
            project,
            editType: 'add' as const,
          };
          const result = pipeline.validate(context);
          if (!result.valid) {
            for (const err of result.errors) {
              if (err.type === 'scale') {
                scaleViolationCount++;
              } else {
                allErrors.push(err.message);
              }
            }
          }
        }
      }

      // Only fail on scale violations if >25% of melodic notes are out of scale.
      // Below this threshold, violations are likely intentional chromatic notes.
      const SCALE_THRESHOLD = 0.25;
      if (melodicNoteCount > 0 && scaleViolationCount / melodicNoteCount > SCALE_THRESHOLD) {
        const rate = Math.round((scaleViolationCount / melodicNoteCount) * 100);
        const ks = project.metadata.keySignatures[0];
        const keyDesc = ks ? `${ks.key} ${ks.scale}` : 'the declared key';
        allErrors.push(
          `${rate}% of melodic notes fall outside ${keyDesc} — the declared key likely doesn't match the notes written. ` +
          `Either use a more appropriate key/scale declaration, or adjust the notes to fit ${keyDesc}.`
        );
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

        const noteCount = project.tracks.reduce((s, t) => s + t.notes.length, 0);
        addLog({
          type: 'validation-pass',
          label: `Validation passed — ${noteCount} notes checked`,
          detail: `All non-drum notes conform to ${comp.key} ${comp.scale}. Loaded into piano roll.`,
        });

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
      addLog({
        type: 'validation-fail',
        label: `Validation failed — ${uniqueErrors.length} error(s)`,
        detail: uniqueErrors.map(e => `• ${e}`).join('\n'),
      });
      previousErrors = uniqueErrors;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      previousErrors = [errMsg];
      addLog({ type: 'validation-fail', label: `Exception on attempt ${attempt + 1}`, detail: errMsg });
    }
  }

  // All 3 attempts failed — fall back to assembleProject()
  addLog({
    type: 'fallback',
    label: 'Fallback triggered — all 3 attempts failed',
    detail: `Last errors:\n${previousErrors.map(e => `• ${e}`).join('\n')}\n\nUsing template assembler (assembleProject).`,
  });
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
  | 'debugLogs'
  | 'debugEpoch'
> = {
  phase: 'idle',
  originalPrompt: '',
  clarifyingTurn: null,
  generateAttempt: 0,
  tokenUsage: null,
  costEstimate: null,
  lastError: null,
  debugLogs: [],
  debugEpoch: 0,
};

export const useAiCompositionStore = create<AiCompositionState>((set, get) => ({
  ...INITIAL_STATE,

  // -------------------------------------------------------------------------
  // startClarification
  // -------------------------------------------------------------------------
  startClarification: async (prompt: string) => {
    const epoch = Date.now();

    const addLog = (entry: Omit<DebugLogEntry, 'timestamp'>) => {
      set({ debugLogs: [...get().debugLogs, { ...entry, timestamp: Date.now() - epoch }] });
    };

    set({
      phase: 'questioning',
      originalPrompt: prompt,
      clarifyingTurn: null,
      generateAttempt: 0,
      tokenUsage: null,
      costEstimate: null,
      lastError: null,
      debugEpoch: epoch,
      debugLogs: [{ type: 'clarify-request', label: 'Clarify request sent', detail: `Prompt: "${prompt}"`, timestamp: 0 }],
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
        addLog({
          type: 'clarify-response',
          label: `${questions.length} clarifying question(s) received`,
          detail: questions.map((q, i) => `${i + 1}. ${q}`).join('\n'),
        });
        set({
          phase: 'answering',
          clarifyingTurn: { questions, answers: [] },
          tokenUsage: clarifyUsage,
        });
      } else {
        addLog({
          type: 'clarify-response',
          label: 'No questions — prompt detailed enough, skipping to generate',
          detail: 'GPT-4o returned an empty questions array.',
        });
        // Prompt was detailed enough — skip directly to generate
        set({ tokenUsage: clarifyUsage });
        await _runGenerate(prompt, null, set, get, epoch);
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

    await _runGenerate(originalPrompt, updatedTurn, set, get, get().debugEpoch);
  },

  // -------------------------------------------------------------------------
  // skipQuestions
  // -------------------------------------------------------------------------
  skipQuestions: async () => {
    const { originalPrompt, debugEpoch } = get();
    set({ clarifyingTurn: null });

    // Estimate cost with just the prompt
    const systemPromptApprox =
      'You are an expert music producer and composer. Generate MIDI compositions.';
    const estimate = estimateTokensAndCost(systemPromptApprox, originalPrompt, 3000);
    set({ costEstimate: estimate });

    await _runGenerate(originalPrompt, null, set, get, debugEpoch);
  },

  // -------------------------------------------------------------------------
  // reset
  // -------------------------------------------------------------------------
  reset: () => set({ ...INITIAL_STATE }),
}));
