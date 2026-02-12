import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { productVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET - Get single variant
export const GET = withAuth(async (req: NextRequest, { params }: { params: { variantId: string } }) => {
  try {
    const { variantId } = params;

    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
    });

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ variant });

  } catch (error) {
    console.error('Error fetching variant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variant' },
      { status: 500 }
    );
  }
}, 'admin');

// PATCH - Update variant
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { variantId: string } }) => {
  try {
    const { variantId } = params;
    const body = await req.json();

    // Check if variant exists
    const existingVariant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
    });

    if (!existingVariant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // If SKU is being updated, check it's unique
    if (body.sku && body.sku !== existingVariant.sku) {
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

    // Prepare update data
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.sku !== undefined) updateData.sku = body.sku || null;
    if (body.price !== undefined) updateData.price = body.price ? body.price.toString() : null;
    if (body.compareAtPrice !== undefined) updateData.compareAtPrice = body.compareAtPrice ? body.compareAtPrice.toString() : null;
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice ? body.costPrice.toString() : null;
    if (body.stockQuantity !== undefined) updateData.stockQuantity = body.stockQuantity;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    if (body.attributes !== undefined) updateData.attributes = body.attributes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update variant
    const [updatedVariant] = await db
      .update(productVariants)
      .set(updateData)
      .where(eq(productVariants.id, variantId))
      .returning();

    return NextResponse.json({
      message: 'Variant updated successfully',
      variant: updatedVariant,
    });

  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      { error: 'Failed to update variant' },
      { status: 500 }
    );
  }
}, 'admin');

// DELETE - Delete variant
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { variantId: string } }) => {
  try {
    const { variantId } = params;

    // Check if variant exists
    const existingVariant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
    });

    if (!existingVariant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Delete variant
    await db.delete(productVariants).where(eq(productVariants.id, variantId));

    return NextResponse.json({
      message: 'Variant deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 }
    );
  }
}, 'admin');
