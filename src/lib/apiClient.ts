import { supabase } from '@/integrations/supabase/client';

/**
 * API Client with resilience patterns:
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Error categorization
 * - Offline detection
 */

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

// In-flight request deduplication
const inflightRequests = new Map<string, Promise<any>>();

type RetryOptions = {
  maxRetries?: number;
  baseDelay?: number;
  shouldRetry?: (error: any) => boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public retryable: boolean,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRetryableError(error: any): boolean {
  if (!navigator.onLine) return false;
  const status = error?.status || error?.statusCode;
  // Retry on 429 (rate limited), 500, 502, 503, 504
  return [429, 500, 502, 503, 504].includes(status);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function resilientFetch<T>(
  fn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = MAX_RETRIES, baseDelay = BASE_DELAY, shouldRetry = isRetryableError } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await fn();

      if (error) {
        if (attempt < maxRetries && shouldRetry(error)) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
          console.warn(`[Resilient] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`, error.message);
          await sleep(delay);
          lastError = error;
          continue;
        }
        throw new ApiError(
          error.message || 'API Error',
          error.status || 500,
          shouldRetry(error),
          error
        );
      }

      return data as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      lastError = err;
      if (attempt < maxRetries && shouldRetry(err)) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        await sleep(delay);
        continue;
      }
      throw new ApiError(
        (err as Error).message || 'Unknown error',
        500,
        false,
        err
      );
    }
  }

  throw new ApiError(lastError?.message || 'Max retries exceeded', 503, true, lastError);
}

/**
 * Deduplicated fetch - prevents multiple identical requests from firing simultaneously
 */
export async function deduplicatedFetch<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, promise);
  return promise;
}

/**
 * API Gateway client - routes through the rate-limited, cached gateway
 */
export async function apiGateway<T>(
  action: string,
  params?: Record<string, any>,
  cacheTtl?: number
): Promise<T> {
  return resilientFetch<T>(async () => {
    const result = await supabase.functions.invoke('api-gateway', {
      body: { action, params, cache_ttl: cacheTtl },
    });
    if (result.error) return { data: null, error: result.error };
    return { data: result.data as T, error: null };
  });
}

/**
 * Health check - returns system health status
 */
export async function checkHealth(): Promise<any> {
  const { data, error } = await supabase.functions.invoke('health-check', {});
  if (error) throw error;
  return data;
}

/**
 * Offline-aware wrapper that queues operations when offline
 */
const offlineQueue: Array<{ fn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }> = [];

export function onlineAwareFetch<T>(fn: () => Promise<T>): Promise<T> {
  if (navigator.onLine) return fn();

  return new Promise((resolve, reject) => {
    offlineQueue.push({ fn, resolve, reject });
    console.warn(`[Offline] Request queued. Queue size: ${offlineQueue.length}`);
  });
}

// Process offline queue when connection returns
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log(`[Online] Processing ${offlineQueue.length} queued requests`);
    const queue = [...offlineQueue];
    offlineQueue.length = 0;

    for (const item of queue) {
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (err) {
        item.reject(err);
      }
    }
  });
}
