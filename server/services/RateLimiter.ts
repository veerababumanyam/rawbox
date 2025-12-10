// Rate limiter service for managing API quotas
import { redisClient } from '../redis-service';

export interface UsageStats {
  requestsThisHour: number;
  quotaLimit: number;
  percentUsed: number;
}

export interface ProviderQuota {
  requestsPerHour: number;
  requestsPerDay: number;
}

const PROVIDER_QUOTAS: Record<string, ProviderQuota> = {
  'google-drive': {
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  },
  'dropbox': {
    requestsPerHour: 500,
    requestsPerDay: 5000,
  },
};

export class RateLimiter {
  /**
   * Check if a request can proceed based on rate limits
   */
  async canMakeRequest(provider: string, operation: string = 'default'): Promise<boolean> {
    const hourlyKey = this.getHourlyKey(provider, operation);
    const dailyKey = this.getDailyKey(provider, operation);

    const [hourlyCount, dailyCount] = await Promise.all([
      this.getRequestCount(hourlyKey),
      this.getRequestCount(dailyKey),
    ]);

    const quota = PROVIDER_QUOTAS[provider] || { requestsPerHour: 100, requestsPerDay: 1000 };

    return hourlyCount < quota.requestsPerHour && dailyCount < quota.requestsPerDay;
  }

  /**
   * Record a request
   */
  async recordRequest(provider: string, operation: string = 'default'): Promise<void> {
    const hourlyKey = this.getHourlyKey(provider, operation);
    const dailyKey = this.getDailyKey(provider, operation);

    await Promise.all([
      this.incrementRequestCount(hourlyKey, 3600), // 1 hour TTL
      this.incrementRequestCount(dailyKey, 86400), // 24 hours TTL
    ]);
  }

  /**
   * Get current usage statistics
   */
  async getUsage(provider: string, operation: string = 'default'): Promise<UsageStats> {
    const hourlyKey = this.getHourlyKey(provider, operation);
    const requestsThisHour = await this.getRequestCount(hourlyKey);

    const quota = PROVIDER_QUOTAS[provider] || { requestsPerHour: 100, requestsPerDay: 1000 };

    return {
      requestsThisHour,
      quotaLimit: quota.requestsPerHour,
      percentUsed: (requestsThisHour / quota.requestsPerHour) * 100,
    };
  }

  /**
   * Handle rate limit error from provider
   */
  async handleRateLimitError(provider: string, retryAfter: number): Promise<void> {
    const key = `rate_limit:backoff:${provider}`;
    await redisClient.setEx(key, retryAfter, 'true');
  }

  /**
   * Check if provider is in backoff state
   */
  async isInBackoff(provider: string): Promise<boolean> {
    const key = `rate_limit:backoff:${provider}`;
    const value = await redisClient.get(key);
    return value === 'true';
  }

  /**
   * Wait with exponential backoff
   */
  async waitWithBackoff(provider: string, attempt: number): Promise<void> {
    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
    await this.sleep(backoffMs);
  }

  /**
   * Check if operation should be prioritized (critical operations)
   */
  isPriorityOperation(operation: string): boolean {
    const priorityOps = ['token_refresh', 'file_delete', 'folder_create'];
    return priorityOps.includes(operation);
  }

  /**
   * Execute operation with rate limiting
   */
  async executeWithRateLimit<T>(
    provider: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Check backoff state
    if (await this.isInBackoff(provider)) {
      throw new Error(`Provider ${provider} is in backoff state due to rate limiting`);
    }

    // Check rate limits
    if (!await this.canMakeRequest(provider, operation)) {
      // If critical operation, allow it but log warning
      if (this.isPriorityOperation(operation)) {
        console.warn(`Rate limit exceeded for ${provider}, but allowing priority operation: ${operation}`);
      } else {
        throw new Error(`Rate limit exceeded for provider: ${provider}`);
      }
    }

    // Record the request
    await this.recordRequest(provider, operation);

    // Execute the operation
    try {
      return await fn();
    } catch (error: any) {
      // Check if it's a rate limit error
      if (this.isRateLimitError(error)) {
        const retryAfter = this.parseRetryAfter(error);
        await this.handleRateLimitError(provider, retryAfter);
      }
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private getHourlyKey(provider: string, operation: string): string {
    const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    return `rate_limit:${provider}:${operation}:${hour}`;
  }

  private getDailyKey(provider: string, operation: string): string {
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `rate_limit:${provider}:${operation}:${day}`;
  }

  private async getRequestCount(key: string): Promise<number> {
    const value = await redisClient.get(key);
    return value ? parseInt(value) : 0;
  }

  private async incrementRequestCount(key: string, ttl: number): Promise<void> {
    await redisClient.incr(key);
    await redisClient.expire(key, ttl);
  }

  private isRateLimitError(error: any): boolean {
    return (
      error.status === 429 ||
      error.code === 'rate_limit_exceeded' ||
      error.message?.toLowerCase().includes('rate limit')
    );
  }

  private parseRetryAfter(error: any): number {
    // Try to parse Retry-After header or error message
    if (error.response?.headers?.['retry-after']) {
      return parseInt(error.response.headers['retry-after']);
    }
    // Default to 60 seconds
    return 60;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
