/**
 * AI Composition Store — Zustand state machine for AI Compose scaffold mode.
 *
 * Simplified flow:
 *   idle → generating → success | fallback | error
 *
 * Key responsibilities:
 *  - POST /api/ai-compose with { prompt, barCount } (single call, no clarify loop)
 *  - On success: loadNewProject() + store displayOutput + log scaffold-summary
 *  - On failure: assembleProject() fallback + log
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { assembleProject } from '@/lib/nl-generation/midiAssembler';
import { useProjectStore } from '@/state/projectStore';
import type { DisplayOutput } from '@/lib/scaffold/types';
import type { GenerationParams } from '@/lib/openai/schemas';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AiCompositionPhase =
  | 'idle'
  | 'generating'
  | 'success'
  | 'fallback'   // Used template after AI failure
  | 'error';

export type DebugLogType =
  | 'scaffold-request'
  | 'scaffold-response'
  | 'scaffold-summary'
  | 'fallback'
  | 'error';

export interface DebugLogEntry {
  type: DebugLogType;
  label: string;
  detail: string;
  timestamp: number; // ms since session epoch
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number; // USD estimate
}

// ---------------------------------------------------------------------------
// Store state interface
// ---------------------------------------------------------------------------

interface AiCompositionState {
  phase: AiCompositionPhase;
  originalPrompt: string;
  displayOutput: DisplayOutput | null;
  tokenUsage: TokenUsage | null;
  lastError: string | null;
  debugLogs: DebugLogEntry[];
  debugEpoch: number; // ms wall time when current session started

  // Actions
  compose: (prompt: string, barCount: number) => Promise<void>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Claude cost estimate (claude-opus-4-6 pricing as of 2025)
// ---------------------------------------------------------------------------

// Input: $15/M tokens, Output: $75/M tokens
function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75;
}

// ---------------------------------------------------------------------------
// Fallback genre detection
// ---------------------------------------------------------------------------

function extractGenreFromPrompt(
  prompt: string
): 'lofi' | 'trap' | 'boom-bap' | 'jazz' | 'classical' | 'pop' {
  const lower = prompt.toLowerCase();
  if (lower.includes('lofi') || lower.includes('lo-fi') || lower.includes('lo fi')) return 'lofi';
  if (lower.includes('trap')) return 'trap';
  if (lower.includes('boom bap') || lower.includes('boom-bap')) return 'boom-bap';
  if (lower.includes('jazz')) return 'jazz';
  if (lower.includes('classical') || lower.includes('orchestral') || lower.includes('symphony')) return 'classical';
  return 'pop';
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_STATE = {
  phase: 'idle' as AiCompositionPhase,
  originalPrompt: '',
  displayOutput: null,
  tokenUsage: null,
  lastError: null,
  debugLogs: [] as DebugLogEntry[],
  debugEpoch: 0,
};

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

export const useAiCompositionStore = create<AiCompositionState>((set, get) => ({
  ...INITIAL_STATE,

  // -------------------------------------------------------------------------
  // compose — single-call scaffold pipeline
  // -------------------------------------------------------------------------
  compose: async (prompt: string, barCount: number) => {
    const epoch = Date.now();

    const addLog = (entry: Omit<DebugLogEntry, 'timestamp'>) => {
      set(s => ({
        debugLogs: [...s.debugLogs, { ...entry, timestamp: Date.now() - epoch }],
      }));
    };

    set({
      phase: 'generating',
      originalPrompt: prompt,
      displayOutput: null,
      tokenUsage: null,
      lastError: null,
      debugEpoch: epoch,
      debugLogs: [{
        type: 'scaffold-request',
        label: 'Scaffold request sent',
        detail: `Prompt: "${prompt}"\nTarget bars: ${barCount}`,
        timestamp: 0,
      }],
    });

    try {
      const response = await fetch('/api/ai-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, barCount }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errBody?.error ?? `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.type !== 'scaffold' || !data.data?.project) {
        throw new Error('Unexpected response format from /api/ai-compose');
      }

      const { project, displayOutput } = data.data;
      const rawUsage = data.usage as { inputTokens: number; outputTokens: number; totalTokens: number };

      const tokenUsage: TokenUsage = {
        inputTokens: rawUsage.inputTokens,
        outputTokens: rawUsage.outputTokens,
        totalTokens: rawUsage.totalTokens,
        totalCost: estimateCost(rawUsage.inputTokens, rawUsage.outputTokens),
      };

      // Log scaffold response
      addLog({
        type: 'scaffold-response',
        label: `Claude responded — ${rawUsage.totalTokens} tokens`,
        detail: [
          `Key: ${displayOutput.key}`,
          `Tempo: ${displayOutput.tempo} BPM`,
          `Feel: ${displayOutput.feel}`,
          `Sections: ${displayOutput.sections.length}`,
          `Total bars: ${displayOutput.sections.reduce((s: number, sec: { bars: number }) => s + sec.bars, 0)}`,
          `Seeds used: ${displayOutput.stylisticSeedsUsed?.join(', ') ?? 'none'}`,
        ].join('\n'),
      });

      // Log scaffold summary (Roman numerals + rationale per section)
      const summaryLines = (displayOutput.sections as Array<{
        name: string;
        bars: number;
        progressionRoman: string[];
        progressionNamed: string[];
        rationale: string;
      }>).map(sec =>
        `§ ${sec.name} (${sec.bars} bars)\n` +
        `  Roman: ${sec.progressionRoman.join(' – ')}\n` +
        `  Chords: ${sec.progressionNamed.join(' – ')}\n` +
        `  ${sec.rationale}`
      );

      addLog({
        type: 'scaffold-summary',
        label: `Harmonic Analysis — ${displayOutput.title}`,
        detail: [
          `Tension Arc: ${displayOutput.tensionArc}`,
          '',
          ...summaryLines,
        ].join('\n'),
      });

      // Load project
      useProjectStore.getState().loadNewProject(project);

      set({ phase: 'success', displayOutput, tokenUsage });

      toast.success('AI composition complete!', {
        description: `${tokenUsage.totalTokens} tokens · ~$${tokenUsage.totalCost.toFixed(4)}`,
        duration: 8000,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[aiCompositionStore] compose failed:', errMsg);

      addLog({
        type: 'fallback',
        label: 'AI failed — using template fallback',
        detail: `Error: ${errMsg}\n\nFalling back to assembleProject().`,
      });

      // Fallback to template assembler
      try {
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
        set({ phase: 'fallback', lastError: errMsg });
      } catch (fallbackErr) {
        const fallbackErrMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        addLog({
          type: 'error',
          label: 'Fallback also failed',
          detail: fallbackErrMsg,
        });
        set({ phase: 'error', lastError: errMsg });
      }
    }
  },

  // -------------------------------------------------------------------------
  // reset
  // -------------------------------------------------------------------------
  reset: () => set({ ...INITIAL_STATE }),
}));
