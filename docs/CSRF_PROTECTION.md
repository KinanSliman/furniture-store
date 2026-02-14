# CSRF Protection Documentation

## Overview

Cross-Site Request Forgery (CSRF) protection prevents attackers from tricking authenticated users into performing unwanted actions on your e-commerce platform.

---

## What is CSRF?

**CSRF Attack Example:**

1. User logs into your admin panel (`admin.yourstore.com`)
2. User visits malicious website (`evil.com`)
3. Malicious website contains hidden form:
   ```html
   <form action="https://admin.yourstore.com/api/admin/products/123" method="POST">
     <input name="price" value="0.01">
   </form>
   <script>document.forms[0].submit();</script>
   ```
4. Form submits automatically using user's cookies
5. Product price changed to $0.01 without user knowledge!

**How CSRF Protection Prevents This:**
- Every state-changing request requires a unique CSRF token
- Token is generated server-side and validated
- Malicious sites can't access the token (Same-Origin Policy)
- Request fails without valid token

---

## How It Works

### 1. Token Generation

When the client needs to make a state-changing request:

```typescript
// GET /api/csrf-token
{
  "csrfToken": "abc123..."
}
```

The token is also set in a cookie for convenience.

### 2. Token Validation

For POST, PUT, PATCH, DELETE requests:

```http
POST /api/admin/products
Content-Type: application/json
X-CSRF-Token: abc123...

{ "name": "New Product" }
```

The server validates the token before processing the request.

### 3. Token Sources

The server checks for CSRF tokens in this order:
1. `X-CSRF-Token` header (recommended)
2. `X-XSRF-Token` header (compatibility)
3. `_csrf` field in request body

---

## Implementation

### Server-Side (Automatic)

All admin API routes protected by `withAuth()` automatically have CSRF protection:

```typescript
// CSRF is automatically validated on POST/PUT/PATCH/DELETE
export const POST = withAuth(async (req, context) => {
  // CSRF already validated - just implement your logic
  return NextResponse.json({ success: true });
}, 'admin');
```

### Disable CSRF for Specific Route (Not Recommended)

```typescript
export const POST = withAuth(async (req, context) => {
  // Your logic
}, 'admin', {
  csrf: false  // Disables CSRF protection
});
```

### Client-Side Integration

#### 1. Fetch CSRF Token

```typescript
// Fetch token when app loads
async function getCsrfToken(): Promise<string> {
  const response = await fetch('/api/csrf-token');
  const data = await response.json();
  return data.csrfToken;
}
```

#### 2. Include Token in Requests

**Option A: Header (Recommended)**

```typescript
const csrfToken = await getCsrfToken();

await fetch('/api/admin/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({ name: 'New Product' }),
});
```

**Option B: Request Body**

```typescript
await fetch('/api/admin/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    _csrf: csrfToken,
    name: 'New Product',
  }),
});
```

**Option C: From Cookie**

```typescript
// Token is automatically available in cookie
// Just include it in header
function getCsrfFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='));
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

const token = getCsrfFromCookie();
```

---

## React Integration

### 1. CSRF Context Provider

```typescript
// contexts/CsrfContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

interface CsrfContextType {
  csrfToken: string | null;
  refreshToken: () => Promise<void>;
}

const CsrfContext = createContext<CsrfContextType>({
  csrfToken: null,
  refreshToken: async () => {},
});

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      setCsrfToken(data.csrfToken);
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  };

  useEffect(() => {
    refreshToken();
  }, []);

  return (
    <CsrfContext.Provider value={{ csrfToken, refreshToken }}>
      {children}
    </CsrfContext.Provider>
  );
}

export const useCsrf = () => useContext(CsrfContext);
```

### 2. Use in Components

```typescript
import { useCsrf } from '@/contexts/CsrfContext';

function ProductForm() {
  const { csrfToken } = useCsrf();

  const handleSubmit = async (data: ProductData) => {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || '',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 403) {
      console.error('CSRF token invalid or missing');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 3. Custom Fetch Wrapper

```typescript
// lib/api.ts
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token from cookie
  const csrfToken = getCsrfFromCookie();

  // Add CSRF header for state-changing methods
  const method = options.method?.toUpperCase() || 'GET';
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers = new Headers(options.headers);
  if (needsCsrf && csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Usage
await apiFetch('/api/admin/products', {
  method: 'POST',
  body: JSON.stringify({ name: 'New Product' }),
});
```

---

## Configuration

### Environment Variables

```bash
# CSRF secret (generate with: openssl rand -base64 32)
CSRF_SECRET=your-secret-here
```

### Token Expiry

CSRF tokens expire after **24 hours** by default.

To change:

```typescript
// In src/lib/csrf.ts - setCsrfCookie function
maxAge: 60 * 60 * 24 * 7  // 7 days
```

---

## Security Best Practices

### 1. SameSite Cookies

CSRF tokens use `SameSite=strict`:

```typescript
response.cookies.set('csrf-token', token, {
  sameSite: 'strict',  // Prevents CSRF attacks
  secure: true,        // HTTPS only in production
  httpOnly: false,     // Must be readable by JavaScript
});
```

### 2. Token Rotation

Rotate CSRF tokens:
- After login
- After logout
- After sensitive actions
- Periodically (every 24 hours)

```typescript
// Refresh token after login
const response = await login(credentials);
if (response.ok) {
  await refreshCsrfToken();
}
```

### 3. Double Submit Cookie Pattern

We use the **Double Submit Cookie** pattern:
1. Token in cookie (readable by JS)
2. Token in header/body
3. Server verifies they match

This is secure because:
- Attacker can't read cookies (Same-Origin Policy)
- Attacker can't set custom headers on forms
- Both must match for validation

---

## Error Handling

### Client-Side

```typescript
try {
  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 403) {
    const error = await response.json();

    if (error.error === 'CSRF token missing') {
      // Token not provided - fetch new one
      await refreshCsrfToken();
      // Retry request
    } else if (error.error === 'Invalid CSRF token') {
      // Token expired or invalid - fetch new one
      await refreshCsrfToken();
      // Retry request
    }
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

### Server-Side

```typescript
// CSRF errors are automatically handled
// Returns 403 with clear error message:
{
  "error": "CSRF token missing",
  "message": "CSRF token is required for this request"
}

// Or:
{
  "error": "Invalid CSRF token",
  "message": "CSRF token validation failed"
}
```

---

## Testing

### Manual Testing

```bash
# 1. Get CSRF token
curl http://localhost:3000/api/csrf-token

# 2. Make request without token (should fail)
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product"}' \
  -c cookies.txt -b cookies.txt

# 3. Make request with token (should succeed)
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_TOKEN_HERE" \
  -d '{"name":"Test Product"}' \
  -c cookies.txt -b cookies.txt
```

### Automated Testing

```typescript
// __tests__/csrf.test.ts
describe('CSRF Protection', () => {
  it('should reject requests without CSRF token', async () => {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('CSRF token missing');
  });

  it('should reject requests with invalid CSRF token', async () => {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'X-CSRF-Token': 'invalid-token' },
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Invalid CSRF token');
  });

  it('should accept requests with valid CSRF token', async () => {
    // Get token
    const tokenRes = await fetch('/api/csrf-token');
    const { csrfToken } = await tokenRes.json();

    // Make request
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(response.status).not.toBe(403);
  });
});
```

---

## Troubleshooting

### Issue: "CSRF token missing" error

**Causes:**
1. Token not fetched from server
2. Token not included in request headers
3. Cookie blocked by browser settings

**Solutions:**
1. Verify `/api/csrf-token` is accessible
2. Check token is added to headers
3. Check browser console for cookie warnings
4. Ensure `SameSite` cookie setting is correct

### Issue: "Invalid CSRF token" error

**Causes:**
1. Token expired (>24 hours old)
2. Token doesn't match server secret
3. Server secret changed

**Solutions:**
1. Fetch new token
2. Check `CSRF_SECRET` in `.env.local`
3. Restart server if secret changed

### Issue: CSRF protection not working

**Causes:**
1. Middleware not applied
2. CSRF disabled in route
3. Using safe method (GET, HEAD, OPTIONS)

**Solutions:**
1. Verify route uses `withAuth()`
2. Check `csrf: false` not set in options
3. CSRF only applies to POST/PUT/PATCH/DELETE

---

## Migration Guide

### Updating Existing Code

If you already have API calls without CSRF:

**Before:**
```typescript
await fetch('/api/admin/products', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

**After:**
```typescript
const csrfToken = await getCsrfToken();

await fetch('/api/admin/products', {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(data),
});
```

### Gradual Rollout

1. Deploy CSRF protection (warn only mode)
2. Update client to send tokens
3. Enable strict mode (reject without token)

```typescript
// Warn-only mode (for testing)
export const POST = withAuth(async (req, context) => {
  const token = getCsrfTokenFromRequest(req);
  if (!token) {
    console.warn('⚠️  CSRF token missing (warn-only mode)');
  }

  // Process request anyway
}, 'admin', { csrf: false });
```

---

## Best Practices

1. ✅ **Always use HTTPS** in production
2. ✅ **Refresh tokens** after login/logout
3. ✅ **Include in all state-changing requests**
4. ✅ **Use headers** instead of body when possible
5. ✅ **Handle errors gracefully** (auto-retry with new token)
6. ✅ **Log CSRF failures** for security monitoring
7. ✅ **Rotate secrets** regularly (90 days)
8. ✅ **Test thoroughly** before production

---

**Last Updated:** 2026-02-14
