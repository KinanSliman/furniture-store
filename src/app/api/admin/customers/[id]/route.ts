import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET single customer with order history
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    // Get customer
    const customer = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer || customer.role !== 'customer') {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get customer's orders
    const customerOrders = await db.query.orders.findMany({
      where: eq(orders.userId, id),
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: {
        items: true,
      },
    });

    return NextResponse.json({
      customer,
      orders: customerOrders,
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}, 'admin');

// PATCH (update) customer
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if customer exists
    const existingCustomer = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingCustomer || existingCustomer.role !== 'customer') {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.emailVerified !== undefined) updateData.emailVerified = body.emailVerified;

    updateData.updatedAt = new Date();

    // Update customer
    const [updatedCustomer] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
      });

    return NextResponse.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer,
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}, 'admin');
