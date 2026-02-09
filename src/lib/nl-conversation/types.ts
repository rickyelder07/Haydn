import type { EditResponse } from '@/lib/openai/schemas';

/**
 * Token usage and cost tracking for a conversation turn
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number; // In USD
}

/**
 * Result of executing edit operations from a conversation turn
 */
export interface ExecutionResult {
  success: boolean;
  appliedOps: number;
  errors: string[];
}

/**
 * A single turn in a multi-turn conversation.
 * Captures user input, GPT response, execution outcome, and token usage.
 */
export interface ConversationTurn {
  id: string; // Unique turn ID using crypto.randomUUID
  timestamp: number; // Unix timestamp
  userPrompt: string;
  assistantResponse: EditResponse;
  executionResult: ExecutionResult;
  tokenUsage: TokenUsage;
}

/**
 * A conversation session grouping multiple turns.
 * Provides context preservation across editing prompts.
 */
export interface ConversationSession {
  id: string; // Session UUID
  createdAt: number;
  lastUpdatedAt: number;
  turns: ConversationTurn[];
  title: string; // Auto-generated from first prompt, truncated to 50 chars
}
