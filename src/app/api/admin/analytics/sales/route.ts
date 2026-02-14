import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, orderItems, products } from '@/db/schema';
import { sql, gte, lte, eq, and, desc } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Get date range from query params or default to last 30 days
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get top selling products
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(CAST(${orderItems.total} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.paymentStatus, 'paid')
        )
      )
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(10);

    // Get order status breakdown
    const ordersByStatus = await db
      .select({
        status: orders.status,
        count: sql<number>`COUNT(*)`,
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(orders.status);

    // Get daily order count
    const dailyOrders = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        orderCount: sql<number>`COUNT(*)`,
        paidOrders: sql<number>`SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN 1 ELSE 0 END)`,
        pendingOrders: sql<number>`SUM(CASE WHEN ${orders.paymentStatus} = 'pending' THEN 1 ELSE 0 END)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    // Fill in missing dates
    const allDates: Array<{
      date: string;
      orderCount: number;
      paidOrders: number;
      pendingOrders: number;
    }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = dailyOrders.find(d => d.date === dateStr);

      allDates.push({
        date: dateStr,
        orderCount: existingData ? Number(existingData.orderCount) : 0,
        paidOrders: existingData ? Number(existingData.paidOrders) : 0,
        pendingOrders: existingData ? Number(existingData.pendingOrders) : 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        productName: p.productName,
        totalQuantity: Number(p.totalQuantity),
        totalRevenue: Number(p.totalRevenue),
        orderCount: Number(p.orderCount),
      })),
      ordersByStatus: ordersByStatus.map(o => ({
        status: o.status,
        count: Number(o.count),
        revenue: Number(o.revenue),
      })),
      dailyOrders: allDates,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales analytics' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
