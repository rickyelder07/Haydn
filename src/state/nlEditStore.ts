import { create } from 'zustand';
import type { EditResponse } from '@/lib/openai/schemas';
import { buildMIDIContext } from '@/lib/nl-edit/contextBuilder';
import { executeEditOperations } from '@/lib/nl-edit/editExecutor';

/**
 * Token usage and cost tracking
 */
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number; // In USD
}

/**
 * NL edit state
 */
interface NLEditState {
  isLoading: boolean;
  lastPrompt: string | null;
  lastResult: EditResponse | null;
  lastError: string | null;
  tokenUsage: TokenUsage | null;
}

/**
 * NL edit actions
 */
interface NLEditActions {
  submitPrompt: (prompt: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

/**
 * GPT-4o pricing (as of 2024-08-06 model)
 * Input: $2.50 per million tokens
 * Output: $10.00 per million tokens
 */
const INPUT_COST_PER_MILLION = 2.5;
const OUTPUT_COST_PER_MILLION = 10.0;

/**
 * Calculate estimated cost in USD from token usage
 */
function calculateCost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (completionTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  return inputCost + outputCost;
}

/**
 * NL edit store manages the full async pipeline:
 * 1. Build MIDI context from current project/track state
 * 2. Call OpenAI API with prompt and context
 * 3. Execute returned operations on project state
 * 4. Track loading/error/success states and token usage
 */
export const useNLEditStore = create<NLEditState & NLEditActions>(
  (set, get) => ({
    // Initial state
    isLoading: false,
    lastPrompt: null,
    lastResult: null,
    lastError: null,
    tokenUsage: null,

    /**
     * Submit a natural language prompt for editing.
     *
     * Orchestrates the full flow:
     * - Build MIDI context from current project/track
     * - POST to /api/nl-edit
     * - Execute returned operations
     * - Update state with result/error
     */
    submitPrompt: async (prompt: string) => {
      // Set loading state, clear previous error
      set({ isLoading: true, lastError: null });

      try {
        // Step 1: Build MIDI context
        let context;
        try {
          context = buildMIDIContext();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to build context';
          set({
            lastError: message,
            isLoading: false,
          });
          return;
        }

        // Step 2: Call API
        const response = await fetch('/api/nl-edit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            context,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `API error: ${response.statusText}`
          );
        }

        // Step 3: Parse response
        const data = await response.json();
        const result = data.result as EditResponse;
        const usage = data.usage as {
          promptTokens: number;
          completionTokens: number;
          totalTokens: number;
        };

        // Calculate cost
        const estimatedCost = calculateCost(
          usage.promptTokens,
          usage.completionTokens
        );

        const tokenUsage: TokenUsage = {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          estimatedCost,
        };

        // Step 4: Execute operations
        const executionResult = executeEditOperations(result.operations);

        // Check for execution errors
        if (!executionResult.success) {
          const errorMessage = `Execution errors: ${executionResult.errors.join(', ')}`;
          set({
            lastError: errorMessage,
            lastPrompt: prompt,
            lastResult: result,
            tokenUsage,
            isLoading: false,
          });
          return;
        }

        // Success - update state
        set({
          lastPrompt: prompt,
          lastResult: result,
          tokenUsage,
          isLoading: false,
          lastError: null,
        });
      } catch (error) {
        // Handle fetch/parse errors
        const message =
          error instanceof Error ? error.message : 'Unknown error occurred';
        set({
          lastError: message,
          isLoading: false,
        });
      }
    },

    /**
     * Clear the last error
     */
    clearError: () => {
      set({ lastError: null });
    },

    /**
     * Reset all state
     */
    reset: () => {
      set({
        lastPrompt: null,
        lastResult: null,
        lastError: null,
        tokenUsage: null,
      });
    },
  })
);
