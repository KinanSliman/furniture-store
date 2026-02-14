import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  decimal, 
  integer, 
  timestamp, 
  boolean, 
  json,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  serial
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['customer', 'admin', 'super_admin']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded'
]);
export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',
  'fixed_amount',
  'free_shipping',
  'buy_x_get_y'
]);
export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'sale',
  'return',
  'adjustment',
  'restock',
  'damaged',
  'lost'
]);
export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed',
  'returned'
]);

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').default('customer').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResets = pgTable('password_resets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// ADDRESSES
// ============================================================================

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // 'shipping' or 'billing'
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  company: varchar('company', { length: 100 }),
  address1: varchar('address_1', { length: 255 }).notNull(),
  address2: varchar('address_2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 2 }).notNull(), // ISO country code
  phone: varchar('phone', { length: 20 }),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// CATEGORIES
// ============================================================================

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  parentId: uuid('parent_id'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
  parentIdIdx: index('categories_parent_id_idx').on(table.parentId),
}));

// Self-referencing for parent category
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_parent'
  }),
  children: many(categories, {
    relationName: 'category_parent'
  }),
  productCategories: many(productCategories),
}));

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  shortDescription: text('short_description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }), // Original price for sale items
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }), // For profit calculation
  sku: varchar('sku', { length: 100 }).unique(),
  barcode: varchar('barcode', { length: 100 }),
  trackInventory: boolean('track_inventory').default(true).notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  weight: decimal('weight', { precision: 10, scale: 2 }), // in kg or lbs (configure in settings)
  weightUnit: varchar('weight_unit', { length: 10 }).default('kg'),
  length: decimal('length', { precision: 10, scale: 2 }), // dimensions for shipping
  width: decimal('width', { precision: 10, scale: 2 }),
  height: decimal('height', { precision: 10, scale: 2 }),
  dimensionUnit: varchar('dimension_unit', { length: 10 }).default('cm'),
  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  attributes: jsonb('attributes'), // Flexible product attributes (color, size, material, etc.)
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  metaKeywords: varchar('meta_keywords', { length: 500 }),
  viewCount: integer('view_count').default(0).notNull(),
  salesCount: integer('sales_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
  skuIdx: index('products_sku_idx').on(table.sku),
  isActiveIdx: index('products_is_active_idx').on(table.isActive),
  isFeaturedIdx: index('products_is_featured_idx').on(table.isFeatured),
}));

export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  publicId: varchar('public_id', { length: 255 }), // Cloudinary public ID for deletion
  altText: varchar('alt_text', { length: 255 }),
  displayOrder: integer('display_order').default(0).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('product_images_product_id_idx').on(table.productId),
}));

export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Large - Red"
  sku: varchar('sku', { length: 100 }).unique(),
  price: decimal('price', { precision: 10, scale: 2 }), // Override product price if set
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  attributes: jsonb('attributes').notNull(), // { "size": "L", "color": "Red" }
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('product_variants_product_id_idx').on(table.productId),
  skuIdx: index('product_variants_sku_idx').on(table.sku),
}));

// ============================================================================
// PRODUCT RELATIONSHIPS
// ============================================================================

export const productCategories = pgTable('product_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  productCategoryIdx: uniqueIndex('product_category_idx').on(table.productId, table.categoryId),
}));

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productTags = pgTable('product_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  productTagIdx: uniqueIndex('product_tag_idx').on(table.productId, table.tagId),
}));

export const collections = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const collectionProducts = pgTable('collection_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  collectionProductIdx: uniqueIndex('collection_product_idx').on(table.collectionId, table.productId),
}));

// ============================================================================
// SHOPPING CART
// ============================================================================

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }), // For guest users
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('carts_user_id_idx').on(table.userId),
  sessionIdIdx: index('carts_session_id_idx').on(table.sessionId),
}));

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').default(1).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Snapshot price at time of add
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cartIdIdx: index('cart_items_cart_id_idx').on(table.cartId),
}));

// ============================================================================
// ORDERS
// ============================================================================

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  
  // Pricing
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0').notNull(),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).default('0').notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  
  // Payment
  paymentMethod: varchar('payment_method', { length: 50 }), // stripe, paypal, cod
  paymentIntentId: varchar('payment_intent_id', { length: 255 }), // Stripe payment intent
  
  // Shipping
  shippingMethod: varchar('shipping_method', { length: 100 }),
  shippingAddressId: uuid('shipping_address_id').references(() => addresses.id),
  billingAddressId: uuid('billing_address_id').references(() => addresses.id),
  
  // Discount
  discountCodeId: uuid('discount_code_id').references(() => discountCodes.id),
  
  // Metadata
  customerNotes: text('customer_notes'),
  adminNotes: text('admin_notes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orderNumberIdx: uniqueIndex('orders_order_number_idx').on(table.orderNumber),
  userIdIdx: index('orders_user_id_idx').on(table.userId),
  statusIdx: index('orders_status_idx').on(table.status),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  
  // Snapshot data (in case product is deleted)
  productName: varchar('product_name', { length: 255 }).notNull(),
  variantName: varchar('variant_name', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Unit price
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0').notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(), // (price * quantity) - discount + tax
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
}));

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  status: orderStatusEnum('status').notNull(),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index('order_status_history_order_id_idx').on(table.orderId),
}));

// ============================================================================
// DISCOUNTS & PROMOTIONS
// ============================================================================

export const discountCodes = pgTable('discount_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: discountTypeEnum('type').notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(), // Percentage or fixed amount
  
  // Restrictions
  minPurchase: decimal('min_purchase', { precision: 10, scale: 2 }), // Minimum order amount
  maxUses: integer('max_uses'), // Total uses allowed
  usesCount: integer('uses_count').default(0).notNull(), // Current usage count
  maxUsesPerCustomer: integer('max_uses_per_customer').default(1),
  
  // Eligibility
  applicableProductIds: jsonb('applicable_product_ids'), // Array of product IDs
  applicableCategoryIds: jsonb('applicable_category_ids'), // Array of category IDs
  firstTimeCustomerOnly: boolean('first_time_customer_only').default(false),
  
  // Timing
  startsAt: timestamp('starts_at'),
  expiresAt: timestamp('expires_at'),
  
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex('discount_codes_code_idx').on(table.code),
}));

export const discountUsage = pgTable('discount_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  discountCodeId: uuid('discount_code_id').references(() => discountCodes.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  discountCodeIdIdx: index('discount_usage_discount_code_id_idx').on(table.discountCodeId),
  userIdIdx: index('discount_usage_user_id_idx').on(table.userId),
}));

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

export const productReviews = pgTable('product_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(), // 1-5
  title: varchar('title', { length: 255 }),
  content: text('content'),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  helpfulCount: integer('helpful_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('product_reviews_product_id_idx').on(table.productId),
  isApprovedIdx: index('product_reviews_is_approved_idx').on(table.isApproved),
}));

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  type: inventoryMovementTypeEnum('type').notNull(),
  quantityChange: integer('quantity_change').notNull(), // Positive or negative
  quantityAfter: integer('quantity_after').notNull(), // Stock after this movement
  referenceId: uuid('reference_id'), // Order ID, Purchase Order ID, etc.
  referenceType: varchar('reference_type', { length: 50 }), // 'order', 'purchase_order', 'adjustment'
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('inventory_movements_product_id_idx').on(table.productId),
  variantIdIdx: index('inventory_movements_variant_id_idx').on(table.variantId),
  typeIdx: index('inventory_movements_type_idx').on(table.type),
}));

export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  website: varchar('website', { length: 255 }),
  address: text('address'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  poNumber: varchar('po_number', { length: 50 }).notNull().unique(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, ordered, received, cancelled
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  orderedAt: timestamp('ordered_at'),
  receivedAt: timestamp('received_at'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// SHIPPING
// ============================================================================

export const shippingZones = pgTable('shipping_zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  countries: jsonb('countries').notNull(), // Array of country codes
  regions: jsonb('regions'), // States/provinces
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shippingRates = pgTable('shipping_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  zoneId: uuid('zone_id').references(() => shippingZones.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Standard Shipping", "Express"
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  
  // Conditions
  minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
  maxOrderAmount: decimal('max_order_amount', { precision: 10, scale: 2 }),
  minWeight: decimal('min_weight', { precision: 10, scale: 2 }),
  maxWeight: decimal('max_weight', { precision: 10, scale: 2 }),
  
  estimatedDays: integer('estimated_days'), // Delivery time estimate
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  zoneIdIdx: index('shipping_rates_zone_id_idx').on(table.zoneId),
}));

export const shipments = pgTable('shipments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  carrier: varchar('carrier', { length: 100 }), // UPS, FedEx, USPS, etc.
  trackingNumber: varchar('tracking_number', { length: 255 }),
  trackingUrl: varchar('tracking_url', { length: 500 }),
  status: shipmentStatusEnum('status').default('pending').notNull(),
  shippedAt: timestamp('shipped_at'),
  estimatedDeliveryAt: timestamp('estimated_delivery_at'),
  deliveredAt: timestamp('delivered_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index('shipments_order_id_idx').on(table.orderId),
  trackingNumberIdx: index('shipments_tracking_number_idx').on(table.trackingNumber),
}));

// ============================================================================
// ANALYTICS
// ============================================================================

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // page_view, product_view, add_to_cart, etc.
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 255 }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata'), // Additional event data
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  eventTypeIdx: index('analytics_events_event_type_idx').on(table.eventType),
  createdAtIdx: index('analytics_events_created_at_idx').on(table.createdAt),
  productIdIdx: index('analytics_events_product_id_idx').on(table.productId),
}));

export const dailyStats = pgTable('daily_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: varchar('date', { length: 10 }).notNull().unique(), // YYYY-MM-DD
  revenue: decimal('revenue', { precision: 12, scale: 2 }).default('0').notNull(),
  ordersCount: integer('orders_count').default(0).notNull(),
  productsSold: integer('products_sold').default(0).notNull(),
  newCustomers: integer('new_customers').default(0).notNull(),
  visitors: integer('visitors').default(0).notNull(),
  pageViews: integer('page_views').default(0).notNull(),
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }), // Percentage
  averageOrderValue: decimal('average_order_value', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  dateIdx: uniqueIndex('daily_stats_date_idx').on(table.date),
}));

// ============================================================================
// SETTINGS & CONFIGURATION
// ============================================================================

export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value'),
  type: varchar('type', { length: 50 }).notNull(), // string, number, boolean, json
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(), // Can be exposed to frontend
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: uniqueIndex('site_settings_key_idx').on(table.key),
}));

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(), // order_confirmation, shipping_notification, etc.
  subject: varchar('subject', { length: 255 }).notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  variables: jsonb('variables'), // Available template variables
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('pages_slug_idx').on(table.slug),
}));

// ============================================================================
// WISHLIST (Optional - can be added later)
// ============================================================================

export const wishlists = pgTable('wishlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userProductIdx: uniqueIndex('wishlist_user_product_idx').on(table.userId, table.productId, table.variantId),
}));

// ============================================================================
// RELATIONS (for Drizzle query API)
// ============================================================================

export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  variants: many(productVariants),
  productCategories: many(productCategories),
  productTags: many(productTags),
  reviews: many(productReviews),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  shipments: many(shipments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [orderStatusHistory.createdBy],
    references: [users.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productReviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [productReviews.orderId],
    references: [orders.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  reviews: many(productReviews),
}));
