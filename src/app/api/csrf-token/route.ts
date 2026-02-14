import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';

/**
 * GET /api/csrf-token
 *
 * Returns a fresh CSRF token for the client to use
 * Also sets it in a cookie for convenience
 */
export async function GET(req: NextRequest) {
  try {
    // Generate new CSRF token
    const csrfToken = generateCsrfToken();

    // Create response with token
    const response = NextResponse.json({
      csrfToken,
    });

    // Set CSRF token in cookie
    setCsrfCookie(response, csrfToken);

    return response;

  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
