DO $$ BEGIN
 CREATE TYPE "discount_type" AS ENUM('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "inventory_movement_type" AS ENUM('sale', 'return', 'adjustment', 'restock', 'damaged', 'lost');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "shipment_status" AS ENUM('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('customer', 'admin', 'super_admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" varchar(20) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"company" varchar(100),
	"address_1" varchar(255) NOT NULL,
	"address_2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"postal_code" varchar(20) NOT NULL,
	"country" varchar(2) NOT NULL,
	"phone" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"product_id" uuid,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"parent_id" uuid,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collection_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" varchar(10) NOT NULL,
	"revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"orders_count" integer DEFAULT 0 NOT NULL,
	"products_sold" integer DEFAULT 0 NOT NULL,
	"new_customers" integer DEFAULT 0 NOT NULL,
	"visitors" integer DEFAULT 0 NOT NULL,
	"page_views" integer DEFAULT 0 NOT NULL,
	"conversion_rate" numeric(5, 2),
	"average_order_value" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_stats_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" "discount_type" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"min_purchase" numeric(10, 2),
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"max_uses_per_customer" integer DEFAULT 1,
	"applicable_product_ids" jsonb,
	"applicable_category_ids" jsonb,
	"first_time_customer_only" boolean DEFAULT false,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discount_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discount_code_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"variables" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"type" "inventory_movement_type" NOT NULL,
	"quantity_change" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"product_name" varchar(255) NOT NULL,
	"variant_name" varchar(255),
	"sku" varchar(100),
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "order_status" NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0' NOT NULL,
	"shipping_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50),
	"payment_intent_id" varchar(255),
	"shipping_method" varchar(100),
	"shipping_address_id" uuid,
	"billing_address_id" uuid,
	"discount_code_id" uuid,
	"customer_notes" text,
	"admin_notes" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"alt_text" varchar(255),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"rating" integer NOT NULL,
	"title" varchar(255),
	"content" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"price" numeric(10, 2),
	"compare_at_price" numeric(10, 2),
	"cost_price" numeric(10, 2),
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"image_url" varchar(500),
	"attributes" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" text,
	"price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"cost_price" numeric(10, 2),
	"sku" varchar(100),
	"barcode" varchar(100),
	"track_inventory" boolean DEFAULT true NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5,
	"weight" numeric(10, 2),
	"weight_unit" varchar(10) DEFAULT 'kg',
	"length" numeric(10, 2),
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"dimension_unit" varchar(10) DEFAULT 'cm',
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"attributes" jsonb,
	"meta_title" varchar(255),
	"meta_description" text,
	"meta_keywords" varchar(500),
	"view_count" integer DEFAULT 0 NOT NULL,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"supplier_id" uuid,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"notes" text,
	"ordered_at" timestamp,
	"received_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"carrier" varchar(100),
	"tracking_number" varchar(255),
	"tracking_url" varchar(500),
	"status" "shipment_status" DEFAULT 'pending' NOT NULL,
	"shipped_at" timestamp,
	"estimated_delivery_at" timestamp,
	"delivered_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipping_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2),
	"max_order_amount" numeric(10, 2),
	"min_weight" numeric(10, 2),
	"max_weight" numeric(10, 2),
	"estimated_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipping_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"countries" jsonb NOT NULL,
	"regions" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb,
	"type" varchar(50) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"website" varchar(255),
	"address" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_event_type_idx" ON "analytics_events" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_product_id_idx" ON "analytics_events" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_items_cart_id_idx" ON "cart_items" ("cart_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_user_id_idx" ON "carts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_session_id_idx" ON "carts" ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "collection_product_idx" ON "collection_products" ("collection_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_stats_date_idx" ON "daily_stats" ("date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "discount_codes_code_idx" ON "discount_codes" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discount_usage_discount_code_id_idx" ON "discount_usage" ("discount_code_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discount_usage_user_id_idx" ON "discount_usage" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_movements_product_id_idx" ON "inventory_movements" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_movements_variant_id_idx" ON "inventory_movements" ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_movements_type_idx" ON "inventory_movements" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_status_history_order_id_idx" ON "order_status_history" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_idx" ON "orders" ("order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_category_idx" ON "product_categories" ("product_id","category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "product_images" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_reviews_product_id_idx" ON "product_reviews" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_reviews_is_approved_idx" ON "product_reviews" ("is_approved");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_tag_idx" ON "product_tags" ("product_id","tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx" ON "product_variants" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_sku_idx" ON "product_variants" ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products" ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_is_active_idx" ON "products" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_is_featured_idx" ON "products" ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipments_order_id_idx" ON "shipments" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipments_tracking_number_idx" ON "shipments" ("tracking_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipping_rates_zone_id_idx" ON "shipping_rates" ("zone_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_key_idx" ON "site_settings" ("key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_user_product_idx" ON "wishlists" ("user_id","product_id","variant_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "shipping_zones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
