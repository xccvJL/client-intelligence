export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
  shouldRetry?: (error: unknown) => boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRateLimitOrTransientError(error: unknown): boolean {
  const maybeError = error as {
    status?: number;
    code?: number | string;
    response?: { status?: number };
    message?: string;
  };

  const status = maybeError?.status ?? maybeError?.response?.status;
  if (status === 429 || (typeof status === "number" && status >= 500)) return true;

  const code = String(maybeError?.code ?? "");
  if (["429", "500", "502", "503", "504", "ECONNRESET", "ETIMEDOUT"].includes(code)) {
    return true;
  }

  const message = (maybeError?.message ?? "").toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("temporar") ||
    message.includes("timeout") ||
    message.includes("too many requests") ||
    message.includes("unavailable")
  );
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  {
    maxAttempts = 4,
    baseDelayMs = 400,
    maxDelayMs = 5_000,
    jitter = true,
    shouldRetry = isRateLimitOrTransientError,
  }: RetryOptions = {}
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (attempt >= maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const delay = jitter ? Math.floor(backoff * (0.8 + Math.random() * 0.4)) : backoff;
      await sleep(delay);
    }
  }

  throw lastError;
}
