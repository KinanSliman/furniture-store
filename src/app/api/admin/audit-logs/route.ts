import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { auditLogs } from '@/db/schema';
import { desc, eq, like, and, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

/**
 * GET /api/admin/audit-logs
 *
 * Retrieve audit logs with filtering and pagination
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 * - userId: Filter by user ID
 * - action: Filter by action (create, update, delete, login, etc.)
 * - resource: Filter by resource type (product, order, etc.)
 * - status: Filter by status (success, failure, error)
 * - search: Search in endpoint, resource_id, or metadata
 * - startDate: Filter from date (ISO string)
 * - endDate: Filter to date (ISO string)
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (resource) {
      conditions.push(eq(auditLogs.resource, resource));
    }

    if (status) {
      conditions.push(eq(auditLogs.status, status));
    }

    if (search) {
      conditions.push(
        sql`(
          ${auditLogs.endpoint} LIKE ${`%${search}%`} OR
          ${auditLogs.resourceId} LIKE ${`%${search}%`} OR
          ${auditLogs.metadata}::text LIKE ${`%${search}%`}
        )`
      );
    }

    if (startDate) {
      conditions.push(sql`${auditLogs.createdAt} >= ${new Date(startDate)}`);
    }

    if (endDate) {
      conditions.push(sql`${auditLogs.createdAt} <= ${new Date(endDate)}`);
    }

    // Query audit logs with user information
    const logs = await db.query.auditLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(auditLogs.createdAt),
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(totalResult[0]?.count || 0);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}, 'admin'); // Only admins can view audit logs
