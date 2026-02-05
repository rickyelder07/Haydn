/**
 * Natural Language Generation Store
 *
 * Zustand store orchestrating the generation pipeline:
 * 1. User prompt -> API call to parse params
 * 2. Params -> assembleProject to generate MIDI
 * 3. Generated project -> setProject to load into app
 *
 * Tracks loading state, errors, and token usage for user feedback.
 */

import { create } from 'zustand';
import type { GenerationParams } from '@/lib/openai/schemas';
import { assembleProject } from '@/lib/nl-generation/midiAssembler';
import { useProjectStore } from './projectStore';

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface NLGenerationState {
  // Loading state
  isLoading: boolean;

  // Last generation info
  lastPrompt: string | null;
  lastParams: GenerationParams | null;
  lastError: string | null;
  tokenUsage: TokenUsage | null;

  // Actions
  submitGeneration: (prompt: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

// Token cost rates (GPT-4o pricing as of 2024)
const INPUT_COST_PER_M = 2.50;
const OUTPUT_COST_PER_M = 10.00;

/**
 * Calculate estimated cost from token usage
 */
function calculateCost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * INPUT_COST_PER_M;
  const outputCost = (completionTokens / 1_000_000) * OUTPUT_COST_PER_M;
  return inputCost + outputCost;
}

export const useNLGenerationStore = create<NLGenerationState>((set, get) => ({
  isLoading: false,
  lastPrompt: null,
  lastParams: null,
  lastError: null,
  tokenUsage: null,

  submitGeneration: async (prompt: string) => {
    // Clear previous state
    set({ isLoading: true, lastError: null, lastPrompt: prompt });

    try {
      // Step 1: Call API to parse prompt into params
      const response = await fetch('/api/nl-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse prompt');
      }

      const data = await response.json();
      const params = data.params as GenerationParams;
      const usage = data.usage;

      // Calculate token cost
      const tokenUsage: TokenUsage = {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCost: calculateCost(usage.promptTokens, usage.completionTokens)
      };

      // Step 2: Assemble MIDI project from params
      const project = assembleProject(params);

      // Step 3: Load project into app
      const { setProject } = useProjectStore.getState();
      setProject(project);

      // Update state with success
      set({
        isLoading: false,
        lastParams: params,
        tokenUsage,
        lastError: null
      });
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({
        isLoading: false,
        lastError: errorMessage,
        tokenUsage: null
      });
    }
  },

  clearError: () => set({ lastError: null }),

  reset: () => set({
    isLoading: false,
    lastPrompt: null,
    lastParams: null,
    lastError: null,
    tokenUsage: null
  })
}));
