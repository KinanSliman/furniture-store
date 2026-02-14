import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { discountCodes } from '@/db/schema';
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
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query conditions
    let conditions = [];

    if (search) {
      conditions.push(like(discountCodes.code, `%${search}%`));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(discountCodes.isActive, isActive === 'true'));
    }

    if (type) {
      conditions.push(eq(discountCodes.type, type as any));
    }

    // Build sort
    const sortColumn = discountCodes[sortBy as keyof typeof discountCodes] || discountCodes.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Query discounts
    const discountsList = await db.query.discountCodes.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: orderFn(sortColumn),
      limit,
      offset,
    });

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(discountCodes)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      discounts: discountsList,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.code || !body.type || !body.value) {
      return NextResponse.json(
        { error: 'Code, type, and value are required' },
        { status: 400 }
      );
    }

    // Normalize code to uppercase
    const code = body.code.toUpperCase().trim();

    // Check if code already exists
    const existingCode = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.code, code),
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'A discount code with this code already exists' },
        { status: 409 }
      );
    }

    // Create discount
    const [newDiscount] = await db.insert(discountCodes).values({
      code,
      type: body.type,
      value: body.value.toString(),
      minPurchase: body.minPurchase ? body.minPurchase.toString() : null,
      maxUses: body.maxUses || null,
      usesCount: 0,
      maxUsesPerCustomer: body.maxUsesPerCustomer || 1,
      applicableProductIds: body.applicableProductIds || null,
      applicableCategoryIds: body.applicableCategoryIds || null,
      firstTimeCustomerOnly: body.firstTimeCustomerOnly || false,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      isActive: body.isActive ?? true,
    }).returning();

    return NextResponse.json(
      {
        message: 'Discount code created successfully',
        discount: newDiscount,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
