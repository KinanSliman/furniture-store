import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { categories } from '@/db/schema';
import { eq, like, or, desc, asc, sql, and, isNull } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';
import { generateSlug } from '@/lib/utils';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const parentId = searchParams.get('parentId');
    const sortBy = searchParams.get('sortBy') || 'displayOrder';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query conditions
    let conditions = [];

    if (search) {
      conditions.push(
        or(
          like(categories.name, `%${search}%`),
          like(categories.slug, `%${search}%`)
        )
      );
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(categories.isActive, isActive === 'true'));
    }

    // Filter by parent - if 'root', show only top-level categories
    if (parentId === 'root') {
      conditions.push(isNull(categories.parentId));
    } else if (parentId) {
      conditions.push(eq(categories.parentId, parentId));
    }

    // Build sort
    const sortColumn = categories[sortBy as keyof typeof categories] || categories.displayOrder;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Query categories
    const categoriesList = await db.query.categories.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: orderFn(sortColumn),
      limit,
      offset,
      with: {
        parent: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          columns: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    });

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      categories: categoriesList,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}, 'admin');

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug = body.slug || generateSlug(body.name);

    // Check if slug already exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 }
      );
    }

    // Create category
    const [newCategory] = await db.insert(categories).values({
      name: body.name,
      slug,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      parentId: body.parentId || null,
      displayOrder: body.displayOrder || 0,
      isActive: body.isActive ?? true,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
    }).returning();

    return NextResponse.json(
      {
        message: 'Category created successfully',
        category: newCategory,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}, 'admin');
