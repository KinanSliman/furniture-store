import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders } from '@/db/schema';
import { sql, gte, lte, eq, and } from 'drizzle-orm';
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
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Get daily revenue data
    const revenueData = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.paymentStatus, 'paid')
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    // Fill in missing dates with zero values
    const allDates: Array<{ date: string; revenue: number; orderCount: number }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = revenueData.find(d => d.date === dateStr);

      allDates.push({
        date: dateStr,
        revenue: existingData ? Number(existingData.revenue) : 0,
        orderCount: existingData ? Number(existingData.orderCount) : 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate totals and averages
    const totalRevenue = allDates.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = allDates.reduce((sum, day) => sum + day.orderCount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageDailyRevenue = allDates.length > 0 ? totalRevenue / allDates.length : 0;

    return NextResponse.json({
      data: allDates,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        averageDailyRevenue,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
