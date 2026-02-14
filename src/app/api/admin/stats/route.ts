import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { orders, products, users } from '@/db/schema';
import { sql, gte, eq, and, lt, desc, asc } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    console.log('📊 Stats API called by user:', context.userId, 'role:', context.role);

    // Get date ranges for calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Calculate revenue for current month
    const currentMonthRevenue = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfMonth),
          eq(orders.paymentStatus, 'paid')
        )
      );

    // Calculate revenue for last month (for comparison)
    const lastMonthRevenue = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfLastMonth),
          lt(orders.createdAt, startOfMonth),
          eq(orders.paymentStatus, 'paid')
        )
      );

    // Calculate revenue change percentage
    const currentRevenue = Number(currentMonthRevenue[0]?.total || 0);
    const lastRevenue = Number(lastMonthRevenue[0]?.total || 0);
    const revenueChange = lastRevenue > 0
      ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
      : 0;

    // Get total orders count for current month
    const currentMonthOrders = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(gte(orders.createdAt, startOfMonth));

    // Get total orders count for last month
    const lastMonthOrders = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfLastMonth),
          lt(orders.createdAt, startOfMonth)
        )
      );

    // Calculate orders change percentage
    const currentOrdersCount = Number(currentMonthOrders[0]?.count || 0);
    const lastOrdersCount = Number(lastMonthOrders[0]?.count || 0);
    const ordersChange = lastOrdersCount > 0
      ? ((currentOrdersCount - lastOrdersCount) / lastOrdersCount) * 100
      : 0;

    // Get total products count
    const totalProducts = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(eq(products.isActive, true));

    // Get low stock products (stock <= lowStockThreshold)
    const lowStockProducts = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          eq(products.trackInventory, true),
          sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
        )
      );

    // Get total customers count
    const totalCustomers = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.role, 'customer'));

    // Get new customers this month
    const newCustomers = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(
        and(
          eq(users.role, 'customer'),
          gte(users.createdAt, startOfMonth)
        )
      );

    // Get recent orders (last 5) using db.select() instead of db.query
    const recentOrdersRaw = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        email: orders.email,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // Format recent orders for response
    const formattedRecentOrders = recentOrdersRaw.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.userFirstName && order.userLastName
        ? `${order.userFirstName} ${order.userLastName}`.trim()
        : 'Guest',
      email: order.email,
      total: parseFloat(order.total),
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
    }));

    // Get low stock products for dashboard alerts (limit to 5) using db.select()
    const lowStockProductsList = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        stockQuantity: products.stockQuantity,
        lowStockThreshold: products.lowStockThreshold,
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          eq(products.trackInventory, true),
          sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
        )
      )
      .orderBy(asc(products.stockQuantity))
      .limit(5);

    const responseData = {
      stats: {
        revenue: {
          total: currentRevenue,
          change: Math.round(revenueChange * 10) / 10, // Round to 1 decimal
        },
        orders: {
          total: currentOrdersCount,
          change: Math.round(ordersChange * 10) / 10,
        },
        products: {
          total: Number(totalProducts[0]?.count || 0),
          lowStock: Number(lowStockProducts[0]?.count || 0),
        },
        customers: {
          total: Number(totalCustomers[0]?.count || 0),
          new: Number(newCustomers[0]?.count || 0),
        },
      },
      recentOrders: formattedRecentOrders,
      lowStockProducts: lowStockProductsList,
    };

    console.log('✅ Stats API response:', JSON.stringify(responseData, null, 2));

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', message: error.message },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
