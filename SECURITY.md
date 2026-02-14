# Security Setup Guide

This guide will help you secure your e-commerce platform before deploying to production.

## 🚨 Critical Security Steps (Complete Before Production!)

### 1. Generate Secure Secrets

**NEVER use default or weak secrets in production!**

Generate cryptographically secure secrets:

```bash
# Run the secret generation script
node scripts/generate-secrets.js
```

Or generate manually:

```bash
# Generate JWT_SECRET (64 bytes)
openssl rand -base64 64

# Generate SESSION_SECRET (64 bytes)
openssl rand -base64 64

# Generate CRON_SECRET (32 bytes)
openssl rand -base64 32

# Generate CSRF_SECRET (32 bytes)
openssl rand -base64 32
```

### 2. Update Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

**Edit `.env.local` and replace ALL empty values:**

```bash
# REQUIRED - Replace with generated secrets
JWT_SECRET=<paste-generated-secret-here>
SESSION_SECRET=<paste-generated-secret-here>
CSRF_SECRET=<paste-generated-secret-here>
CRON_SECRET=<paste-generated-secret-here>

# REQUIRED - Your database connection
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce

# REQUIRED - Cloudinary credentials (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Verify JWT Secret is Required

The application will **throw an error** if `JWT_SECRET` is not set. This is intentional!

If you see this error:
```
Error: JWT_SECRET environment variable is required.
Generate a secure secret with: openssl rand -base64 32
```

It means you need to add `JWT_SECRET` to your `.env.local` file.

---

## 🔒 Security Checklist

Before deploying to production, ensure you've completed ALL items:

### Authentication & Authorization
- [ ] ✅ JWT_SECRET is set and strong (32+ characters)
- [ ] ✅ SESSION_SECRET is set and different from JWT_SECRET
- [ ] ✅ BCRYPT_ROUNDS is set to 10 or higher
- [ ] ✅ Default admin credentials have been changed
- [ ] ✅ No default credentials are exposed in the login page
- [ ] ✅ Session expiry is configured (default: 7 days)

### Database Security
- [ ] ✅ Database password is strong (16+ characters)
- [ ] ✅ Database is not publicly accessible
- [ ] ✅ Database connection uses SSL/TLS in production
- [ ] ✅ Regular database backups are configured
- [ ] ✅ Database user has minimal required permissions

### API Security
- [ ] ✅ Rate limiting is enabled on all endpoints
- [ ] ✅ CSRF protection is enabled
- [ ] ✅ CORS is configured for your domain only
- [ ] ✅ Input validation on all endpoints
- [ ] ✅ File upload size limits are configured

### Secrets Management
- [ ] ✅ .env.local is in .gitignore (never committed)
- [ ] ✅ All API keys are stored in environment variables
- [ ] ✅ Production secrets are stored in secure vault
- [ ] ✅ Different secrets for dev/staging/production
- [ ] ✅ Secrets are rotated regularly (90 days)

### Monitoring & Logging
- [ ] ✅ Audit logging is enabled for admin actions
- [ ] ✅ Error tracking is configured (Sentry, etc.)
- [ ] ✅ Security alerts are configured
- [ ] ✅ Failed login attempts are monitored

### HTTPS & SSL
- [ ] ✅ HTTPS is enabled in production
- [ ] ✅ HTTP redirects to HTTPS
- [ ] ✅ SSL certificate is valid
- [ ] ✅ HSTS headers are configured

### Cloudinary Security
- [ ] ✅ Cloudinary API secret is not exposed to frontend
- [ ] ✅ Signed uploads are configured
- [ ] ✅ Upload presets are restricted
- [ ] ✅ Allowed file types are limited

---

## 🛡️ Security Best Practices

### 1. Password Requirements

Default password hashing uses bcrypt with 10 rounds. For higher security:

```env
BCRYPT_ROUNDS=12  # Slower but more secure
```

### 2. JWT Token Security

- **Token Expiry**: Default is 7 days. For higher security, use shorter expiry:
  ```env
  SESSION_EXPIRY=1d  # 1 day
  ```

- **Token Storage**: Tokens are stored in HTTP-only cookies (secure by default)

### 3. Rate Limiting

Default rate limits (configured in `.env.local`):

```env
# General API endpoints: 100 requests per 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Login endpoint: 5 attempts per 15 minutes (stricter)
LOGIN_RATE_LIMIT_MAX_REQUESTS=5
LOGIN_RATE_LIMIT_WINDOW_MS=900000
```

### 4. Database Connection

**Development:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce
```

**Production (with SSL):**
```env
DATABASE_URL=postgresql://user:password@host:5432/ecommerce?sslmode=require
```

### 5. CORS Configuration

In production, restrict CORS to your domain:

```typescript
// In next.config.js
headers: async () => [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
    ],
  },
],
```

---

## 🚫 What NOT to Do

### ❌ NEVER Do These:

1. **Commit secrets to Git**
   ```bash
   # Bad - never do this
   git add .env.local
   ```

2. **Use weak or default secrets**
   ```env
   # Bad
   JWT_SECRET=secret123
   JWT_SECRET=your-secret-key-change-in-production
   ```

3. **Share secrets via insecure channels**
   - ❌ Email
   - ❌ Slack
   - ❌ SMS
   - ✅ Use secure vault or encrypted communication

4. **Reuse secrets across environments**
   ```env
   # Bad - use different secrets per environment
   DEV_JWT_SECRET=abc123
   PROD_JWT_SECRET=abc123  # Same secret - BAD!
   ```

5. **Expose API keys in frontend code**
   ```javascript
   // Bad - never put secrets in client-side code
   const apiKey = 'sk_live_xxxxxxxxxx';
   ```

---

## 🔄 Secret Rotation

Rotate secrets regularly (recommended: every 90 days):

### How to Rotate JWT Secret:

1. Generate new secret:
   ```bash
   openssl rand -base64 64
   ```

2. Update `.env.local` with new secret

3. Restart application - all users will be logged out

4. Optional: Implement dual-secret support for gradual rotation

---

## 📊 Security Monitoring

### Track These Metrics:

- Failed login attempts (potential brute force)
- Unusual API usage patterns
- Database query errors (potential SQL injection attempts)
- File upload rejections (potential malware uploads)
- Rate limit violations
- Admin action frequency

### Set Up Alerts For:

- 5+ failed logins from same IP
- Sudden spike in API requests
- Database connection errors
- Unauthorized access attempts
- Critical file modifications

---

## 🆘 Security Incident Response

If you suspect a security breach:

1. **Immediate Actions:**
   - Rotate all secrets immediately
   - Revoke all active sessions (restart app)
   - Review audit logs for suspicious activity
   - Take database backup before investigation

2. **Investigation:**
   - Check audit logs for unauthorized changes
   - Review recent admin actions
   - Analyze login attempts and patterns
   - Check database for unauthorized modifications

3. **Recovery:**
   - Restore from backup if needed
   - Update security measures based on findings
   - Document the incident and response

---

## 📞 Security Resources

- **Report Security Issues:** [security@yourcompany.com]
- **Security Updates:** Check GitHub releases regularly
- **Dependencies:** Run `pnpm audit` monthly
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/

---

## ✅ Production Deployment Checklist

Before deploying to production:

```bash
# 1. Verify all secrets are set
node scripts/verify-env.js

# 2. Run security audit
pnpm audit

# 3. Test authentication
# - Try logging in with wrong password (should fail)
# - Try accessing /api/admin/* without token (should fail)
# - Verify rate limiting works (try 10 login attempts)

# 4. Check database connection
# - Verify SSL is enabled
# - Test connection from production server

# 5. Enable production mode
NODE_ENV=production

# 6. Deploy and monitor
# - Watch error logs for first 24 hours
# - Monitor failed login attempts
# - Verify HTTPS is working
```

---

## 🔐 Additional Security Features (Recommended)

Consider adding these features for enterprise-level security:

1. **Two-Factor Authentication (2FA)**
   - TOTP (Time-based One-Time Password)
   - SMS verification
   - Email verification codes

2. **IP Whitelisting**
   - Restrict admin panel to specific IPs
   - VPN requirement for admin access

3. **Audit Logging**
   - Track all admin actions
   - Who, what, when, from where
   - Immutable log storage

4. **Database Encryption**
   - Encrypt sensitive data at rest
   - Use field-level encryption for PII

5. **Web Application Firewall (WAF)**
   - Cloudflare WAF
   - AWS WAF
   - Azure WAF

---

**Last Updated:** 2026-02-14
**Security Contact:** [Add your security contact]
