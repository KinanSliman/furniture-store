import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { discountCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET single discount
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params;

    const discount = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, id),
    });

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ discount });

  } catch (error) {
    console.error('Error fetching discount:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });

// PATCH (update) discount
export const PATCH = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params;
    const body = await req.json();

    // Check if discount exists
    const existingDiscount = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, id),
    });

    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    // If code is being updated, check it's unique
    if (body.code && body.code !== existingDiscount.code) {
      const codeExists = await db.query.discountCodes.findFirst({
        where: eq(discountCodes.code, body.code.toUpperCase().trim()),
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'A discount code with this code already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (body.code !== undefined) updateData.code = body.code.toUpperCase().trim();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.value !== undefined) updateData.value = body.value.toString();
    if (body.minPurchase !== undefined) updateData.minPurchase = body.minPurchase ? body.minPurchase.toString() : null;
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses;
    if (body.maxUsesPerCustomer !== undefined) updateData.maxUsesPerCustomer = body.maxUsesPerCustomer;
    if (body.applicableProductIds !== undefined) updateData.applicableProductIds = body.applicableProductIds;
    if (body.applicableCategoryIds !== undefined) updateData.applicableCategoryIds = body.applicableCategoryIds;
    if (body.firstTimeCustomerOnly !== undefined) updateData.firstTimeCustomerOnly = body.firstTimeCustomerOnly;
    if (body.startsAt !== undefined) updateData.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    updateData.updatedAt = new Date();

    // Update discount
    const [updatedDiscount] = await db
      .update(discountCodes)
      .set(updateData)
      .where(eq(discountCodes.id, id))
      .returning();

    return NextResponse.json({
      message: 'Discount updated successfully',
      discount: updatedDiscount,
    });

  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });

// DELETE discount
export const DELETE = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params;

    // Check if discount exists
    const existingDiscount = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, id),
    });

    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    // Delete discount
    await db.delete(discountCodes).where(eq(discountCodes.id, id));

    return NextResponse.json({
      message: 'Discount deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
