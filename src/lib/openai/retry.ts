/**
 * Exponential backoff retry logic for OpenAI API calls.
 *
 * Handles transient failures (429 rate limits, 5xx server errors) with
 * exponential backoff and jitter to avoid thundering herd.
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitterFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
  exponentialBase: 2,
  jitterFactor: 0.3, // ±30% jitter
};

/**
 * HTTP status codes that should trigger a retry.
 * 429: Rate limit exceeded
 * 500-504: Server errors
 */
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

/**
 * Sleep helper for async delays.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable based on status code.
 */
function isRetryableError(error: unknown): boolean {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return RETRYABLE_STATUS_CODES.includes(error.status);
  }
  return false;
}

/**
 * Calculate delay with exponential backoff and jitter.
 *
 * Formula: min(initialDelay * base^attempt, maxDelay) + randomJitter
 * Jitter is ±jitterFactor of the calculated delay to prevent thundering herd.
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  const { initialDelay, maxDelay, exponentialBase, jitterFactor } = config;

  // Exponential backoff
  const exponentialDelay = initialDelay * Math.pow(exponentialBase, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add random jitter (±jitterFactor)
  const jitterRange = cappedDelay * jitterFactor;
  const jitter = (Math.random() * 2 - 1) * jitterRange; // Random between -jitterRange and +jitterRange

  return Math.max(0, cappedDelay + jitter);
}

/**
 * Wrap an async function with exponential backoff retry logic.
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration (uses DEFAULT_RETRY_CONFIG if not provided)
 * @returns Promise that resolves with fn's result or rejects after all retries exhausted
 *
 * @example
 * const result = await withExponentialBackoff(
 *   () => openai.chat.completions.create({ ... }),
 *   { maxRetries: 3 }
 * );
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Calculate delay and wait before next attempt
      const delay = calculateDelay(attempt, config);
      console.warn(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${Math.round(delay)}ms`
      );
      await sleep(delay);
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}
