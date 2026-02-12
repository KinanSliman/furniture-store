import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { productReviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET - Get single review
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    const review = await db.query.productReviews.findFirst({
      where: eq(productReviews.id, id),
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
        order: {
          columns: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ review });

  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}, 'admin');

// PATCH - Update review (approve/reject, etc.)
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if review exists
    const existingReview = await db.query.productReviews.findFirst({
      where: eq(productReviews.id, id),
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.isApproved !== undefined) updateData.isApproved = body.isApproved;
    if (body.helpfulCount !== undefined) updateData.helpfulCount = body.helpfulCount;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update review
    const [updatedReview] = await db
      .update(productReviews)
      .set(updateData)
      .where(eq(productReviews.id, id))
      .returning();

    return NextResponse.json({
      message: 'Review updated successfully',
      review: updatedReview,
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}, 'admin');

// DELETE - Delete review
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    // Check if review exists
    const existingReview = await db.query.productReviews.findFirst({
      where: eq(productReviews.id, id),
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Delete review
    await db.delete(productReviews).where(eq(productReviews.id, id));

    return NextResponse.json({
      message: 'Review deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}, 'admin');
