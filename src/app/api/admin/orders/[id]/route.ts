import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, orderItems, orderStatusHistory, users, addresses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET single order with full details
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
              },
            },
            variant: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: (history, { desc }) => [desc(history.createdAt)],
          with: {
            createdBy: {
              columns: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        shipments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch addresses separately
    let shippingAddress = null;
    let billingAddress = null;

    if (order.shippingAddressId) {
      shippingAddress = await db.query.addresses.findFirst({
        where: eq(addresses.id, order.shippingAddressId),
      });
    }

    if (order.billingAddressId) {
      billingAddress = await db.query.addresses.findFirst({
        where: eq(addresses.id, order.billingAddressId),
      });
    }

    return NextResponse.json({
      order: {
        ...order,
        shippingAddress,
        billingAddress,
      },
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });

// PATCH (update) order
export const PATCH = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params;
    const body = await req.json();

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

    // Prepare update data
    const updateData: any = {};

    // Only include fields that are provided
    if (body.status !== undefined) updateData.status = body.status;
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
    if (body.shippingMethod !== undefined) updateData.shippingMethod = body.shippingMethod;
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
    if (body.customerNotes !== undefined) updateData.customerNotes = body.customerNotes;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update order
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder,
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
