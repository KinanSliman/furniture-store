import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products, productVariants } from '@/db/schema';
import { eq, or, lt, lte, sql, desc, asc, and } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET - Get inventory overview and alerts
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Filters
    const alertType = searchParams.get('alertType'); // 'low_stock', 'out_of_stock', 'all'
    const sortBy = searchParams.get('sortBy') || 'stockQuantity';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build sort
    const sortColumn = products[sortBy as keyof typeof products] || products.stockQuantity;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Build where condition function for db.query
    let whereCondition;
    if (alertType === 'out_of_stock') {
      whereCondition = (products: any, { and, eq }: any) => and(
        eq(products.trackInventory, true),
        eq(products.stockQuantity, 0)
      );
    } else if (alertType === 'low_stock') {
      whereCondition = (products: any, { and, eq, sql }: any) => and(
        eq(products.trackInventory, true),
        sql`${products.stockQuantity} > 0 AND ${products.stockQuantity} <= ${products.lowStockThreshold}`
      );
    } else {
      whereCondition = (products: any, { eq }: any) => eq(products.trackInventory, true);
    }

    // Get products with inventory tracking
    const productsList = await db.query.products.findMany({
      where: whereCondition,
      orderBy: orderFn(sortColumn),
      limit,
      offset,
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.displayOrder)],
          limit: 1,
        },
        variants: true,
      },
    });

    // Build where condition for db.select (different syntax)
    let selectWhereCondition;
    if (alertType === 'out_of_stock') {
      selectWhereCondition = and(
        eq(products.trackInventory, true),
        eq(products.stockQuantity, 0)
      );
    } else if (alertType === 'low_stock') {
      selectWhereCondition = and(
        eq(products.trackInventory, true),
        sql`${products.stockQuantity} > 0 AND ${products.stockQuantity} <= ${products.lowStockThreshold}`
      );
    } else {
      selectWhereCondition = eq(products.trackInventory, true);
    }

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(selectWhereCondition);

    // Calculate alerts summary
    const [outOfStockCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        and(
          eq(products.trackInventory, true),
          eq(products.stockQuantity, 0)
        )
      );

    const [lowStockCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        and(
          eq(products.trackInventory, true),
          sql`${products.stockQuantity} > 0 AND ${products.stockQuantity} <= ${products.lowStockThreshold}`
        )
      );

    // Get variant alerts
    const variantsLowStock = await db.query.productVariants.findMany({
      where: (variants, { and, eq, sql }) => and(
        eq(variants.isActive, true),
        sql`${variants.stockQuantity} > 0 AND ${variants.stockQuantity} <= 10`
      ),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      limit: 20,
    });

    const variantsOutOfStock = await db.query.productVariants.findMany({
      where: (variants, { and, eq }) => and(
        eq(variants.isActive, true),
        eq(variants.stockQuantity, 0)
      ),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      limit: 20,
    });

    return NextResponse.json({
      products: productsList,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limit),
      },
      alerts: {
        outOfStock: Number(outOfStockCount?.count || 0),
        lowStock: Number(lowStockCount?.count || 0),
        variantsLowStock: variantsLowStock.length,
        variantsOutOfStock: variantsOutOfStock.length,
      },
      variantAlerts: {
        lowStock: variantsLowStock,
        outOfStock: variantsOutOfStock,
      },
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });

// PATCH - Bulk update inventory
export const PATCH = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { updates } = body; // Array of { id, stockQuantity, lowStockThreshold }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    // Update each product
    const results = [];
    for (const update of updates) {
      if (!update.id) continue;

      const updateData: any = { updatedAt: new Date() };

      if (update.stockQuantity !== undefined) {
        updateData.stockQuantity = update.stockQuantity;
      }

      if (update.lowStockThreshold !== undefined) {
        updateData.lowStockThreshold = update.lowStockThreshold;
      }

      const [updatedProduct] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, update.id))
        .returning();

      results.push(updatedProduct);
    }

    return NextResponse.json({
      message: `Successfully updated ${results.length} product(s)`,
      products: results,
    });

  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
