# Rate Limiting Documentation

## Overview

Rate limiting is implemented to protect your e-commerce platform from:
- **Brute force attacks** (password guessing)
- **DDoS attacks** (overwhelming the server)
- **API abuse** (excessive requests)
- **Credential stuffing** (automated login attempts)

---

## How It Works

Rate limiting tracks the number of requests from each IP address within a time window. If the limit is exceeded, the server returns a `429 Too Many Requests` error.

### Default Limits

| Endpoint Type | Max Requests | Time Window | Purpose |
|--------------|--------------|-------------|---------|
| **Login** | 5 | 15 minutes | Prevent password brute force |
| **General API** | 100 | 15 minutes | Prevent API abuse |

---

## Configuration

All rate limits are configurable via environment variables in `.env.local`:

```bash
# General API endpoints
RATE_LIMIT_MAX_REQUESTS=100          # Max requests per window
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes in milliseconds

# Login endpoint (stricter)
LOGIN_RATE_LIMIT_MAX_REQUESTS=5      # Max login attempts
LOGIN_RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
```

### Recommended Settings

**Development:**
```bash
RATE_LIMIT_MAX_REQUESTS=1000         # More lenient for testing
LOGIN_RATE_LIMIT_MAX_REQUESTS=20     # Allow more login attempts
```

**Production:**
```bash
RATE_LIMIT_MAX_REQUESTS=100          # Standard limit
LOGIN_RATE_LIMIT_MAX_REQUESTS=5      # Strict for security
```

**High Traffic:**
```bash
RATE_LIMIT_MAX_REQUESTS=500          # Higher limit for busy sites
LOGIN_RATE_LIMIT_MAX_REQUESTS=10     # Slightly more lenient
```

---

## Implementation

### Automatic Rate Limiting

All admin API routes protected by `withAuth()` middleware automatically have rate limiting enabled:

```typescript
// Rate limiting is applied automatically
export const GET = withAuth(async (req, context) => {
  // Your logic here
}, 'admin');
```

### Custom Rate Limits

You can customize rate limits for specific endpoints:

```typescript
export const POST = withAuth(async (req, context) => {
  // Your logic here
}, 'admin', {
  maxRequests: 50,          // Custom limit
  windowMs: 60 * 1000,      // 1 minute window
});
```

### Strict Rate Limiting (Login)

Login endpoint uses strict rate limiting:

```typescript
import { strictRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Apply strict rate limiting (5 attempts per 15 minutes)
  const rateLimitResult = await strictRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Your login logic here
}
```

### Disable Rate Limiting (Not Recommended)

For specific endpoints that need no rate limiting:

```typescript
export const GET = withAuth(async (req, context) => {
  // Your logic here
}, 'admin', {
  rateLimit: false  // Disables rate limiting
});
```

---

## Response Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 100          # Max requests allowed
X-RateLimit-Remaining: 95       # Requests remaining in window
X-RateLimit-Reset: 1709654400   # Unix timestamp when limit resets
```

When limit is exceeded:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900                # Seconds until retry allowed
X-RateLimit-Remaining: 0
```

---

## Error Response

When rate limit is exceeded, the API returns:

```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 900
}
```

For login endpoint:
```json
{
  "error": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

---

## Client-Side Handling

### Example: Login with Rate Limit Handling

```typescript
async function login(email: string, password: string) {
  try {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Check for rate limit error
    if (response.status === 429) {
      const data = await response.json();
      const retryMinutes = Math.ceil(data.retryAfter / 60);

      setError(`Too many login attempts. Please try again in ${retryMinutes} minutes.`);
      return;
    }

    // Check rate limit headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining && parseInt(remaining) < 3) {
      console.warn(`Only ${remaining} login attempts remaining`);
    }

    // Handle successful login
    if (response.ok) {
      const data = await response.json();
      router.push('/admin/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}
```

### Display Retry After Time

```typescript
function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

// Usage
const retryMessage = `Please try again in ${formatRetryAfter(data.retryAfter)}`;
```

---

## Monitoring

### Check Rate Limit Status

```typescript
import { getRateLimitStatus } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const status = getRateLimitStatus(req);

  console.log('Rate limit status:', {
    limit: status.limit,
    remaining: status.remaining,
    reset: new Date(status.reset * 1000),
    isLimited: status.isLimited,
  });
}
```

### Log Rate Limit Violations

Add logging when users hit rate limits:

```typescript
if (rateLimitResult) {
  console.warn('Rate limit exceeded:', {
    ip: getClientIdentifier(req),
    path: req.nextUrl.pathname,
    timestamp: new Date().toISOString(),
  });

  return rateLimitResult;
}
```

---

## How IP Address is Determined

The rate limiter tries to get the client IP in this order:

1. `X-Forwarded-For` header (for proxies/load balancers)
2. `X-Real-IP` header (for reverse proxies)
3. `X-Vercel-Forwarded-For` header (for Vercel deployments)
4. Fallback to 'unknown'

This ensures rate limiting works correctly behind:
- Cloudflare
- Nginx
- AWS Load Balancer
- Vercel Edge Network

---

## Production Considerations

### 1. Use Redis for Distributed Systems

The current implementation uses in-memory storage. For multiple server instances, use Redis:

```typescript
// lib/rate-limit-redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function rateLimitRedis(req: NextRequest, options) {
  const key = `ratelimit:${req.nextUrl.pathname}:${getClientIP(req)}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, Math.ceil(options.windowMs / 1000));
  }

  if (count > options.maxRequests) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return null;
}
```

### 2. Adjust Limits Based on Traffic

Monitor your traffic and adjust limits accordingly:

```bash
# Low traffic (< 1000 users/day)
RATE_LIMIT_MAX_REQUESTS=50

# Medium traffic (1000-10000 users/day)
RATE_LIMIT_MAX_REQUESTS=100

# High traffic (10000+ users/day)
RATE_LIMIT_MAX_REQUESTS=500
```

### 3. Whitelist Trusted IPs

For internal tools or trusted services:

```typescript
const TRUSTED_IPS = process.env.TRUSTED_IPS?.split(',') || [];

export async function rateLimit(req: NextRequest, options) {
  const clientIP = getClientIdentifier(req);

  // Skip rate limiting for trusted IPs
  if (TRUSTED_IPS.includes(clientIP)) {
    return null;
  }

  // Apply normal rate limiting
}
```

### 4. Monitor and Alert

Set up alerts for:
- High rate of 429 errors
- Specific IPs hitting limits repeatedly
- Unusual traffic patterns

---

## Testing Rate Limiting

### Manual Testing

Test login rate limiting:

```bash
# Make 6 login attempts in a row
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/admin/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -i
done

# The 6th request should return 429
```

### Automated Testing

```typescript
// __tests__/rate-limit.test.ts
describe('Rate Limiting', () => {
  it('should block after max login attempts', async () => {
    const email = 'test@example.com';
    const password = 'wrong-password';

    // Make 5 attempts (should succeed)
    for (let i = 0; i < 5; i++) {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      expect([401, 429]).toContain(response.status);
    }

    // 6th attempt should be rate limited
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    expect(response.status).toBe(429);
  });
});
```

---

## Troubleshooting

### Issue: Rate limit triggered too quickly

**Solution:** Increase the limits in `.env.local`:
```bash
LOGIN_RATE_LIMIT_MAX_REQUESTS=10  # Increase from 5
```

### Issue: Rate limit not working

**Solution:**
1. Check environment variables are loaded
2. Verify middleware is applied to routes
3. Check if IP address is being detected correctly

### Issue: All requests from same IP (localhost)

**Solution:** In development, all requests may appear from localhost. Use different browsers or clear rate limit store:

```typescript
// For development only
if (process.env.NODE_ENV === 'development') {
  rateLimitStore = {}; // Clear store
}
```

### Issue: Users behind NAT/proxy see "Rate limit exceeded"

**Solution:** Multiple users behind the same corporate proxy/NAT will share the same IP. Consider:
1. Increasing rate limits
2. Using user ID instead of IP for authenticated routes
3. Implementing per-user rate limiting

---

## Best Practices

1. ✅ **Use stricter limits for sensitive endpoints** (login, password reset)
2. ✅ **Monitor rate limit violations** to detect attacks
3. ✅ **Provide clear error messages** with retry information
4. ✅ **Include rate limit headers** in responses
5. ✅ **Test rate limiting** before production deployment
6. ✅ **Use Redis** for multi-server deployments
7. ✅ **Whitelist** known good actors (monitoring tools, etc.)
8. ✅ **Log** rate limit events for security analysis

---

## Security Notes

⚠️ **Rate limiting is not a silver bullet**:
- Sophisticated attackers can distribute attacks across many IPs
- Use rate limiting alongside other security measures:
  - Strong password requirements
  - CAPTCHA after failed attempts
  - Account lockout after repeated failures
  - Two-factor authentication
  - IP blocking for known bad actors

🔒 **Defense in depth**: Rate limiting is one layer in your security stack.

---

**Last Updated:** 2026-02-14
