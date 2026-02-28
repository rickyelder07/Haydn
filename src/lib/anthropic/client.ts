import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic client singleton for server-side API calls.
 *
 * Configuration:
 * - Reads ANTHROPIC_API_KEY from process.env
 * - 90-second timeout for scaffold generation calls
 *
 * This client runs server-side only (Next.js API routes).
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 90000,
});
