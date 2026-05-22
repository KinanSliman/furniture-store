<div align="center">

# Lumina Living

**A full-stack furniture e-commerce platform — storefront, admin dashboard, and demo checkout.**

Built with Next.js 16, TypeScript, PostgreSQL, and Tailwind v4.

</div>

## 📖 About

Lumina Living is a portfolio project demonstrating a production-grade e-commerce platform end to end:

- A **public storefront** with a hero carousel, category browsing, search, filters, product detail pages, and a persistent cart
- A **demo checkout** that records real orders without charging cards (no Stripe key required to try it)
- A **full admin dashboard** for managing products, variants, orders, customers, inventory, discounts, reviews, and analytics
- **English ↔ Arabic** content with full RTL support

> ℹ️ **Demo mode** — the checkout flow creates real database orders but does not process payments. Stripe & PayPal SDKs are scaffolded in the codebase and the schema supports them, but no payment processor is wired in by design.

---

## 🚀 Live demo

> _Replace the link below with your deployed URL._

🔗 **[lumina-living.vercel.app](#)**

**Demo admin login** (after running `pnpm db:seed` with the defaults):

```
Email:    admin@luminaliving.com
Password: admin123
```

---

## 📸 Screenshots

> _Add screenshots to a `/docs/screenshots` folder and reference them here._

|  Storefront   | Product detail | Admin dashboard |
| :-----------: | :------------: | :-------------: |
| _coming soon_ | _coming soon_  |  _coming soon_  |

---

## 🛠 Tech stack

| Layer              | Choice                                                               |
| ------------------ | -------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router, Turbopack, React Compiler)                   |
| Language           | TypeScript (strict)                                                  |
| Styling            | Tailwind CSS v4, `tailwindcss-rtl`                                   |
| Database           | PostgreSQL via [Neon](https://neon.tech/) (serverless HTTP driver)   |
| ORM                | [Drizzle](https://orm.drizzle.team/)                                 |
| Auth               | JWT in httpOnly cookies, bcrypt, CSRF (double-submit), rate limiting |
| Images             | [Cloudinary](https://cloudinary.com/)                                |
| i18n               | `next-intl` (EN / AR with RTL)                                       |
| Charts             | Recharts                                                             |
| Forms / validation | React Hook Form + Zod                                                |
| Notifications      | Sonner                                                               |
| Icons              | Lucide                                                               |

---

## ✨ Features

### Storefront

- 📱 Fully responsive — phone, tablet, desktop, with hamburger and slide-over drawers
- 🛒 Persistent cart with slide-over drawer (localStorage-backed)
- 🔍 Search, category filters, price range, sorting
- 🖼 Product gallery with thumbnails, zoom, variants
- ⭐ Customer reviews and average ratings
- 🌐 English / Arabic with automatic RTL layout
- ✅ Demo checkout with shipping form, tax & shipping calculation, order confirmation page

### Admin dashboard

- 📊 Real-time stats: revenue, orders, products, customers (month-over-month deltas)
- 🪑 Products: full CRUD, variants, multi-image upload, SEO fields, CSV import/export
- 📦 Orders: status workflow, status history timeline, fulfillment + shipment tracking
- 👤 Customers: profiles, order history, lifetime value
- 🎟 Discounts: percentage / fixed / free shipping, usage limits, expiry, first-customer-only
- 📦 Inventory: low-stock alerts, bulk threshold updates
- ⭐ Reviews: approve / reject / delete moderation
- 🌐 Bilingual content management (EN + AR for products, categories, SEO)
- 📈 Analytics: revenue trend, top products, order status breakdown

### Security

- JWT auth with strong secret enforcement (throws at startup if missing)
- Bcrypt password hashing
- Rate limiting on auth + general routes
- CSRF tokens on stateful endpoints
- Input sanitization (XSS, SQL injection, CSV injection)
- Audit logging for all admin write actions
- httpOnly cookies, secure-in-prod flag

---

## 🚀 Quick start

### Prerequisites

- Node 18+ (Node 20 recommended)
- pnpm (or npm / yarn)
- A Postgres database — easiest is a free [Neon](https://console.neon.tech/) project
- A free [Cloudinary](https://cloudinary.com/) account for product images

### Setup

```bash
# 1. Clone and install
git clone <your-repo-url> lumina-living
cd lumina-living
pnpm install

# 2. Configure environment
cp .env.example .env.local
# edit .env.local — fill in DATABASE_URL, JWT_SECRET, CSRF_SECRET,
# CLOUDINARY_*, and ADMIN_EMAIL / ADMIN_PASSWORD

# 3. Push the schema and seed demo data
pnpm db:push
pnpm db:seed

# 4. Run it
pnpm dev
```

Open:

- 🛍 Storefront → [http://localhost:3000](http://localhost:3000)
- 🔐 Admin → [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### Generating secrets

```bash
openssl rand -base64 48     # JWT_SECRET
openssl rand -base64 32     # CSRF_SECRET
```

---

## ☁️ Deploying to Vercel

1. Push the repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Under **Project → Settings → Environment Variables**, add every variable from [`.env.example`](./.env.example).
4. Trigger the first deploy.
5. Once deployed, run the migrations and seed against your production DB once:
   ```bash
   # locally, with the production DATABASE_URL exported
   DATABASE_URL="<prod-url>" pnpm db:push
   DATABASE_URL="<prod-url>" pnpm db:seed
   ```

> 💡 The app uses Neon's serverless HTTP driver, so it works on Vercel's Edge / serverless runtimes without a connection pooler.

---

## 🗂 Project structure

```
src/
├── app/
│   ├── (store)/              # Public storefront (home, shop, product, checkout)
│   ├── admin/                # Admin dashboard pages
│   └── api/
│       ├── store/            # Public APIs (products, categories, checkout)
│       └── admin/            # Protected admin APIs
├── components/               # Shared UI components
├── db/
│   ├── schema.ts             # Drizzle schema (single source of truth)
│   ├── db.ts                 # DB client (Neon HTTP)
│   ├── seed.ts               # Demo-data seeder
│   └── migrate.ts            # Migration runner
├── hooks/
│   └── useCart.tsx           # Cart context + slide-over drawer
├── i18n/                     # next-intl config
├── lib/                      # auth, middleware, utils, cloudinary, csrf, rate-limit
└── messages/                 # en.json / ar.json (600+ translation keys)
```

---

## 📜 Available scripts

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `pnpm dev`         | Run the dev server with Turbopack                   |
| `pnpm build`       | Production build                                    |
| `pnpm start`       | Start the production server                         |
| `pnpm lint`        | Run ESLint                                          |
| `pnpm db:push`     | Sync the Drizzle schema to your database            |
| `pnpm db:generate` | Generate a migration from schema changes            |
| `pnpm db:migrate`  | Run pending migrations                              |
| `pnpm db:seed`     | Seed demo data (admin user, products, orders, etc.) |
| `pnpm db:studio`   | Open Drizzle Studio (DB browser)                    |

---

## 🧪 Demo seed data

`pnpm db:seed` creates:

- 1 admin user (configurable via `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- 5 demo customers
- 6 categories (Living Room, Bedroom, Dining, Home Office, Outdoor, Lighting)
- 15 furniture products with images
- 6 sample orders across various statuses
- 6 product reviews
- 3 active discount codes (`WELCOME10`, `FREESHIP`, `SUMMER25`)
- Default site settings

---

## 🤝 Contributing

This is a portfolio project, but issues and PRs are welcome if you spot bugs or have improvement ideas.

---

## 📄 License

[MIT](./LICENSE) — feel free to use this as a reference or starter for your own projects.

---

<div align="center">

Built with ☕ as a portfolio piece. If you found it useful, leave a ⭐ on the repo.

</div>
