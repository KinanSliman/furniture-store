import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, shipments, orderStatusHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// POST - Create shipment and fulfill order
export const POST = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params;
    const body = await req.json();

    // Validate required fields
    if (!body.carrier) {
      return NextResponse.json(
        { error: 'Carrier is required' },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create shipment
    const [newShipment] = await db.insert(shipments).values({
      orderId: id,
      carrier: body.carrier,
      trackingNumber: body.trackingNumber || null,
      trackingUrl: body.trackingUrl || null,
      shippedAt: body.shippedAt ? new Date(body.shippedAt) : new Date(),
      estimatedDeliveryAt: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
      notes: body.notes || null,
    }).returning();

    // Update order status to 'shipped' if it's not already
    if (order.status !== 'shipped' && order.status !== 'delivered') {
      await db.update(orders)
        .set({
          status: 'shipped',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id));

      // Add status history
      await db.insert(orderStatusHistory).values({
        orderId: id,
        status: 'shipped',
        note: body.notes || 'Order fulfilled and shipped',
      });
    }

    return NextResponse.json({
      message: 'Order fulfilled successfully',
      shipment: newShipment,
    }, { status: 201 });

  } catch (error) {
    console.error('Error fulfilling order:', error);
    return NextResponse.json(
      { error: 'Failed to fulfill order' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
