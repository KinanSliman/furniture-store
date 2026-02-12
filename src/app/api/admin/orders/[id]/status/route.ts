import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, orderStatusHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

export const POST = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    // Add to status history
    await db.insert(orderStatusHistory).values({
      orderId: id,
      status: body.status,
      note: body.note || null,
      createdBy: body.createdBy || null,
    });

    return NextResponse.json({
      message: 'Order status updated successfully',
      order: updatedOrder,
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}, 'admin');
