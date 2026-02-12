import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { productVariants, products } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET - List all variants for a product
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    // Check if product exists
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get all variants for this product
    const variants = await db.query.productVariants.findMany({
      where: eq(productVariants.productId, id),
      orderBy: [asc(productVariants.displayOrder), asc(productVariants.name)],
    });

    return NextResponse.json({ variants });

  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}, 'admin');

// POST - Create new variant for a product
export const POST = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if product exists
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name || !body.attributes) {
      return NextResponse.json(
        { error: 'Name and attributes are required' },
        { status: 400 }
      );
    }

    // Check if SKU is unique (if provided)
    if (body.sku) {
      const skuExists = await db.query.productVariants.findFirst({
        where: eq(productVariants.sku, body.sku),
      });

      if (skuExists) {
        return NextResponse.json(
          { error: 'A variant with this SKU already exists' },
          { status: 409 }
        );
      }
    }

    // Create variant
    const [newVariant] = await db.insert(productVariants).values({
      productId: id,
      name: body.name,
      sku: body.sku || null,
      price: body.price ? body.price.toString() : null,
      compareAtPrice: body.compareAtPrice ? body.compareAtPrice.toString() : null,
      costPrice: body.costPrice ? body.costPrice.toString() : null,
      stockQuantity: body.stockQuantity ?? 0,
      imageUrl: body.imageUrl || null,
      attributes: body.attributes, // { "size": "L", "color": "Red" }
      isActive: body.isActive ?? true,
      displayOrder: body.displayOrder ?? 0,
    }).returning();

    return NextResponse.json({
      message: 'Variant created successfully',
      variant: newVariant,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      { error: 'Failed to create variant' },
      { status: 500 }
    );
  }
}, 'admin');
