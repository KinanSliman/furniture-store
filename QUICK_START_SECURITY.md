# Quick Start: Security Setup (5 Minutes)

This is the **absolute minimum** you must do before deploying. For complete setup, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md).

---

## ⚡ Critical Steps (Do These First!)

### Step 1: Generate Secrets (1 minute)

```bash
# Generate all secrets at once
node scripts/generate-secrets.js
```

**Copy the output!** You'll need these values.

---

### Step 2: Configure Environment (2 minutes)

Create `.env.local`:

```bash
cp .env.example .env.local
nano .env.local  # or use your editor
```

**Replace these values:**

```env
# PASTE YOUR GENERATED SECRETS HERE
JWT_SECRET=<from-generate-secrets.js>
SESSION_SECRET=<from-generate-secrets.js>
CSRF_SECRET=<from-generate-secrets.js>
CRON_SECRET=<from-generate-secrets.js>

# SET TO PRODUCTION
NODE_ENV=production

# YOUR DATABASE (with SSL!)
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require

# YOUR CLOUDINARY CREDENTIALS
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**⚠️ CRITICAL:**
- All secrets must be strong (generated, not manually typed)
- Database URL must include `?sslmode=require`
- Never commit `.env.local` to Git!

---

### Step 3: Setup Database (1 minute)

```bash
# Run migrations
pnpm db:push

# You'll be prompted: "Do you want to execute these statements?"
# Type: Yes
```

---

### Step 4: Create Admin User (1 minute)

```bash
# Generate password hash
node scripts/hash-password.js
# Enter a strong password (12+ characters)
# Copy the hash output
```

**Insert admin user:**

```sql
-- Connect to your database
psql $DATABASE_URL

-- Paste this (replace email and hash):
INSERT INTO users (
  id, email, password_hash, first_name, last_name,
  role, is_active, email_verified, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'your-email@example.com',
  '<paste-hash-here>',
  'Admin', 'User', 'super_admin',
  true, true, NOW(), NOW()
);
```

---

### Step 5: Enable HTTPS

**⚠️ DO NOT DEPLOY WITHOUT HTTPS!**

Your platform REQUIRES HTTPS for:
- Secure cookies (CSRF, auth tokens)
- Password transmission
- Payment processing (future)

**Quick Option - Cloudflare (5 minutes):**
1. Sign up at https://cloudflare.com (free)
2. Add your domain
3. Change nameservers (follow Cloudflare instructions)
4. Enable "Full (strict)" SSL
5. Enable "Always Use HTTPS"
✅ Done! Cloudflare handles SSL automatically.

**Alternative - Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## ✅ Security Verification Checklist

Before deploying, verify these are TRUE:

```bash
# 1. Secrets are set and strong
echo $JWT_SECRET    # Should be 64+ characters
echo $CSRF_SECRET   # Should be 32+ characters

# 2. Database is accessible
psql $DATABASE_URL -c "SELECT 1"

# 3. Admin user exists
psql $DATABASE_URL -c "SELECT email, role FROM users WHERE role='super_admin'"

# 4. App starts without errors
pnpm build
pnpm start
# Should NOT see: "JWT_SECRET environment variable is required"

# 5. HTTPS is working
curl -I https://yourdomain.com
# Should see: "HTTP/2 200" (not HTTP/1.1)
```

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T:
- Deploy without HTTPS (insecure!)
- Use weak secrets (e.g., "secret123")
- Expose database to internet
- Commit `.env.local` to Git
- Use default admin credentials
- Skip database backups

### ✅ DO:
- Generate strong secrets with the script
- Enable HTTPS before launch
- Keep database on localhost or private network
- Add `.env.local` to `.gitignore`
- Use strong admin password (12+ characters)
- Set up automated daily backups

---

## 🆘 Troubleshooting

### "JWT_SECRET environment variable is required"
**Fix:** Run `node scripts/generate-secrets.js` and add to `.env.local`

### "There is not enough information to infer relation"
**Fix:** Database migration needed. Run `pnpm db:push`

### "Failed to connect to database"
**Fix:** Check `DATABASE_URL` in `.env.local` is correct

### Login returns 429 (Too Many Requests)
**Fix:** Rate limiting is working! Wait 15 minutes or clear rate limit cache

### CSRF token missing error
**Fix:** Frontend needs to fetch and include CSRF token in requests

---

## 📚 Next Steps

After completing these 5 critical steps:

1. **Read full deployment guide:** [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
2. **Set up monitoring:** Configure alerts for security events
3. **Configure backups:** Automate daily database backups
4. **Review security docs:**
   - [SECURITY.md](./SECURITY.md) - Complete security guide
   - [RATE_LIMITING.md](./docs/RATE_LIMITING.md) - Rate limiting
   - [CSRF_PROTECTION.md](./docs/CSRF_PROTECTION.md) - CSRF tokens
   - [INPUT_SANITIZATION.md](./docs/INPUT_SANITIZATION.md) - Input cleaning

---

## 🎯 Security Status After Quick Start

| Feature | Status |
|---------|--------|
| Strong Secrets | ✅ (if generated) |
| HTTPS | ⚠️ (must enable) |
| Rate Limiting | ✅ (automatic) |
| CSRF Protection | ✅ (automatic) |
| Input Sanitization | ✅ (automatic) |
| Audit Logging | ✅ (automatic) |
| Database Backups | ⚠️ (must configure) |
| Monitoring | ⚠️ (must configure) |

**Current Security Level:** Basic Production Ready

**To reach Enterprise Grade:** Complete [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

---

**⏱️ Time Required:**
- **Critical setup:** 5 minutes (this guide)
- **Full production setup:** 2-3 hours ([PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md))

---

**Last Updated:** 2026-02-14
