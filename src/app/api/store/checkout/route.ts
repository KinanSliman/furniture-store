import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products, orders, orderItems, orderStatusHistory, addresses } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { generateOrderNumber } from '@/lib/utils';

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  address1: z.string().min(1).max(255),
  address2: z.string().max(255).optional().or(z.literal('')),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2),
  customerNotes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(itemSchema).min(1).max(50),
});

// Demo checkout — creates an order without charging a payment processor.
// `paymentStatus` is set to 'paid' so the admin orders dashboard renders
// realistic-looking data. Clearly tagged in adminNotes for transparency.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const productIds = data.items.map((i) => i.productId);
    const dbProducts = await db
      .select({
        id: products.id,
        name: products.name,
        nameEn: products.nameEn,
        price: products.price,
        sku: products.sku,
        isActive: products.isActive,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 400 });
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemsWithPricing = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (!product.isActive) {
        throw new Error(`Product is not available: ${product.name}`);
      }
      const unitPrice = parseFloat(product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        productId: product.id,
        productName: product.nameEn || product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: unitPrice.toFixed(2),
        total: lineTotal.toFixed(2),
      };
    });

    const taxRate = parseFloat(process.env.DEFAULT_TAX_RATE || '0.08');
    const tax = subtotal * taxRate;
    const shippingCost = subtotal >= 1000 ? 0 : 49;
    const total = subtotal + tax + shippingCost;

    const [shippingAddress] = await db
      .insert(addresses)
      .values({
        type: 'shipping',
        firstName: data.firstName,
        lastName: data.lastName,
        address1: data.address1,
        address2: data.address2 || null,
        city: data.city,
        state: data.state || null,
        postalCode: data.postalCode,
        country: data.country.toUpperCase(),
        phone: data.phone || null,
      })
      .returning();

    const orderNumber = generateOrderNumber();

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        email: data.email,
        status: 'processing',
        paymentStatus: 'paid',
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        discountAmount: '0.00',
        total: total.toFixed(2),
        paymentMethod: 'demo',
        shippingMethod: shippingCost === 0 ? 'free-standard' : 'standard',
        shippingAddressId: shippingAddress.id,
        billingAddressId: shippingAddress.id,
        customerNotes: data.customerNotes || null,
        adminNotes: 'Demo order — no payment was processed (portfolio demo).',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        userAgent: request.headers.get('user-agent') || null,
      })
      .returning();

    await db.insert(orderItems).values(
      itemsWithPricing.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }))
    );

    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      status: 'processing',
      note: 'Order placed (demo checkout)',
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      total: order.total,
      email: order.email,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
