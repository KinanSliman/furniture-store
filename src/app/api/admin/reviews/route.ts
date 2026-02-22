import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { productReviews, products, users } from '@/db/schema';
import { eq, desc, asc, sql, and, or, like } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET - List all reviews with filtering
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filters
    const rating = searchParams.get('rating');
    const isApproved = searchParams.get('isApproved');
    const isVerifiedPurchase = searchParams.get('isVerifiedPurchase');
    const search = searchParams.get('search'); // Search by product name or review content
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build conditions
    let conditions = [];

    if (rating) {
      conditions.push(eq(productReviews.rating, parseInt(rating)));
    }

    if (isApproved !== null && isApproved !== undefined) {
      conditions.push(eq(productReviews.isApproved, isApproved === 'true'));
    }

    if (isVerifiedPurchase !== null && isVerifiedPurchase !== undefined) {
      conditions.push(eq(productReviews.isVerifiedPurchase, isVerifiedPurchase === 'true'));
    }

    // Build sort
    const sortColumn = productReviews[sortBy as keyof typeof productReviews] || productReviews.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Query reviews with product and user info
    const reviewsList = await db.query.productReviews.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: orderFn(sortColumn as any),
      limit,
      offset,
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(productReviews)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      reviews: reviewsList,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
