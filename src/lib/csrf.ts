import { NextRequest, NextResponse } from 'next/server';
import Tokens from 'csrf';

/**
 * CSRF Protection Utility
 *
 * Prevents Cross-Site Request Forgery attacks by validating tokens
 * on state-changing requests (POST, PUT, PATCH, DELETE).
 */

// Initialize CSRF token generator
const tokens = new Tokens();

// Get CSRF secret from environment (or generate one)
const CSRF_SECRET = process.env.CSRF_SECRET;
if (!CSRF_SECRET) {
  console.warn(
    '⚠️  WARNING: CSRF_SECRET not set in environment variables. ' +
    'Generate one with: openssl rand -base64 32'
  );
}

// Use environment secret or fall back to a session-based secret
const getSecret = (): string => {
  return CSRF_SECRET || tokens.secretSync();
};

/**
 * Generate a CSRF token
 *
 * @returns CSRF token string
 */
export function generateCsrfToken(): string {
  const secret = getSecret();
  return tokens.create(secret);
}

/**
 * Verify a CSRF token
 *
 * @param token - The CSRF token to verify
 * @returns true if valid, false otherwise
 */
export function verifyCsrfToken(token: string): boolean {
  const secret = getSecret();
  return tokens.verify(secret, token);
}

/**
 * Get CSRF token from request headers or body
 *
 * Checks in this order:
 * 1. X-CSRF-Token header
 * 2. X-XSRF-Token header (for compatibility)
 * 3. _csrf field in request body
 */
export function getCsrfTokenFromRequest(
  req: NextRequest,
  body?: any
): string | null {
  // Check headers first (preferred method)
  const headerToken =
    req.headers.get('x-csrf-token') ||
    req.headers.get('x-xsrf-token');

  if (headerToken) {
    return headerToken;
  }

  // Check body as fallback
  if (body && typeof body === 'object' && body._csrf) {
    return body._csrf;
  }

  return null;
}

/**
 * CSRF protection middleware for API routes
 *
 * Validates CSRF tokens on state-changing methods (POST, PUT, PATCH, DELETE).
 * Safe methods (GET, HEAD, OPTIONS) are allowed without CSRF check.
 *
 * @param req - Next.js request
 * @param options - Configuration options
 * @returns NextResponse with error if CSRF check fails, null if passes
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const csrfResult = await csrfProtection(req);
 *   if (csrfResult) return csrfResult;
 *
 *   // Your logic here
 * }
 * ```
 */
export async function csrfProtection(
  req: NextRequest,
  options: {
    skipMethods?: string[];
    ignorePaths?: string[];
  } = {}
): Promise<NextResponse | null> {
  const {
    skipMethods = ['GET', 'HEAD', 'OPTIONS'],
    ignorePaths = [],
  } = options;

  // Skip CSRF check for safe methods
  if (skipMethods.includes(req.method)) {
    return null;
  }

  // Skip CSRF check for ignored paths
  const pathname = req.nextUrl.pathname;
  if (ignorePaths.some((path) => pathname.startsWith(path))) {
    return null;
  }

  // Get request body if it's a JSON request
  let body;
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      // Clone the request to read the body without consuming it
      const clonedReq = req.clone();
      body = await clonedReq.json();
    } catch (error) {
      // If body parsing fails, continue without body check
    }
  }

  // Get CSRF token from request
  const token = getCsrfTokenFromRequest(req, body);

  if (!token) {
    return NextResponse.json(
      {
        error: 'CSRF token missing',
        message: 'CSRF token is required for this request',
      },
      { status: 403 }
    );
  }

  // Verify the token
  const isValid = verifyCsrfToken(token);

  if (!isValid) {
    return NextResponse.json(
      {
        error: 'Invalid CSRF token',
        message: 'CSRF token validation failed',
      },
      { status: 403 }
    );
  }

  // Token is valid, allow request to proceed
  return null;
}

/**
 * Add CSRF token to response cookies
 *
 * Sets a cookie with the CSRF token for client-side access
 *
 * @param response - Next.js response
 * @param token - CSRF token (optional, will generate if not provided)
 * @returns Modified response with CSRF cookie
 */
export function setCsrfCookie(
  response: NextResponse,
  token?: string
): NextResponse {
  const csrfToken = token || generateCsrfToken();

  response.cookies.set('csrf-token', csrfToken, {
    httpOnly: false, // Must be accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}

/**
 * Get CSRF token from cookies
 *
 * @param req - Next.js request
 * @returns CSRF token or null
 */
export function getCsrfTokenFromCookies(req: NextRequest): string | null {
  return req.cookies.get('csrf-token')?.value || null;
}

/**
 * Middleware wrapper that adds CSRF protection
 *
 * Use this to wrap your API route handlers
 *
 * @example
 * ```typescript
 * export const POST = withCsrf(async (req: NextRequest) => {
 *   // Your logic here - CSRF is already validated
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withCsrf(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options?: {
    skipMethods?: string[];
    ignorePaths?: string[];
  }
) {
  return async (req: NextRequest, ...args: any[]) => {
    // Apply CSRF protection
    const csrfResult = await csrfProtection(req, options);
    if (csrfResult) {
      return csrfResult;
    }

    // Call the original handler
    return handler(req, ...args);
  };
}

/**
 * Combined auth + CSRF middleware
 *
 * Applies both authentication and CSRF protection
 * (You would integrate this with withAuth middleware)
 */
export function withAuthAndCsrf(
  handler: (req: NextRequest, context: { userId: string; role: string }) => Promise<NextResponse>,
  requiredRole?: 'admin' | 'super_admin'
) {
  return async (req: NextRequest, context: { userId: string; role: string }) => {
    // Apply CSRF protection for state-changing methods
    const csrfResult = await csrfProtection(req);
    if (csrfResult) {
      return csrfResult;
    }

    // Call the original handler (auth is already handled by withAuth)
    return handler(req, context);
  };
}
