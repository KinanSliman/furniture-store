CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" varchar(255),
	"method" varchar(10),
	"endpoint" varchar(500),
	"ip_address" varchar(45),
	"user_agent" text,
	"changes" jsonb,
	"metadata" jsonb,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "name_en" varchar(255);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "name_ar" varchar(255);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "meta_title_en" varchar(255);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "meta_title_ar" varchar(255);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "meta_description_en" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "meta_description_ar" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "name_en" varchar(255);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "name_ar" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "name_en" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "name_ar" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description_en" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description_ar" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_title_en" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_title_ar" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_description_en" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_description_ar" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_status_idx" ON "audit_logs" USING btree ("status");