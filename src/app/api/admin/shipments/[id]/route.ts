import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { shipments, orders, orderStatusHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET - Get single shipment
export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params;

    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
    });

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ shipment });

  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });

// PATCH - Update shipment
export const PATCH = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params;
    const body = await req.json();

    // Check if shipment exists
    const existingShipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
    });

    if (!existingShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.carrier !== undefined) updateData.carrier = body.carrier;
    if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber || null;
    if (body.trackingUrl !== undefined) updateData.trackingUrl = body.trackingUrl || null;
    if (body.shippedAt !== undefined) updateData.shippedAt = body.shippedAt ? new Date(body.shippedAt) : null;
    if (body.estimatedDelivery !== undefined) updateData.estimatedDeliveryAt = body.estimatedDelivery ? new Date(body.estimatedDelivery) : null;
    if (body.deliveredAt !== undefined) {
      updateData.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : null;

      // If marking as delivered, update order status
      if (body.deliveredAt) {
        await db.update(orders)
          .set({
            status: 'delivered',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, existingShipment.orderId));

        // Add status history
        await db.insert(orderStatusHistory).values({
          orderId: existingShipment.orderId,
          status: 'delivered',
          note: body.notes || 'Order delivered',
        });
      }
    }
    if (body.notes !== undefined) updateData.notes = body.notes || null;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update shipment
    const [updatedShipment] = await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id))
      .returning();

    return NextResponse.json({
      message: 'Shipment updated successfully',
      shipment: updatedShipment,
    });

  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });

// DELETE - Delete shipment
export const DELETE = withAuth(async (req: NextRequest, context) => {
  try {
    const { id } = await context.params;

    // Check if shipment exists
    const existingShipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, id),
    });

    if (!existingShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Delete shipment
    await db.delete(shipments).where(eq(shipments.id, id));

    // Update order status back to processing
    await db.update(orders)
      .set({
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existingShipment.orderId));

    return NextResponse.json({
      message: 'Shipment deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting shipment:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipment' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
