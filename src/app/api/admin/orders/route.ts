import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, orderItems, users } from '@/db/schema';
import { eq, like, or, desc, asc, sql, and, gte, lte } from 'drizzle-orm';
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
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query conditions
    let conditions = [];

    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.email, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(orders.status, status as any));
    }

    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus as any));
    }

    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(orders.createdAt, new Date(endDate)));
    }

    // Build sort
    const sortColumn = orders[sortBy as keyof typeof orders] || orders.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Query orders with user info
    const ordersList = await db.query.orders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: orderFn(sortColumn),
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          columns: {
            id: true,
            quantity: true,
            price: true,
            total: true,
          },
        },
      },
    });

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      orders: ordersList,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
