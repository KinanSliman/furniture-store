# Database Migration Required

## Schema Update: Product Images

The `productImages` table has been updated to include a `publicId` field for Cloudinary integration.

### Migration Steps:

1. **Generate the migration:**
   ```bash
   npm run db:generate
   ```

2. **Push changes to database:**
   ```bash
   npm run db:push
   ```

### What Changed:

- **Table:** `product_images`
- **New Field:** `public_id` (VARCHAR(255), nullable)
- **Purpose:** Stores Cloudinary public ID for easy image deletion

### Schema Change:

```sql
ALTER TABLE product_images
ADD COLUMN public_id VARCHAR(255);
```

This field stores the Cloudinary public ID (e.g., "ecommerce-products/abc123") which allows the system to delete images from Cloudinary when they're removed from products.

---

## Environment Variables Required

Make sure your `.env.local` file contains:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Testing the Image Upload

After running the migration:

1. Navigate to `/admin/products/new`
2. You should see a "Product Images" section at the top
3. Drag and drop images or click "Choose Files"
4. Images will upload to Cloudinary and appear in the gallery
5. You can:
   - Set a primary image (first image is primary by default)
   - Delete images
   - Upload up to 10 images per product
   - Reorder images by display order

---

## Image Storage

All product images are stored in Cloudinary under the folder: **`ecommerce-products`**

This makes it easy to:
- Find all your product images in one place
- Manage storage limits
- Track usage
- Apply bulk operations if needed

---

## Features Implemented

✅ Drag & drop image upload
✅ Multiple images per product (up to 10)
✅ Primary image selection
✅ Image preview gallery
✅ Auto image optimization (Cloudinary)
✅ Dynamic image transformations
✅ Thumbnail generation
✅ File size validation (max 5MB)
✅ File type validation (PNG, JPG, WebP)
✅ Toast notifications
✅ Images display in product list
✅ Delete images from Cloudinary when removed
