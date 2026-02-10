import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products } from '@/db/schema';
import { eq, like, or, desc, asc, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Filters
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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
    
    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive === 'true'));
    }

    // Build sort
    const sortColumn = products[sortBy as keyof typeof products] || products.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Query products
    const productsList = await db.query.products.findMany({
      where: conditions.length > 0 ? sql`${conditions.join(' AND ')}` : undefined,
      orderBy: orderFn(sortColumn),
      limit,
      offset,
      with: {
        images: {
          where: eq(sql`${products.id}`, sql`product_id`),
          orderBy: asc(sql`display_order`),
          limit: 1,
        },
      },
    });

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? sql`${conditions.join(' AND ')}` : undefined);

    return NextResponse.json({
      products: productsList,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}, 'admin');