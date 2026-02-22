import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users } from '@/db/schema';
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
    const isActive = searchParams.get('isActive');
    const emailVerified = searchParams.get('emailVerified');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query conditions
    let conditions = [eq(users.role, 'customer')]; // Only get customers

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        ) as any
      );
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive === 'true'));
    }

    if (emailVerified !== null && emailVerified !== undefined) {
      conditions.push(eq(users.emailVerified, emailVerified === 'true'));
    }

    if (startDate) {
      conditions.push(gte(users.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(users.createdAt, new Date(endDate)));
    }

    // Build sort
    const sortColumn = users[sortBy as keyof typeof users] || users.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Query customers
    const customersList = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn as any))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...conditions));

    return NextResponse.json({
      customers: customersList,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
