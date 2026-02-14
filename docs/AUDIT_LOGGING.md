# Audit Logging Documentation

## Overview

The audit logging system tracks all administrative actions for security, compliance, and debugging purposes. Every significant action (create, update, delete, login, etc.) is automatically logged with full context.

---

## Why Audit Logging?

✅ **Security**: Track unauthorized access and suspicious activity
✅ **Compliance**: Meet regulatory requirements (GDPR, SOC 2, HIPAA, etc.)
✅ **Debugging**: Understand what happened and when
✅ **Accountability**: Know who made what changes
✅ **Forensics**: Investigate security incidents

---

## What Gets Logged?

### Automatically Logged:
- ✅ **Login attempts** (successful and failed)
- ✅ **Logout events**
- ✅ **Product updates** (with before/after changes)
- ✅ **Product deletions**
- ✅ **Order modifications**
- ✅ **Customer data changes**
- ✅ **Settings updates**
- ✅ **User permission changes**

### Logged Information:
- **Who**: User ID and email
- **What**: Action performed (create, update, delete, etc.)
- **Where**: Resource affected (product, order, user, etc.)
- **When**: Timestamp (UTC)
- **How**: HTTP method and endpoint
- **From Where**: IP address and user agent
- **Changes**: Before/after values for updates
- **Status**: Success, failure, or error
- **Error Details**: Error message if failed

---

## Database Schema

```sql
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  action          VARCHAR(100),      -- create, update, delete, login, etc.
  resource        VARCHAR(100),      -- product, order, user, etc.
  resource_id     VARCHAR(255),      -- ID of affected resource
  method          VARCHAR(10),       -- GET, POST, PUT, PATCH, DELETE
  endpoint        VARCHAR(500),      -- API endpoint called
  ip_address      VARCHAR(45),       -- IPv4 or IPv6
  user_agent      TEXT,              -- Browser/client info
  changes         JSONB,             -- Before/after values
  metadata        JSONB,             -- Additional context
  status          VARCHAR(20),       -- success, failure, error
  error_message   TEXT,              -- Error details if failed
  created_at      TIMESTAMP
);

-- Indexes for fast querying
CREATE INDEX ON audit_logs (user_id);
CREATE INDEX ON audit_logs (action);
CREATE INDEX ON audit_logs (resource);
CREATE INDEX ON audit_logs (created_at);
CREATE INDEX ON audit_logs (status);
```

---

## Usage

### 1. Automatic Logging (Login/Logout)

Login and logout are automatically logged:

```typescript
// Login success - automatically logged
await logLogin(req, user.id, user.email);

// Login failure - automatically logged
await logFailedLogin(req, email, 'Invalid password');

// Logout - automatically logged
await logLogout(req, userId);
```

### 2. Manual Logging (CRUD Operations)

For product/order/customer changes, use `auditLog()`:

```typescript
import { auditLog, trackChanges } from '@/lib/audit-log';

export const PATCH = withAuth(async (req, context) => {
  const product = await updateProduct(...);

  // Log the update
  await auditLog(req, {
    userId: context.userId,
    action: 'update',
    resource: 'product',
    resourceId: product.id,
    changes: trackChanges(oldProduct, newProduct),
    status: 'success',
  });
}, 'admin');
```

### 3. Track Changes

Automatically detect what changed:

```typescript
import { trackChanges } from '@/lib/audit-log';

const oldData = { name: 'Old Product', price: 10.00, sku: 'OLD123' };
const newData = { name: 'New Product', price: 12.99, sku: 'OLD123' };

const changes = trackChanges(oldData, newData);
// Returns:
// {
//   name: { old: 'Old Product', new: 'New Product' },
//   price: { old: 10.00, new: 12.99 }
// }
// Note: 'sku' is not included because it didn't change
```

### 4. Log Errors

Log when operations fail:

```typescript
try {
  await deleteProduct(id);
  await auditLog(req, {
    userId: context.userId,
    action: 'delete',
    resource: 'product',
    resourceId: id,
    status: 'success',
  });
} catch (error) {
  await auditLog(req, {
    userId: context.userId,
    action: 'delete',
    resource: 'product',
    resourceId: id,
    status: 'error',
    errorMessage: error.message,
  });
  throw error;
}
```

---

## Querying Audit Logs

### API Endpoint

`GET /api/admin/audit-logs`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `userId` - Filter by user ID
- `action` - Filter by action (create, update, delete, login, etc.)
- `resource` - Filter by resource (product, order, user, etc.)
- `status` - Filter by status (success, failure, error)
- `search` - Search in endpoint, resource ID, or metadata
- `startDate` - Filter from date (ISO string)
- `endDate` - Filter to date (ISO string)

**Example Requests:**

```bash
# Get all audit logs (paginated)
GET /api/admin/audit-logs?page=1&limit=50

# Get logs for specific user
GET /api/admin/audit-logs?userId=abc-123

# Get all failed login attempts
GET /api/admin/audit-logs?action=login&status=failure

# Get product updates in last 7 days
GET /api/admin/audit-logs?resource=product&action=update&startDate=2026-02-07

# Search for specific resource
GET /api/admin/audit-logs?search=PROD-12345
```

**Response:**

```json
{
  "logs": [
    {
      "id": "log-123",
      "userId": "user-456",
      "user": {
        "email": "admin@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "admin"
      },
      "action": "update",
      "resource": "product",
      "resourceId": "prod-789",
      "method": "PATCH",
      "endpoint": "/api/admin/products/prod-789",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "changes": {
        "price": { "old": "10.00", "new": "12.99" },
        "name": { "old": "Old Name", "new": "New Name" }
      },
      "metadata": {
        "productName": "New Name",
        "sku": "PROD-123"
      },
      "status": "success",
      "errorMessage": null,
      "createdAt": "2026-02-14T12:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

## Action Types

| Action | Description | Example |
|--------|-------------|---------|
| `create` | New resource created | Product added |
| `update` | Resource modified | Product price changed |
| `delete` | Resource deleted | Product removed |
| `login` | User logged in | Admin login |
| `logout` | User logged out | Admin logout |
| `view` | Resource viewed | Order details accessed |
| `export` | Data exported | Products exported to CSV |
| `import` | Data imported | Products imported from CSV |
| `approve` | Resource approved | Review approved |
| `reject` | Resource rejected | Review rejected |
| `restore` | Resource restored | Deleted product restored |
| `archive` | Resource archived | Order archived |

---

## Resource Types

| Resource | Description |
|----------|-------------|
| `product` | Product catalog |
| `order` | Customer orders |
| `user` | Admin users |
| `customer` | Customers |
| `category` | Product categories |
| `discount` | Discount codes |
| `review` | Product reviews |
| `shipment` | Shipments |
| `inventory` | Inventory changes |
| `setting` | System settings |
| `variant` | Product variants |
| `image` | Product images |
| `auth` | Authentication |

---

## Compliance & Retention

### GDPR Compliance

Audit logs contain personal data and must be handled properly:

1. **Purpose Limitation**: Only collect necessary audit data
2. **Access Control**: Limit who can view audit logs
3. **Retention Policy**: Delete logs after retention period
4. **User Rights**: Allow users to request their audit history

### Retention Policy

Default: **90 days** (configurable)

**Cleanup old logs:**

```typescript
import { cleanupOldAuditLogs } from '@/lib/audit-log';

// Delete logs older than 90 days
const deletedCount = await cleanupOldAuditLogs(90);
console.log(`Deleted ${deletedCount} old audit logs`);
```

**Automated cleanup (cron job):**

```typescript
// api/cron/cleanup-audit-logs/route.ts
export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const cronSecret = req.headers.get('authorization');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await cleanupOldAuditLogs(90);

  return NextResponse.json({
    success: true,
    deletedCount: deleted,
  });
}
```

Configure Vercel cron job in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-audit-logs",
    "schedule": "0 0 * * *"
  }]
}
```

---

## Security Best Practices

### 1. Protect Audit Logs

- ✅ Only admins can view logs
- ✅ Logs are immutable (no updates/deletes by users)
- ✅ Separate database or table for logs
- ✅ Regular backups

### 2. Sensitive Data

**DO NOT log:**
- ❌ Passwords (even hashed)
- ❌ Credit card numbers
- ❌ Social security numbers
- ❌ API keys or tokens
- ❌ Other PII unless necessary

**DO log:**
- ✅ User actions
- ✅ Resource changes
- ✅ Access patterns
- ✅ Non-sensitive metadata

### 3. Monitor for Suspicious Activity

Set up alerts for:
- Multiple failed login attempts
- Bulk deletions
- Access from unusual locations
- Changes outside business hours
- Privilege escalation attempts

---

## Monitoring & Analytics

### Common Queries

**1. Failed login attempts (security monitoring):**

```sql
SELECT user_agent, ip_address, COUNT(*) as attempts
FROM audit_logs
WHERE action = 'login' AND status = 'failure'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_agent, ip_address
ORDER BY attempts DESC;
```

**2. Most active admins:**

```sql
SELECT users.email, COUNT(*) as actions
FROM audit_logs
JOIN users ON audit_logs.user_id = users.id
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY users.email
ORDER BY actions DESC
LIMIT 10;
```

**3. Recent product changes:**

```sql
SELECT *
FROM audit_logs
WHERE resource = 'product'
AND action IN ('create', 'update', 'delete')
ORDER BY created_at DESC
LIMIT 50;
```

**4. Failed operations:**

```sql
SELECT action, resource, error_message, COUNT(*) as count
FROM audit_logs
WHERE status = 'error'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY action, resource, error_message
ORDER BY count DESC;
```

---

## Example Audit Log Entries

### 1. Successful Login

```json
{
  "userId": "user-123",
  "action": "login",
  "resource": "auth",
  "method": "POST",
  "endpoint": "/api/admin/auth/login",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "metadata": { "email": "admin@example.com" },
  "status": "success",
  "createdAt": "2026-02-14T10:30:00Z"
}
```

### 2. Failed Login

```json
{
  "userId": null,
  "action": "login",
  "resource": "auth",
  "method": "POST",
  "endpoint": "/api/admin/auth/login",
  "ipAddress": "203.0.113.45",
  "userAgent": "curl/7.68.0",
  "metadata": { "email": "hacker@example.com", "reason": "Invalid password" },
  "status": "failure",
  "errorMessage": "Invalid password",
  "createdAt": "2026-02-14T10:35:00Z"
}
```

### 3. Product Update

```json
{
  "userId": "user-123",
  "action": "update",
  "resource": "product",
  "resourceId": "prod-456",
  "method": "PATCH",
  "endpoint": "/api/admin/products/prod-456",
  "ipAddress": "192.168.1.100",
  "changes": {
    "price": { "old": "29.99", "new": "34.99" },
    "stockQuantity": { "old": 100, "new": 95 }
  },
  "metadata": {
    "productName": "Premium Widget",
    "sku": "WID-001"
  },
  "status": "success",
  "createdAt": "2026-02-14T11:00:00Z"
}
```

### 4. Product Deletion

```json
{
  "userId": "user-123",
  "action": "delete",
  "resource": "product",
  "resourceId": "prod-789",
  "method": "DELETE",
  "endpoint": "/api/admin/products/prod-789",
  "ipAddress": "192.168.1.100",
  "metadata": {
    "productName": "Discontinued Product",
    "sku": "OLD-001"
  },
  "status": "success",
  "createdAt": "2026-02-14T12:00:00Z"
}
```

---

## Troubleshooting

### Issue: Audit logs not being created

**Solution:**
1. Check database migration ran successfully
2. Verify `auditLogs` table exists
3. Check database permissions
4. Review application logs for errors

### Issue: Too many audit logs (performance)

**Solution:**
1. Reduce retention period
2. Archive old logs to separate table
3. Add database partitioning by date
4. Use read replicas for queries

### Issue: Missing user information

**Solution:**
- Ensure `userId` is passed to `auditLog()`
- Check that user is authenticated
- Verify user still exists (not deleted)

---

## Best Practices

1. ✅ **Log all state changes** (create, update, delete)
2. ✅ **Include context** (who, what, when, where, why)
3. ✅ **Track failures** too (not just successes)
4. ✅ **Regular cleanup** (don't let logs grow forever)
5. ✅ **Monitor suspicious patterns** (failed logins, bulk deletes)
6. ✅ **Backup audit logs** separately from main database
7. ✅ **Protect access** (admin-only viewing)
8. ✅ **Document retention policy** (legal/compliance)

---

**Last Updated:** 2026-02-14
