# Database Schema Overview

## Summary

This is a complete, production-ready PostgreSQL schema for an ecommerce platform built with Drizzle ORM. The schema supports all standard ecommerce features and is designed for maximum reusability across multiple client deployments.

## Key Features

✅ **Universal Product Support** - Works for any physical product type (electronics, furniture, clothing, etc.)
✅ **Variants System** - Handle product options (size, color, material, etc.)
✅ **Flexible Attributes** - JSONB fields for product-specific data
✅ **Advanced Inventory** - Real-time tracking, movement history, low stock alerts
✅ **Multiple Payments** - Stripe, PayPal, Cash on Delivery ready
✅ **Shipping Zones** - Zone-based rates with weight/price conditions
✅ **Discount Engine** - Percentage, fixed, free shipping, buy-x-get-y
✅ **Analytics** - Event tracking, daily stats, conversion metrics
✅ **SEO Optimized** - Meta fields, slugs, structured data ready
✅ **Email Marketing** - Templates, customer segmentation
✅ **Reviews & Ratings** - Verified purchase reviews
✅ **Multi-Address** - Shipping and billing addresses per user
✅ **Order History** - Complete status tracking
✅ **CMS Pages** - Static pages (About, Terms, etc.)

## Table Count: 36 Tables

### Core Tables (10)
1. **users** - Customer and admin accounts
2. **sessions** - User session management
3. **password_resets** - Password recovery
4. **addresses** - Shipping & billing addresses
5. **categories** - Hierarchical product categories
6. **products** - Main product catalog
7. **product_images** - Multiple images per product
8. **product_variants** - Product options (size, color, etc.)
9. **tags** - Product tags for filtering
10. **collections** - Curated product groups

### Relationship Tables (4)
11. **product_categories** - Products ↔ Categories (many-to-many)
12. **product_tags** - Products ↔ Tags (many-to-many)
13. **collection_products** - Collections ↔ Products (many-to-many)

### Shopping & Orders (6)
14. **carts** - Shopping carts (user & guest)
15. **cart_items** - Cart line items
16. **orders** - Customer orders
17. **order_items** - Order line items
18. **order_status_history** - Status change tracking

### Discounts & Reviews (4)
19. **discount_codes** - Coupon/promo codes
20. **discount_usage** - Track code usage
21. **product_reviews** - Customer reviews & ratings

### Inventory (3)
22. **inventory_movements** - Stock change history
23. **suppliers** - Supplier information
24. **purchase_orders** - Incoming inventory

### Shipping (3)
25. **shipping_zones** - Geographic shipping zones
26. **shipping_rates** - Zone-based shipping pricing
27. **shipments** - Shipment tracking

### Analytics (2)
28. **analytics_events** - User behavior tracking
29. **daily_stats** - Aggregated daily metrics

### Settings (3)
30. **site_settings** - Store configuration
31. **email_templates** - Email templates
32. **pages** - CMS pages

### Optional (1)
33. **wishlists** - Customer wishlists

## Data Types Used

- **UUID** - All primary keys (better for distributed systems)
- **VARCHAR** - Text with length limits (names, emails, codes)
- **TEXT** - Long text (descriptions, content)
- **DECIMAL** - Prices and monetary values (precision: 10,2)
- **INTEGER** - Quantities, counts
- **BOOLEAN** - Flags (isActive, isFeatured, etc.)
- **TIMESTAMP** - All date/time fields
- **JSONB** - Flexible attributes, settings (indexed, queryable)
- **ENUM** - Status fields (type-safe, limited options)

## Enums Defined

1. `user_role` - customer, admin, super_admin
2. `order_status` - pending, confirmed, processing, shipped, delivered, cancelled, refunded
3. `payment_status` - pending, paid, failed, refunded, partially_refunded
4. `discount_type` - percentage, fixed_amount, free_shipping, buy_x_get_y
5. `inventory_movement_type` - sale, return, adjustment, restock, damaged, lost
6. `shipment_status` - pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned

## Indexes Created

Performance-critical indexes are pre-defined:

- **Unique indexes**: Email, slugs, SKUs, order numbers
- **Foreign key indexes**: All relationships
- **Query indexes**: Status fields, dates, active flags
- **Search indexes**: Ready for full-text search implementation

## JSONB Fields (Flexible Data)

These fields allow storing product-specific data without schema changes:

1. **products.attributes**
   ```json
   {
     "processor": "Intel i7",
     "ram": "16GB",
     "screen": "15.6 inch",
     "warranty": "2 years"
   }
   ```

2. **product_variants.attributes**
   ```json
   {
     "size": "Large",
     "color": "Navy Blue",
     "material": "Cotton"
   }
   ```

3. **site_settings.value**
   ```json
   {
     "store_name": "My Store",
     "currency": "USD",
     "tax_rate": 0.08
   }
   ```

## Relationships Map

```
users
├── sessions (1:many)
├── password_resets (1:many)
├── addresses (1:many)
├── carts (1:many)
├── orders (1:many)
└── reviews (1:many)

products
├── images (1:many)
├── variants (1:many)
├── categories (many:many via product_categories)
├── tags (many:many via product_tags)
├── collections (many:many via collection_products)
└── reviews (1:many)

orders
├── items (1:many)
├── status_history (1:many)
├── shipments (1:many)
├── user (many:1)
├── shipping_address (many:1)
├── billing_address (many:1)
└── discount_code (many:1)

categories
├── parent (self-referencing)
└── children (self-referencing)
```

## Product Data Model Examples

### Example 1: Laptop
```typescript
{
  name: "MacBook Pro 16-inch",
  slug: "macbook-pro-16",
  price: 2499.00,
  sku: "MBP16-2024",
  weight: 2.1,
  weightUnit: "kg",
  attributes: {
    processor: "M3 Max",
    ram: "32GB",
    storage: "1TB SSD",
    screen: "16.2-inch Liquid Retina XDR",
    ports: "3x Thunderbolt 4, HDMI, SD card",
    warranty: "1 year"
  },
  variants: [
    {
      name: "32GB RAM / 1TB SSD - Space Black",
      price: 2499.00,
      attributes: { ram: "32GB", storage: "1TB", color: "Space Black" }
    },
    {
      name: "64GB RAM / 2TB SSD - Silver",
      price: 3499.00,
      attributes: { ram: "64GB", storage: "2TB", color: "Silver" }
    }
  ]
}
```

### Example 2: T-Shirt
```typescript
{
  name: "Premium Cotton T-Shirt",
  slug: "premium-cotton-tee",
  price: 29.99,
  sku: "TEE-PREM",
  weight: 0.2,
  weightUnit: "kg",
  attributes: {
    material: "100% Organic Cotton",
    fit: "Regular",
    care: "Machine wash cold",
    made_in: "USA"
  },
  variants: [
    { name: "Small - Black", sku: "TEE-S-BLK", attributes: { size: "S", color: "Black" } },
    { name: "Small - White", sku: "TEE-S-WHT", attributes: { size: "S", color: "White" } },
    { name: "Medium - Black", sku: "TEE-M-BLK", attributes: { size: "M", color: "Black" } },
    // ... etc
  ]
}
```

### Example 3: Office Chair
```typescript
{
  name: "Ergonomic Office Chair",
  slug: "ergonomic-office-chair",
  price: 299.99,
  sku: "CHAIR-ERG-001",
  weight: 25.5,
  weightUnit: "kg",
  length: 66,
  width: 66,
  height: 122,
  dimensionUnit: "cm",
  attributes: {
    material: "Mesh back, fabric seat",
    weight_capacity: "136 kg",
    adjustable_height: "43-53 cm",
    armrests: "Adjustable",
    warranty: "5 years",
    assembly_required: true
  },
  variants: [
    { name: "Black with Lumbar Support", attributes: { color: "Black", lumbar: true } },
    { name: "Gray without Lumbar", attributes: { color: "Gray", lumbar: false } }
  ]
}
```

## Security Features

1. **Password Hashing** - Using bcrypt (never store plain passwords)
2. **Session Management** - Secure token-based sessions with expiry
3. **SQL Injection Protection** - Drizzle ORM handles parameterized queries
4. **UUID Primary Keys** - Harder to enumerate than sequential IDs
5. **Soft Deletes** - Set `isActive: false` instead of deleting (for orders, users)
6. **Audit Trail** - created_at, updated_at on all major tables

## Scalability Considerations

1. **Indexes** - Pre-defined on high-traffic queries
2. **Connection Pooling** - Configured in db.ts (max 20 connections)
3. **JSONB** - Fast, indexed JSON queries in PostgreSQL
4. **Partitioning Ready** - analytics_events table can be partitioned by date
5. **Read Replicas** - Schema supports read replica setup

## Migration Strategy

The schema is version-controlled through Drizzle migrations:

1. **Initial Migration** - Creates all tables
2. **Future Migrations** - Add columns, indexes as needed
3. **No Breaking Changes** - Additive-only migrations (never delete columns in production)
4. **Rollback Support** - Each migration can be reverted

## What's NOT Included (Can Add Later)

These features can be added via migrations when needed:

- Multi-currency support
- Multi-language content
- Subscription products
- Gift cards
- Store credit
- Loyalty points
- Affiliate program
- Multi-vendor marketplace
- Digital downloads
- Product bundles
- Pre-orders
- Waitlists

## File Deliverables

1. ✅ **schema.ts** - Complete Drizzle schema (36 tables)
2. ✅ **drizzle.config.ts** - Drizzle Kit configuration
3. ✅ **db.ts** - Database connection utility
4. ✅ **DATABASE_SETUP.md** - Step-by-step setup guide
5. ✅ **package.json** - All dependencies
6. ✅ **.env.example** - Environment variables template
7. ✅ **SCHEMA_OVERVIEW.md** - This file

## Next Steps

1. Install dependencies: `npm install`
2. Setup PostgreSQL database
3. Configure `.env` file
4. Run migrations: `npm run db:push`
5. Seed initial data: `npm run db:seed`
6. Start building API routes
7. Build admin dashboard
8. Build frontend per client

## Estimated Database Size

For a typical store with:
- 10,000 products
- 50,000 orders
- 25,000 customers
- 100,000 analytics events

**Expected database size: ~2-5 GB**

PostgreSQL handles this easily on modest hardware.

## Support Matrix

| Product Type | Supported | Notes |
|-------------|-----------|-------|
| Physical products | ✅ | Full support |
| Product variants | ✅ | Size, color, material, etc. |
| Digital products | ⚠️ | Minor tweaks needed (skip shipping) |
| Services | ⚠️ | Would need booking/scheduling tables |
| Subscriptions | ⚠️ | Would need subscription tables |
| Rentals | ⚠️ | Would need rental/return tracking |

## Questions?

This schema is production-ready for any standard ecommerce store selling physical products. It's been designed with reusability, performance, and flexibility in mind.

Ready to start building the API routes! 🚀
