# Database Migration Guide - Multilingual Support

## Step 1: Run Database Migration

You need to manually confirm the database migration to add multilingual columns.

**Command:**
```bash
pnpm db:push
```

**When prompted, select:** `Yes, I want to execute all statements`

This will add the following columns:

### Products Table
- `name_en` VARCHAR(255)
- `name_ar` VARCHAR(255)
- `description_en` TEXT
- `description_ar` TEXT
- `short_description_en` TEXT
- `short_description_ar` TEXT
- `meta_title_en` VARCHAR(255)
- `meta_title_ar` VARCHAR(255)
- `meta_description_en` TEXT
- `meta_description_ar` TEXT

### Categories Table
- `name_en` VARCHAR(255)
- `name_ar` VARCHAR(255)
- `description_en` TEXT
- `description_ar` TEXT
- `meta_title_en` VARCHAR(255)
- `meta_title_ar` VARCHAR(255)
- `meta_description_en` TEXT
- `meta_description_ar` TEXT

### Product Variants Table
- `name_en` VARCHAR(255)
- `name_ar` VARCHAR(255)

---

## Step 2: Migrate Existing Data (Optional)

If you have existing products/categories in your database, you should migrate the data from the legacy `name`, `description` fields to the new `name_en`, `description_en` fields.

**Run this SQL in your database:**

```sql
-- Migrate existing product data to English columns
UPDATE products
SET
  name_en = name,
  description_en = description,
  short_description_en = short_description,
  meta_title_en = meta_title,
  meta_description_en = meta_description
WHERE name_en IS NULL;

-- Migrate existing category data to English columns
UPDATE categories
SET
  name_en = name,
  description_en = description,
  meta_title_en = meta_title,
  meta_description_en = meta_description
WHERE name_en IS NULL;

-- Migrate existing product variant data to English columns
UPDATE product_variants
SET
  name_en = name
WHERE name_en IS NULL;
```

**To run this SQL:**

1. Connect to your database using `psql` or a GUI tool like pgAdmin/TablePlus
2. Copy and paste the SQL above
3. Execute it

---

## Step 3: Verify Migration

Check that the columns were added successfully:

```sql
-- Check products table structure
\d products

-- Check categories table structure
\d categories

-- Check product_variants table structure
\d product_variants

-- Verify data was migrated
SELECT id, name, name_en, name_ar FROM products LIMIT 5;
SELECT id, name, name_en, name_ar FROM categories LIMIT 5;
```

---

## Step 4: Test the Application

After migration is complete, the application will:

1. **Display localized names** - Products and categories will show in the selected language
2. **Support dual-language input** - Create/Edit forms will have EN/AR tabs
3. **Fallback to English** - If Arabic translation is missing, English is shown
4. **Backward compatible** - Legacy `name`, `description` fields still work

---

## What Changed?

### 1. Database Schema
- ✅ Added multilingual columns to `products`, `categories`, `product_variants`
- ✅ Kept legacy columns for backward compatibility

### 2. Helper Functions
- ✅ Created `src/lib/i18n-helpers.ts` with utilities:
  - `getLocalizedField()` - Get value in current language
  - `hasTranslation()` - Check if translation exists
  - `validateMultilingualData()` - Validate required fields

### 3. UI Components
- ✅ Created `MultilingualInput` component with:
  - Tabbed interface (English 🇬🇧 / Arabic 🇸🇦)
  - Visual indicators (green dot when translation exists)
  - RTL support for Arabic input
  - Validation (at least one language required)

---

## Next Steps

After completing the migration:

1. I'll update the product forms to use `MultilingualInput`
2. I'll update the category forms
3. I'll update the API routes to handle multilingual data
4. I'll update product/category lists to display localized names

**Are you ready to proceed? Please run the migration commands above and let me know when complete!**
