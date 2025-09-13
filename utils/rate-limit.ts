import db from '@/lib/db';

const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 3,
};

interface RateLimitResult {
  isAllowed: boolean;
  retryAfter?: number;
  remaining?: number;
  resetTime?: Date;
}

export async function checkRateLimit(
  clientKey: string, 
  endpoint: string
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT.WINDOW_MS);

  try {
    // Start a transaction
    await db.execute('START TRANSACTION');

    // Clean up old entries for this client/endpoint
    await db.execute(
      'DELETE FROM rate_limits WHERE client_key = ? AND endpoint = ? AND last_attempt < ?',
      [clientKey, endpoint, windowStart]
    );

    // Get or create rate limit record
    await db.execute(
      `INSERT INTO rate_limits (client_key, endpoint, count, first_attempt, last_attempt)
       VALUES (?, ?, 1, ?, ?)
       ON DUPLICATE KEY UPDATE 
         count = IF(last_attempt < ?, 1, count + 1),
         first_attempt = IF(last_attempt < ?, ?, first_attempt),
         last_attempt = ?`,
      [
        clientKey, 
        endpoint, 
        now, 
        now,
        windowStart,
        windowStart,
        now,
        now
      ]
    );

    // Get the current count
    const [countRows] = await db.execute(
      'SELECT count, first_attempt FROM rate_limits WHERE client_key = ? AND endpoint = ?',
      [clientKey, endpoint]
    ) as any;

    await db.execute('COMMIT');

    const count = countRows[0]?.count || 0;
    const firstAttempt = countRows[0]?.first_attempt || now;
    
    const resetTime = new Date(firstAttempt.getTime() + RATE_LIMIT.WINDOW_MS);
    const remaining = Math.max(0, RATE_LIMIT.MAX_REQUESTS - count);
    const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);

    if (count > RATE_LIMIT.MAX_REQUESTS) {
      return {
        isAllowed: false,
        retryAfter,
        remaining: 0,
        resetTime
      };
    }

    return {
      isAllowed: true,
      remaining,
      resetTime
    };
  } catch (error) {
    await db.execute('ROLLBACK');
    console.error('Rate limit check failed:', error);
    // In case of error, allow the request to proceed
    return { isAllowed: true };
  }
}

export function getRateLimitHeaders(result: RateLimitResult) {
  const headers = new Headers();
  
  if (result.resetTime) {
    headers.set('X-RateLimit-Reset', Math.floor(result.resetTime.getTime() / 1000).toString());
  }
  
  if (typeof result.remaining === 'number') {
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
  }
  
  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
  
  return headers;
}
