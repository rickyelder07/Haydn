import { encodingForModel } from 'js-tiktoken';

/**
 * Token counting and cost estimation for GPT-4o API calls.
 *
 * Uses js-tiktoken to accurately count tokens using GPT-4o's tokenizer.
 * Provides cost estimates based on current OpenAI pricing.
 */

/**
 * GPT-4o pricing (as of 2025-01-01).
 * Prices in USD per token.
 */
export const GPT4O_PRICING = {
  input: 2.5 / 1_000_000, // $2.50 per 1M input tokens
  output: 10.0 / 1_000_000, // $10.00 per 1M output tokens
};

/**
 * Threshold for warning about expensive prompts.
 * When estimated cost exceeds this, isExpensive flag is set.
 */
export const EXPENSIVE_PROMPT_THRESHOLD = 0.5; // $0.50

export interface TokenEstimate {
  inputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  isExpensive: boolean;
}

/**
 * Estimate token count and cost for a GPT-4o API call.
 *
 * @param systemPrompt - System message content
 * @param userPrompt - User message content
 * @param estimatedOutputSize - Estimated number of output tokens (default: 500)
 * @returns Token estimate with cost and expense warning
 *
 * Note: js-tiktoken v1.x uses automatic garbage collection for encoders.
 * No manual cleanup required.
 */
export function estimateTokensAndCost(
  systemPrompt: string,
  userPrompt: string,
  estimatedOutputSize = 500
): TokenEstimate {
  // Create tokenizer encoder for GPT-4o
  const enc = encodingForModel('gpt-4o');

  // Count input tokens (system + user messages)
  const systemTokens = enc.encode(systemPrompt).length;
  const userTokens = enc.encode(userPrompt).length;
  const inputTokens = systemTokens + userTokens;

  // Total tokens (input + estimated output)
  const totalTokens = inputTokens + estimatedOutputSize;

  // Calculate estimated cost
  const inputCost = inputTokens * GPT4O_PRICING.input;
  const outputCost = estimatedOutputSize * GPT4O_PRICING.output;
  const estimatedCost = inputCost + outputCost;

  // Flag if expensive
  const isExpensive = estimatedCost > EXPENSIVE_PROMPT_THRESHOLD;

  return {
    inputTokens,
    estimatedOutputTokens: estimatedOutputSize,
    totalTokens,
    estimatedCost,
    isExpensive,
  };
}

/**
 * Calculate actual cost from token usage returned by OpenAI API.
 *
 * @param promptTokens - Actual input tokens used
 * @param completionTokens - Actual output tokens used
 * @returns Total cost in USD
 */
export function calculateActualCost(
  promptTokens: number,
  completionTokens: number
): number {
  const inputCost = promptTokens * GPT4O_PRICING.input;
  const outputCost = completionTokens * GPT4O_PRICING.output;
  return inputCost + outputCost;
}

/**
 * Format token count and cost for display.
 *
 * @param tokens - Number of tokens
 * @param cost - Cost in USD
 * @returns Formatted string like "450 tokens (~$0.003)"
 */
export function formatCost(tokens: number, cost: number): string {
  return `${tokens} tokens (~$${cost.toFixed(3)})`;
}
