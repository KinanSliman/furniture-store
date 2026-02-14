/**
 * Middleware for locale detection and cookie management
 *
 * Detects user's locale preference from cookie and sets it if not present
 */

import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from './i18n/config';

export function middleware(request: NextRequest) {
  // Get locale from cookie
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = (locales.includes(localeCookie as Locale) ? localeCookie : defaultLocale) as Locale;

  // Create response
  const response = NextResponse.next();

  // Set locale cookie if not present or invalid
  if (!localeCookie || !locales.includes(localeCookie as Locale)) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  // Match all routes under /admin
  matcher: '/admin/:path*',
};
