import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products, productImages, productCategories } from '@/db/schema';
import { eq, like, or, desc, asc, sql, and } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';
import { generateSlug } from '@/lib/utils';

export const GET = withAuth(async (req: NextRequest, context) => {
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

    // Build where condition for db.select (different from db.query)
    let selectConditions = [];

    if (search) {
      selectConditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`)
        )
      );
    }

    if (isActive !== null && isActive !== undefined) {
      selectConditions.push(eq(products.isActive, isActive === 'true'));
    }

    // Build where function for db.query
    let whereCondition;
    if (search && isActive !== null && isActive !== undefined) {
      whereCondition = (products: any, { and, or, eq, like }: any) => and(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`)
        ),
        eq(products.isActive, isActive === 'true')
      );
    } else if (search) {
      whereCondition = (products: any, { or, like }: any) => or(
        like(products.name, `%${search}%`),
        like(products.sku, `%${search}%`)
      );
    } else if (isActive !== null && isActive !== undefined) {
      whereCondition = (products: any, { eq }: any) => eq(products.isActive, isActive === 'true');
    }

    // Build orderBy function
    const orderByFn = sortOrder === 'asc'
      ? (products: any, { asc }: any) => [asc(products[sortBy] || products.createdAt)]
      : (products: any, { desc }: any) => [desc(products[sortBy] || products.createdAt)];

    // Query products
    const productsList = await db.query.products.findMany({
      where: whereCondition,
      orderBy: orderByFn,
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

    // Get total count using db.select syntax
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(selectConditions.length > 0 ? and(...selectConditions) : undefined);

    return NextResponse.json({
      products: productsList,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0]?.count || 0),
        totalPages: Math.ceil(Number(totalCount[0]?.count || 0) / limit),
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

export const POST = withAuth(async (req: NextRequest, context) => {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug = body.slug || generateSlug(body.name);

    // Check if slug already exists
    const existingProduct = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.slug, slug),
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 409 }
      );
    }

    // Create product
    const [newProduct] = await db.insert(products).values({
      name: body.name,
      slug,
      description: body.description || null,
      shortDescription: body.shortDescription || null,
      price: body.price.toString(),
      compareAtPrice: body.compareAtPrice ? body.compareAtPrice.toString() : null,
      costPrice: body.costPrice ? body.costPrice.toString() : null,
      sku: body.sku || null,
      barcode: body.barcode || null,
      trackInventory: body.trackInventory ?? true,
      stockQuantity: body.stockQuantity || 0,
      lowStockThreshold: body.lowStockThreshold || 5,
      weight: body.weight ? body.weight.toString() : null,
      weightUnit: body.weightUnit || 'kg',
      length: body.length ? body.length.toString() : null,
      width: body.width ? body.width.toString() : null,
      height: body.height ? body.height.toString() : null,
      dimensionUnit: body.dimensionUnit || 'cm',
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      attributes: body.attributes || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      metaKeywords: body.metaKeywords || null,
    }).returning();

    // Add images if provided
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      await db.insert(productImages).values(
        body.images.map((img: any, index: number) => ({
          productId: newProduct.id,
          url: img.url,
          publicId: img.publicId || null,
          altText: img.altText || body.name,
          displayOrder: img.displayOrder ?? index,
          isPrimary: img.isPrimary ?? (index === 0),
        }))
      );
    }

    // Add categories if provided
    if (body.categoryIds && Array.isArray(body.categoryIds) && body.categoryIds.length > 0) {
      await db.insert(productCategories).values(
        body.categoryIds.map((categoryId: string) => ({
          productId: newProduct.id,
          categoryId,
        }))
      );
    }

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: newProduct,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating product:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to create product', message: error.message },
      { status: 500 }
    );
  }
}, 'admin');
