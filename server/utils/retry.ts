// Retry utility with exponential backoff

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

export class RetryableError extends Error {
  constructor(message: string, public readonly retryable: boolean = true) {
    super(message);
    this.name = 'RetryableError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, initialDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (error instanceof RetryableError && !error.retryable) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Wait before retrying
      await sleep(Math.min(delay, maxDelay));
      delay *= backoffMultiplier;
    }
  }

  throw new Error(
    `Operation failed after ${maxAttempts} attempts. Last error: ${lastError!.message}`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isNetworkError(error: any): boolean {
  return (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.includes('network') ||
    error.message?.includes('timeout')
  );
}

export function isRateLimitError(error: any): boolean {
  return (
    error.status === 429 ||
    error.code === 'rate_limit_exceeded' ||
    error.message?.includes('rate limit')
  );
}

export function isAuthError(error: any): boolean {
  return (
    error.status === 401 ||
    error.status === 403 ||
    error.code === 'invalid_token' ||
    error.message?.includes('authentication') ||
    error.message?.includes('authorization')
  );
}
