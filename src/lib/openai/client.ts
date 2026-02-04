import OpenAI from 'openai';

/**
 * OpenAI client singleton for server-side API calls.
 *
 * Configuration:
 * - Reads OPENAI_API_KEY from process.env
 * - 30-second timeout for API calls
 * - maxRetries: 0 (we use custom retry logic in retry.ts)
 *
 * This client runs server-side only (Next.js API routes).
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 seconds (increased for large contexts)
  maxRetries: 0, // Custom retry logic in withExponentialBackoff
});
