import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate Limiting Utility
 *
 * In-memory rate limiter for API routes.
 * For production with multiple servers, consider using Redis.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limit data
const rateLimitStore: RateLimitStore = {};

// Cleanup old entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 15 * 60 * 1000);

/**
 * Get client identifier (IP address)
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get real IP from headers (for proxies/CDNs)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP
  return req.headers.get('x-vercel-forwarded-for') || 'unknown';
}

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   * @default 100
   */
  maxRequests?: number;

  /**
   * Time window in milliseconds
   * @default 900000 (15 minutes)
   */
  windowMs?: number;

  /**
   * Custom identifier (instead of IP)
   * Useful for per-user rate limiting
   */
  identifier?: string;

  /**
   * Skip rate limiting for certain conditions
   */
  skip?: (req: NextRequest) => boolean;

  /**
   * Custom error message
   */
  message?: string;
}

/**
 * Rate limit middleware for Next.js API routes
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await rateLimit(req, {
 *     maxRequests: 5,
 *     windowMs: 15 * 60 * 1000, // 15 minutes
 *   });
 *
 *   if (rateLimitResult) {
 *     return rateLimitResult; // Returns 429 Too Many Requests
 *   }
 *
 *   // Continue with your logic
 * }
 * ```
 */
export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const {
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    identifier,
    skip,
    message = 'Too many requests, please try again later.',
  } = options;

  // Skip rate limiting if condition is met
  if (skip && skip(req)) {
    return null;
  }

  // Get client identifier
  const clientId = identifier || getClientIdentifier(req);
  const key = `${req.nextUrl.pathname}:${clientId}`;
  const now = Date.now();

  // Get or create rate limit data
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  const limitData = rateLimitStore[key];

  // Reset if window has passed
  if (now > limitData.resetTime) {
    limitData.count = 0;
    limitData.resetTime = now + windowMs;
  }

  // Increment request count
  limitData.count++;

  // Calculate headers
  const remaining = Math.max(0, maxRequests - limitData.count);
  const resetTime = Math.ceil(limitData.resetTime / 1000);

  // Check if limit exceeded
  if (limitData.count > maxRequests) {
    const retryAfter = Math.ceil((limitData.resetTime - now) / 1000);

    return NextResponse.json(
      {
        error: message,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  // Return null to indicate request is allowed (middleware pattern)
  // But we'll add rate limit headers to the response later
  return null;
}

/**
 * Strict rate limiter for sensitive endpoints (e.g., login)
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await strictRateLimit(req);
 *   if (rateLimitResult) return rateLimitResult;
 *
 *   // Your login logic
 * }
 * ```
 */
export async function strictRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  return rateLimit(req, {
    maxRequests: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '5'),
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.',
    ...options,
  });
}

/**
 * Add rate limit headers to a response
 *
 * Use this to add rate limit info headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  req: NextRequest,
  options: RateLimitOptions = {}
): NextResponse {
  const {
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    identifier,
  } = options;

  const clientId = identifier || getClientIdentifier(req);
  const key = `${req.nextUrl.pathname}:${clientId}`;
  const limitData = rateLimitStore[key];

  if (limitData) {
    const remaining = Math.max(0, maxRequests - limitData.count);
    const resetTime = Math.ceil(limitData.resetTime / 1000);

    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
  }

  return response;
}

/**
 * Get current rate limit status for a client
 *
 * Useful for checking rate limit status without incrementing the counter
 */
export function getRateLimitStatus(
  req: NextRequest,
  options: RateLimitOptions = {}
): {
  limit: number;
  remaining: number;
  reset: number;
  isLimited: boolean;
} {
  const {
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    identifier,
  } = options;

  const clientId = identifier || getClientIdentifier(req);
  const key = `${req.nextUrl.pathname}:${clientId}`;
  const limitData = rateLimitStore[key];
  const now = Date.now();

  if (!limitData || now > limitData.resetTime) {
    return {
      limit: maxRequests,
      remaining: maxRequests,
      reset: Math.ceil((now + (options.windowMs || 900000)) / 1000),
      isLimited: false,
    };
  }

  const remaining = Math.max(0, maxRequests - limitData.count);

  return {
    limit: maxRequests,
    remaining,
    reset: Math.ceil(limitData.resetTime / 1000),
    isLimited: limitData.count >= maxRequests,
  };
}
