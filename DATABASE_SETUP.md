# Database Setup Guide

## Prerequisites
- PostgreSQL 14+ installed
- Node.js 18+ installed

## Installation Steps

### 1. Install Dependencies

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg dotenv
```

### 2. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ecommerce_store;

# Create user (optional, for production)
CREATE USER ecommerce_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ecommerce_store TO ecommerce_user;

# Exit
\q
```

### 3. Environment Variables

Create a `.env` file in your project root:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce_store

# Or for production with separate user:
# DATABASE_URL=postgresql://ecommerce_user:your_secure_password@localhost:5432/ecommerce_store

# App Configuration
NEXT_PUBLIC_APP_NAME=My Store
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CURRENCY=USD

# JWT & Session
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Email (SendGrid example)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@yourstore.com

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (optional)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
PAYPAL_MODE=sandbox # or 'live' for production

# Image Storage (Cloudinary example)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Or use AWS S3
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=your-bucket-name

# Shipping (EasyPost - optional)
EASYPOST_API_KEY=your-easypost-api-key

# Email Marketing (Mailchimp - optional)
MAILCHIMP_API_KEY=your-mailchimp-api-key
MAILCHIMP_LIST_ID=your-list-id

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Node Environment
NODE_ENV=development
```

### 4. File Structure

Organize your database files:

```
/src
  /db
    schema.ts         # Your Drizzle schema (main file)
    db.ts            # Database connection
    /queries         # Reusable query functions
    /migrations      # Will be auto-generated
/drizzle
  /migrations        # Migration files
drizzle.config.ts    # Drizzle Kit configuration
```

### 5. Generate Initial Migration

```bash
# Generate migration files from schema
npx drizzle-kit generate:pg

# This creates migration files in /drizzle/migrations
```

### 6. Run Migrations

```bash
# Push schema to database
npx drizzle-kit push:pg

# Or use migrate command for production
npx drizzle-kit migrate
```

### 7. Verify Database

```bash
# Connect to PostgreSQL
psql -U postgres -d ecommerce_store

# List all tables
\dt

# You should see all your tables:
# - users
# - products
# - orders
# - etc.

# Describe a table structure
\d products

# Exit
\q
```

## Usage in Your Next.js App

### Example: Create a Product

```typescript
// /src/app/api/admin/products/route.ts
import { db } from '@/db/db';
import { products } from '@/db/schema';

export async function POST(req: Request) {
  const body = await req.json();
  
  const newProduct = await db.insert(products).values({
    name: body.name,
    slug: body.slug,
    description: body.description,
    price: body.price,
    stockQuantity: body.stockQuantity,
    isActive: true,
  }).returning();
  
  return Response.json(newProduct[0]);
}
```

### Example: Query Products

```typescript
import { db } from '@/db/db';
import { products, productImages } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get product with images
const product = await db.query.products.findFirst({
  where: eq(products.slug, 'my-product'),
  with: {
    images: true,
    variants: true,
  },
});
```

## Migration Workflow

### Adding a New Column

1. Update `schema.ts`:
```typescript
export const products = pgTable('products', {
  // ... existing columns
  newColumn: varchar('new_column', { length: 255 }),
});
```

2. Generate migration:
```bash
npx drizzle-kit generate:pg
```

3. Review the generated migration file in `/drizzle/migrations`

4. Apply migration:
```bash
npx drizzle-kit push:pg
```

### For Production Deployments

```bash
# Always review migrations before applying
npx drizzle-kit generate:pg

# Check the generated SQL
cat drizzle/migrations/0001_*.sql

# Apply to production (use with caution!)
npx drizzle-kit migrate
```

## Common Commands

```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Push changes directly to database (development only)
npx drizzle-kit push:pg

# Open Drizzle Studio (GUI for database)
npx drizzle-kit studio

# Check database status
npx drizzle-kit check:pg

# Drop all tables (DANGEROUS!)
npx drizzle-kit drop
```

## Drizzle Studio (Database GUI)

View and edit your database visually:

```bash
npx drizzle-kit studio
```

Then open http://localhost:4983 in your browser.

## Seeding Initial Data

Create a seed script (`/src/db/seed.ts`):

```typescript
import { db } from './db';
import { users, categories, siteSettings } from './schema';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.insert(users).values({
    email: 'admin@example.com',
    passwordHash: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    emailVerified: true,
  });

  // Create default categories
  await db.insert(categories).values([
    { name: 'Electronics', slug: 'electronics', isActive: true },
    { name: 'Clothing', slug: 'clothing', isActive: true },
    { name: 'Home & Garden', slug: 'home-garden', isActive: true },
  ]);

  // Create site settings
  await db.insert(siteSettings).values([
    { key: 'store_name', value: 'My Awesome Store', type: 'string', isPublic: true },
    { key: 'currency', value: 'USD', type: 'string', isPublic: true },
    { key: 'tax_rate', value: '0.08', type: 'number', isPublic: true },
  ]);

  console.log('✅ Database seeded successfully!');
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
```

Run it:
```bash
npx tsx src/db/seed.ts
```

## Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql -U postgres -d ecommerce_store

# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS
```

### Migration Issues

```bash
# Reset database (DEVELOPMENT ONLY!)
npx drizzle-kit drop
npx drizzle-kit push:pg

# Or manually drop tables
psql -U postgres -d ecommerce_store
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
\q
```

## Performance Optimization

### Indexes

The schema already includes indexes on frequently queried columns:
- Email lookups (users)
- Product slugs
- Order numbers
- Created timestamps

### Connection Pooling

Already configured in `db.ts` with these settings:
- Max connections: 20
- Idle timeout: 30s
- Connection timeout: 2s

### Query Optimization

Use Drizzle's query builder for efficient queries:

```typescript
// Good: Only select needed columns
const products = await db
  .select({
    id: products.id,
    name: products.name,
    price: products.price,
  })
  .from(products)
  .where(eq(products.isActive, true))
  .limit(10);

// Avoid: Selecting everything when not needed
```

## Backup & Restore

### Backup

```bash
# Full database backup
pg_dump -U postgres ecommerce_store > backup.sql

# Compressed backup
pg_dump -U postgres ecommerce_store | gzip > backup.sql.gz

# Schema only
pg_dump -U postgres --schema-only ecommerce_store > schema.sql
```

### Restore

```bash
# Restore from backup
psql -U postgres ecommerce_store < backup.sql

# From compressed backup
gunzip -c backup.sql.gz | psql -U postgres ecommerce_store
```

## Next Steps

1. ✅ Set up database
2. ✅ Run migrations
3. ✅ Seed initial data
4. 🔄 Build API routes
5. 🔄 Build admin dashboard
6. 🔄 Build frontend

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Next.js Docs](https://nextjs.org/docs)
