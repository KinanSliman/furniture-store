import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit';

export function withAuth(
  handler: (req: NextRequest, context: { userId: string; role: string }) => Promise<NextResponse>,
  requiredRole?: 'admin' | 'super_admin',
  options?: {
    rateLimit?: boolean; // Enable rate limiting (default: true)
    maxRequests?: number;
    windowMs?: number;
  }
) {
  return async (req: NextRequest) => {
    try {
      // Apply rate limiting (enabled by default)
      const rateLimitEnabled = options?.rateLimit !== false;
      if (rateLimitEnabled) {
        const rateLimitResult = await rateLimit(req, {
          maxRequests: options?.maxRequests,
          windowMs: options?.windowMs,
        });
        if (rateLimitResult) {
          return rateLimitResult;
        }
      }

      // Get token from cookie or Authorization header
      const token = req.cookies.get('auth-token')?.value || 
                   req.headers.get('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized - No token provided' },
          { status: 401 }
        );
      }

      // Verify token
      const payload = verifyToken(token);
      
      if (!payload) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }

      // Check role if required
      if (requiredRole) {
        if (requiredRole === 'super_admin' && payload.role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Forbidden - Super admin access required' },
            { status: 403 }
          );
        }
        
        if (requiredRole === 'admin' && !['admin', 'super_admin'].includes(payload.role)) {
          return NextResponse.json(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
          );
        }
      }

      // Call the handler with user context
      const response = await handler(req, { userId: payload.userId, role: payload.role });

      // Add rate limit headers to response
      if (rateLimitEnabled) {
        return addRateLimitHeaders(response, req, {
          maxRequests: options?.maxRequests,
          windowMs: options?.windowMs,
        });
      }

      return response;
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
