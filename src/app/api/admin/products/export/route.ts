import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products } from '@/db/schema';
import { eq, and, like, or } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET - Export products to CSV
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Filters (same as product list)
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    // Build query conditions
    let conditions = [];

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`)
        )
      );
    }

    if (isActive !== null && isActive !== undefined && isActive !== 'all') {
      conditions.push(eq(products.isActive, isActive === 'true'));
    }

    // Query products with variants
    const productsList = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        variants: true,
        productCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    // Convert to CSV format
    const csvHeaders = [
      'ID',
      'Name',
      'Slug',
      'Description',
      'Short Description',
      'Price',
      'Compare At Price',
      'Cost Price',
      'SKU',
      'Barcode',
      'Stock Quantity',
      'Low Stock Threshold',
      'Track Inventory',
      'Weight',
      'Weight Unit',
      'Length',
      'Width',
      'Height',
      'Dimension Unit',
      'Is Active',
      'Is Featured',
      'Categories',
      'Variants Count',
      'Meta Title',
      'Meta Description',
      'Meta Keywords',
      'Created At',
      'Updated At',
    ].join(',');

    const csvRows = productsList.map((product) => {
      // Get category names
      const categories = product.productCategories
        ?.map((pc) => pc.category.name)
        .join('; ') || '';

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCSV(product.id),
        escapeCSV(product.name),
        escapeCSV(product.slug),
        escapeCSV(product.description),
        escapeCSV(product.shortDescription),
        escapeCSV(product.price),
        escapeCSV(product.compareAtPrice),
        escapeCSV(product.costPrice),
        escapeCSV(product.sku),
        escapeCSV(product.barcode),
        escapeCSV(product.stockQuantity),
        escapeCSV(product.lowStockThreshold),
        escapeCSV(product.trackInventory),
        escapeCSV(product.weight),
        escapeCSV(product.weightUnit),
        escapeCSV(product.length),
        escapeCSV(product.width),
        escapeCSV(product.height),
        escapeCSV(product.dimensionUnit),
        escapeCSV(product.isActive),
        escapeCSV(product.isFeatured),
        escapeCSV(categories),
        escapeCSV(product.variants?.length || 0),
        escapeCSV(product.metaTitle),
        escapeCSV(product.metaDescription),
        escapeCSV(product.metaKeywords),
        escapeCSV(product.createdAt.toISOString()),
        escapeCSV(product.updatedAt.toISOString()),
      ].join(',');
    });

    const csv = [csvHeaders, ...csvRows].join('\n');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products-export-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json(
      { error: 'Failed to export products' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
