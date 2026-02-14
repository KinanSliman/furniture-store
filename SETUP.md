# Setup Guide

Complete setup guide for your e-commerce platform.

## Prerequisites

- **Node.js** 18+ installed
- **PostgreSQL** database running
- **pnpm** package manager (or npm/yarn)
- **Cloudinary** account (for image uploads)

---

## 📦 Step 1: Install Dependencies

```bash
pnpm install
```

Or with npm:
```bash
npm install
```

---

## 🔐 Step 2: Generate Secure Secrets

**CRITICAL:** Never skip this step!

```bash
# Generate all required secrets
node scripts/generate-secrets.js
```

This will output secure random secrets. Copy them for the next step.

---

## ⚙️ Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your values:

   ```bash
   # ============= REQUIRED =============

   # Database (PostgreSQL)
   DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce

   # Security Secrets (paste from step 2)
   JWT_SECRET=<paste-your-generated-secret>
   SESSION_SECRET=<paste-your-generated-secret>
   CSRF_SECRET=<paste-your-generated-secret>
   CRON_SECRET=<paste-your-generated-secret>

   # Cloudinary (for image uploads)
   # Get from: https://cloudinary.com/console
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

   # ============= OPTIONAL =============

   # Payment (add when ready)
   # STRIPE_SECRET_KEY=sk_test_...
   # STRIPE_PUBLIC_KEY=pk_test_...

   # Email (add when ready)
   # SMTP_HOST=smtp.sendgrid.net
   # SMTP_USER=apikey
   # SMTP_PASS=your-sendgrid-key
   ```

---

## 🗄️ Step 4: Setup Database

### Create Database

```bash
# Using psql
createdb ecommerce

# Or connect to PostgreSQL and run:
CREATE DATABASE ecommerce;
```

### Run Migrations

Push the database schema:

```bash
pnpm db:push
```

This will create all tables, indexes, and relations.

### Verify Database

Check that tables were created:

```bash
pnpm db:studio
```

This opens Drizzle Studio where you can view your database.

---

## 👤 Step 5: Create First Admin User

**IMPORTANT:** There are no default credentials for security reasons!

You must create your first admin user manually.

### Option A: Using Database Studio (Recommended)

1. Open Drizzle Studio:
   ```bash
   pnpm db:studio
   ```

2. Navigate to the `users` table

3. Click "Add Row" and enter:
   - **email:** your-email@example.com
   - **passwordHash:** (we'll generate this next)
   - **firstName:** Your First Name
   - **lastName:** Your Last Name
   - **role:** admin
   - **isActive:** true
   - **emailVerified:** true

4. Generate password hash using this script:

   Create a file `scripts/hash-password.js`:
   ```javascript
   const bcrypt = require('bcrypt');
   const password = process.argv[2] || 'YourSecurePassword123!';
   bcrypt.hash(password, 10).then(hash => {
     console.log('Password:', password);
     console.log('Hash:', hash);
   });
   ```

   Run it:
   ```bash
   node scripts/hash-password.js "YourSecurePassword123!"
   ```

5. Copy the hash and paste it into the `passwordHash` field

6. Save the user

### Option B: Using Seed Script (Automated)

Create a seed script `src/db/seed.ts`:

```typescript
import { db } from './db';
import { users } from './schema';
import { hashPassword } from '@/lib/auth';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const password = await hashPassword('YourSecurePassword123!');

  const [admin] = await db.insert(users).values({
    email: 'your-email@example.com',
    passwordHash: password,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    emailVerified: true,
  }).returning();

  console.log('✅ Admin user created!');
  console.log('   Email:', admin.email);
  console.log('   Password: YourSecurePassword123!');
  console.log('');
  console.log('⚠️  IMPORTANT: Change this password after first login!');

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
```

Run the seed script:

```bash
npx tsx src/db/seed.ts
```

**CRITICAL:** Delete or update `src/db/seed.ts` after running to remove the plaintext password!

---

## 🚀 Step 6: Start Development Server

```bash
pnpm dev
```

The server will start at http://localhost:3000

---

## 🔑 Step 7: First Login

1. Navigate to http://localhost:3000/admin/login

2. Enter the admin credentials you created in Step 5

3. **IMPORTANT:** Change your password immediately after first login!

---

## ✅ Verify Setup

After logging in, verify everything works:

### Check Dashboard
- Navigate to `/admin/dashboard`
- Verify stats are showing (may be 0 if no data)

### Test Product Creation
1. Go to `/admin/products`
2. Click "Add Product"
3. Fill in product details
4. Upload an image (tests Cloudinary)
5. Save product

If this works, your setup is complete! 🎉

---

## 🔧 Additional Configuration

### Setup Email (Optional)

To send emails (order confirmations, etc.):

1. Get SendGrid API key from https://sendgrid.com
2. Add to `.env.local`:
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   FROM_EMAIL=noreply@yourstore.com
   FROM_NAME=Your Store Name
   ```

### Setup Stripe (Optional)

To accept payments:

1. Get Stripe keys from https://dashboard.stripe.com/apikeys
2. Add to `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLIC_KEY=pk_test_...
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Configure Rate Limiting

Default rate limits are set in `.env.local`:

```bash
# General API: 100 requests per 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Login: 5 attempts per 15 minutes
LOGIN_RATE_LIMIT_MAX_REQUESTS=5
LOGIN_RATE_LIMIT_WINDOW_MS=900000
```

Adjust based on your needs.

---

## 🛠️ Development Tools

### Database Management

```bash
# Open Drizzle Studio (GUI for database)
pnpm db:studio

# Push schema changes to database
pnpm db:push

# Generate migrations
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

### Linting & Formatting

```bash
# Run ESLint
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Type Checking

```bash
# Check TypeScript types
pnpm type-check
```

---

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── login/         # Login page
│   │   │   ├── dashboard/     # Dashboard
│   │   │   ├── products/      # Product management
│   │   │   ├── orders/        # Order management
│   │   │   └── ...            # Other admin pages
│   │   └── api/               # API routes
│   │       └── admin/         # Admin API endpoints
│   ├── components/            # Reusable components
│   ├── db/                    # Database config
│   │   ├── schema.ts          # Database schema
│   │   └── db.ts              # Database connection
│   └── lib/                   # Utility functions
│       ├── auth.ts            # Authentication
│       ├── middleware.ts      # Auth middleware
│       └── utils.ts           # Helper functions
├── scripts/                   # Utility scripts
│   └── generate-secrets.js    # Secret generator
├── .env.example               # Environment variables template
├── .env.local                 # Your environment variables (DO NOT COMMIT)
├── drizzle.config.ts          # Drizzle ORM config
└── package.json               # Dependencies
```

---

## 🚨 Troubleshooting

### Error: "JWT_SECRET environment variable is required"

**Solution:** Generate and add JWT_SECRET to `.env.local`:
```bash
node scripts/generate-secrets.js
```

### Database connection error

**Solution:** Verify PostgreSQL is running and credentials are correct:
```bash
# Test connection
psql postgresql://user:password@localhost:5432/ecommerce
```

### Cloudinary upload fails

**Solution:** Verify Cloudinary credentials in `.env.local`:
- Check CLOUDINARY_CLOUD_NAME
- Check CLOUDINARY_API_KEY
- Check CLOUDINARY_API_SECRET

### Cannot login with created user

**Solution:** Verify in database:
1. User exists in `users` table
2. `role` is set to 'admin'
3. `isActive` is true
4. `passwordHash` is set correctly

### Port 3000 already in use

**Solution:** Change port or kill existing process:
```bash
# Use different port
PORT=3001 pnpm dev

# Or kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📚 Next Steps

After setup is complete:

1. ✅ Read `SECURITY.md` for security best practices
2. ✅ Review `CLAUDE.md` for feature documentation
3. ✅ Create test products and orders
4. ✅ Configure email templates
5. ✅ Setup payment gateway (Stripe)
6. ✅ Configure shipping rates
7. ✅ Add your branding and customize UI

---

## 🆘 Getting Help

- **Documentation:** Check `CLAUDE.md` for feature details
- **Security:** Read `SECURITY.md` for security practices
- **Issues:** Check GitHub issues or create a new one

---

## ✅ Setup Checklist

Use this checklist to track your setup progress:

- [ ] Dependencies installed (`pnpm install`)
- [ ] Secrets generated (`node scripts/generate-secrets.js`)
- [ ] `.env.local` configured with all required values
- [ ] Database created
- [ ] Schema pushed to database (`pnpm db:push`)
- [ ] First admin user created
- [ ] Development server starts without errors
- [ ] Can login to admin panel
- [ ] Can create a test product
- [ ] Cloudinary image upload works
- [ ] Read `SECURITY.md`
- [ ] Password changed from default

---

**Setup complete!** 🎉 You're ready to start building your store!
