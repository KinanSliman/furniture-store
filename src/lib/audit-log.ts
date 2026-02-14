import { NextRequest } from 'next/server';
import { db } from '@/db/db';
import { auditLogs } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Audit Log Utility
 *
 * Track all admin actions for security, compliance, and debugging.
 */

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'view'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'restore'
  | 'archive';

export type AuditResource =
  | 'product'
  | 'order'
  | 'user'
  | 'customer'
  | 'category'
  | 'discount'
  | 'review'
  | 'shipment'
  | 'inventory'
  | 'setting'
  | 'variant'
  | 'image'
  | 'auth';

export type AuditStatus = 'success' | 'failure' | 'error';

export interface AuditLogData {
  userId?: string | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | null;
  method?: string;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  status: AuditStatus;
  errorMessage?: string;
}

/**
 * Get client IP address from request
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const vercelIp = req.headers.get('x-vercel-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (vercelIp) {
    return vercelIp;
  }

  return 'unknown';
}

/**
 * Create an audit log entry
 *
 * @example
 * ```typescript
 * await createAuditLog({
 *   userId: context.userId,
 *   action: 'update',
 *   resource: 'product',
 *   resourceId: productId,
 *   method: 'PATCH',
 *   endpoint: '/api/admin/products/123',
 *   changes: { price: { old: 10.00, new: 12.99 } },
 *   status: 'success',
 * });
 * ```
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: data.userId || null,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || null,
      method: data.method || null,
      endpoint: data.endpoint || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      changes: data.changes || null,
      metadata: data.metadata || null,
      status: data.status,
      errorMessage: data.errorMessage || null,
    });
  } catch (error) {
    // Don't throw errors from audit logging to avoid breaking main flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Create audit log from Next.js request
 *
 * Automatically extracts IP, user agent, method, and endpoint from request
 *
 * @example
 * ```typescript
 * await auditLog(req, {
 *   userId: context.userId,
 *   action: 'create',
 *   resource: 'product',
 *   resourceId: newProduct.id,
 *   status: 'success',
 * });
 * ```
 */
export async function auditLog(
  req: NextRequest,
  data: Omit<AuditLogData, 'ipAddress' | 'userAgent' | 'method' | 'endpoint'>
): Promise<void> {
  await createAuditLog({
    ...data,
    method: req.method,
    endpoint: req.nextUrl.pathname,
    ipAddress: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined,
  });
}

/**
 * Track changes between old and new values
 *
 * @example
 * ```typescript
 * const changes = trackChanges(
 *   { name: 'Old Product', price: 10.00 },
 *   { name: 'New Product', price: 12.99 }
 * );
 * // Returns: { name: { old: 'Old Product', new: 'New Product' }, price: { old: 10.00, new: 12.99 } }
 * ```
 */
export function trackChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};

  // Track all fields in new data
  Object.keys(newData).forEach((key) => {
    // Skip these fields from change tracking
    if (['updatedAt', 'createdAt', 'id'].includes(key)) {
      return;
    }

    // Only track if value actually changed
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  });

  return changes;
}

/**
 * Audit middleware wrapper for admin actions
 *
 * Automatically logs the action and handles errors
 *
 * @example
 * ```typescript
 * export const PATCH = withAuth(async (req, context) => {
 *   return withAudit(req, context, 'update', 'product', async () => {
 *     const product = await updateProduct(...);
 *     return { product, resourceId: product.id };
 *   });
 * }, 'admin');
 * ```
 */
export async function withAudit<T>(
  req: NextRequest,
  context: { userId: string; role: string },
  action: AuditAction,
  resource: AuditResource,
  handler: () => Promise<{ data?: T; resourceId?: string; changes?: Record<string, any> }>
): Promise<T | undefined> {
  try {
    const result = await handler();

    // Log successful action
    await auditLog(req, {
      userId: context.userId,
      action,
      resource,
      resourceId: result.resourceId,
      changes: result.changes,
      status: 'success',
    });

    return result.data;
  } catch (error: any) {
    // Log failed action
    await auditLog(req, {
      userId: context.userId,
      action,
      resource,
      status: 'error',
      errorMessage: error.message || 'Unknown error',
    });

    // Re-throw error to maintain normal error handling
    throw error;
  }
}

/**
 * Log successful login
 */
export async function logLogin(
  req: NextRequest,
  userId: string,
  email: string
): Promise<void> {
  await auditLog(req, {
    userId,
    action: 'login',
    resource: 'auth',
    metadata: { email },
    status: 'success',
  });
}

/**
 * Log failed login attempt
 */
export async function logFailedLogin(
  req: NextRequest,
  email: string,
  reason: string
): Promise<void> {
  await createAuditLog({
    userId: null,
    action: 'login',
    resource: 'auth',
    method: req.method,
    endpoint: req.nextUrl.pathname,
    ipAddress: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined,
    metadata: { email, reason },
    status: 'failure',
    errorMessage: reason,
  });
}

/**
 * Log logout
 */
export async function logLogout(
  req: NextRequest,
  userId: string
): Promise<void> {
  await auditLog(req, {
    userId,
    action: 'logout',
    resource: 'auth',
    status: 'success',
  });
}

/**
 * Clean up old audit logs (older than retention period)
 *
 * Should be run periodically via cron job
 *
 * @param retentionDays Number of days to keep logs (default: 90)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    const result = await db
      .delete(auditLogs)
      .where(sql`created_at < ${cutoffDate}`)
      .returning({ id: auditLogs.id });

    return result.length;
  } catch (error) {
    console.error('Failed to cleanup old audit logs:', error);
    return 0;
  }
}
