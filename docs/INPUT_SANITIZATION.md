# Input Sanitization Documentation

## Overview

Input sanitization prevents injection attacks by cleaning and validating user input before processing or storing it in the database.

---

## What is Input Sanitization?

**Common Injection Attacks:**

### 1. XSS (Cross-Site Scripting)
```html
<!-- Malicious input -->
<script>alert('XSS')</script>
<img src=x onerror="alert('XSS')">

<!-- After sanitization -->
(script tags removed)
(event handlers removed)
```

### 2. SQL Injection
```sql
-- Malicious input in product name
Product'; DROP TABLE products;--

-- Detected and rejected before reaching database
```

### 3. CSV Injection (Formula Injection)
```csv
Product Name,Price
=1+1,100
@SUM(A1:A10),200
+cmd|'/c calc',300

-- Sanitized to prevent formula execution
'=1+1,100
'@SUM(A1:A10),200
'+cmd|'/c calc',300
```

---

## How It Works

### Sanitization Functions

All sanitization utilities are in `src/lib/sanitize.ts`:

```typescript
import {
  sanitizeString,
  sanitizeHTML,
  sanitizeCSVCell,
  sanitizeEmail,
  sanitizeURL,
  sanitizeInteger,
  sanitizeFloat,
  sanitizeBoolean,
  sanitizeProductData,
  validateCSVRow,
  detectSQLInjection,
  detectXSS,
} from '@/lib/sanitize';
```

---

## Sanitization Functions

### 1. String Sanitization

**Basic string cleaning:**
```typescript
const clean = sanitizeString(userInput);
// - Removes null bytes
// - Removes script tags
// - Removes iframe/object/embed tags
// - Removes event handlers (onclick, onload, etc.)
// - Removes javascript: URLs
```

**Example:**
```typescript
sanitizeString('<script>alert("XSS")</script>Product Name');
// Output: "Product Name"

sanitizeString('Name<img src=x onerror="alert(1)">');
// Output: "Name"
```

### 2. HTML Sanitization

**For rich text fields (product descriptions):**
```typescript
const cleanHTML = sanitizeHTML(userInput);
// - Allows safe tags: p, br, strong, em, u, ul, ol, li, h1-h6, a, blockquote
// - Removes dangerous tags
// - Removes event handlers
// - Removes inline scripts
```

**Example:**
```typescript
sanitizeHTML('<p>Description</p><script>alert(1)</script>');
// Output: "<p>Description</p>"

sanitizeHTML('<h2>Title</h2><iframe src="evil.com"></iframe>');
// Output: "<h2>Title</h2>"
```

### 3. CSV Cell Sanitization

**Prevents CSV formula injection:**
```typescript
const cleanCell = sanitizeCSVCell(cellValue);
// - Detects cells starting with =, +, -, @, \t, \r
// - Prepends single quote to prevent formula execution
// - Removes null bytes and control characters
```

**Example:**
```typescript
sanitizeCSVCell('=1+1');
// Output: "'=1+1" (prevents formula execution)

sanitizeCSVCell('@SUM(A1:A10)');
// Output: "'@SUM(A1:A10)"

sanitizeCSVCell('Normal Product Name');
// Output: "Normal Product Name"
```

### 4. Email Sanitization

```typescript
const cleanEmail = sanitizeEmail(email);
// - Converts to lowercase
// - Validates email format
// - Removes dangerous characters
```

**Example:**
```typescript
sanitizeEmail('User@Example.COM');
// Output: "user@example.com"

sanitizeEmail('invalid<script>@email.com');
// Output: "invalidscript@email.com" or "" if invalid
```

### 5. URL Sanitization

```typescript
const cleanURL = sanitizeURL(url);
// - Blocks javascript: and data: URLs
// - Ensures https:// protocol
// - Validates URL format
```

**Example:**
```typescript
sanitizeURL('example.com');
// Output: "https://example.com"

sanitizeURL('javascript:alert(1)');
// Output: "" (blocked)

sanitizeURL('https://safe-site.com');
// Output: "https://safe-site.com"
```

### 6. Number Sanitization

**Integer:**
```typescript
const num = sanitizeInteger(value, defaultValue);
```

**Float/Decimal:**
```typescript
const price = sanitizeFloat(value, defaultValue, decimals);
```

**Example:**
```typescript
sanitizeInteger('42');        // 42
sanitizeInteger('42.9');      // 42 (floor)
sanitizeInteger('invalid');   // 0 (default)
sanitizeInteger('abc', 10);   // 10 (custom default)

sanitizeFloat('42.567', 0, 2);  // 42.57
sanitizeFloat('99.999', 0, 2);  // 100.00
```

### 7. Boolean Sanitization

```typescript
const bool = sanitizeBoolean(value, defaultValue);
```

**Example:**
```typescript
sanitizeBoolean('true');   // true
sanitizeBoolean('1');      // true
sanitizeBoolean('yes');    // true
sanitizeBoolean('false');  // false
sanitizeBoolean('0');      // false
sanitizeBoolean('xyz');    // false (default)
```

### 8. Product Data Sanitization

**Comprehensive sanitization for product imports:**
```typescript
const clean = sanitizeProductData(rawData);
// - Sanitizes all string fields
// - Sanitizes HTML in description
// - Validates and cleans numbers
// - Converts booleans properly
// - Normalizes SKU to uppercase
```

**Example:**
```typescript
const rawProduct = {
  name: '<script>alert(1)</script>Product',
  price: '99.999',
  stockQuantity: '42.5',
  isActive: 'yes',
  sku: 'prod-001',
};

const clean = sanitizeProductData(rawProduct);
// Output:
// {
//   name: "Product",
//   price: 100.00,
//   stockQuantity: 42,
//   isActive: true,
//   sku: "PROD-001",
//   ...
// }
```

---

## CSV Import Sanitization

### Flow

1. **File Validation**
   - Check file type (.csv only)
   - Check file size (max 10MB)
   - Validate file content

2. **Header Sanitization**
   - Clean CSV headers
   - Detect injection in headers

3. **Row-by-Row Sanitization**
   - Sanitize each CSV cell
   - Detect SQL injection patterns
   - Detect XSS patterns
   - Validate required fields
   - Sanitize all product data

4. **Security Logging**
   - Log detected attacks
   - Track rejected rows
   - Audit import results

### Implementation

**In CSV import route:**
```typescript
import {
  sanitizeCSVCell,
  validateCSVRow,
  sanitizeProductData,
  detectSQLInjection,
  detectXSS
} from '@/lib/sanitize';

// Sanitize headers
const headers = lines[0]
  .split(',')
  .map(h => sanitizeCSVCell(h.replace(/^"|"$/g, '')));

// Sanitize each cell
for (let char of row) {
  if (char === '"') {
    inQuotes = !inQuotes;
  } else if (char === ',' && !inQuotes) {
    const sanitizedValue = sanitizeCSVCell(
      currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    );
    values.push(sanitizedValue);
    currentValue = '';
  }
}

// Detect attacks
if (detectSQLInjection(rowData['Name'])) {
  results.securityWarnings.push(`Row ${rowNumber}: SQL injection detected`);
  results.failed++;
  continue;
}

if (detectXSS(rowData['Name']) || detectXSS(rowData['Description'])) {
  results.securityWarnings.push(`Row ${rowNumber}: XSS attack detected`);
  results.failed++;
  continue;
}

// Sanitize product data
const sanitized = sanitizeProductData(rawProductData);
```

---

## Detection Functions

### SQL Injection Detection

```typescript
const isSQLInjection = detectSQLInjection(input);
// Checks for:
// - SQL keywords (SELECT, INSERT, UPDATE, DELETE, DROP, etc.)
// - SQL operators (OR, AND with = patterns)
// - SQL comment markers (--, /*, ;)
// - Common injection patterns (1=1, 'OR'1'='1)
```

**Example:**
```typescript
detectSQLInjection("Product'; DROP TABLE products;--");
// true (SQL injection detected)

detectSQLInjection("Normal Product Name");
// false (safe)
```

### XSS Detection

```typescript
const isXSS = detectXSS(input);
// Checks for:
// - Script tags
// - JavaScript URLs
// - Event handlers
// - Iframe/object/embed tags
```

**Example:**
```typescript
detectXSS('<script>alert(1)</script>');
// true (XSS detected)

detectXSS('javascript:void(0)');
// true (XSS detected)

detectXSS('Normal text');
// false (safe)
```

---

## API Integration

### Automatic Sanitization

All admin routes with `withAuth()` middleware automatically:
- Validate input
- Sanitize strings
- Detect injection attempts
- Log security events

### Manual Sanitization

For custom validation:

```typescript
import { sanitizeString, detectXSS } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Detect attacks first
  if (detectXSS(body.name)) {
    return NextResponse.json(
      { error: 'Invalid input detected' },
      { status: 400 }
    );
  }

  // Sanitize data
  const clean = {
    name: sanitizeString(body.name),
    email: sanitizeEmail(body.email),
    price: sanitizeFloat(body.price),
  };

  // Process clean data
  // ...
}
```

---

## Security Best Practices

### 1. Sanitize All User Input

**Always sanitize:**
- Form submissions
- CSV imports
- File uploads
- URL parameters
- Query strings
- JSON request bodies

```typescript
// ❌ BAD - Direct database insert
await db.insert(products).values({ name: req.body.name });

// ✅ GOOD - Sanitize first
const clean = sanitizeString(req.body.name);
await db.insert(products).values({ name: clean });
```

### 2. Validate Before Sanitizing

**Check for attacks first:**
```typescript
// Detect attack
if (detectXSS(input)) {
  // Log security event
  await auditLog(req, {
    action: 'security_violation',
    status: 'blocked',
    errorMessage: 'XSS attempt detected',
  });

  // Reject request
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}

// Then sanitize
const clean = sanitizeString(input);
```

### 3. Use Type-Specific Sanitization

```typescript
// ❌ BAD - Generic sanitization
const price = sanitizeString(req.body.price);

// ✅ GOOD - Type-specific sanitization
const price = sanitizeFloat(req.body.price, 0, 2);
```

### 4. Log Security Events

```typescript
if (detectSQLInjection(input)) {
  await auditLog(req, {
    userId: context.userId,
    action: 'security_violation',
    resource: 'products',
    status: 'blocked',
    errorMessage: 'SQL injection attempt detected',
    metadata: { input: input.substring(0, 100) },
  });
}
```

### 5. Sanitize CSV Exports Too

```typescript
// When exporting to CSV
const escapedName = sanitizeCSVCell(product.name);
csvContent += `${escapedName},${product.price}\n`;
```

---

## Testing

### Manual Testing

```bash
# Test CSV injection
curl -X POST http://localhost:3000/api/admin/products/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@malicious.csv"

# malicious.csv:
# Name,Price
# =1+1,100
# @SUM(A1:A10),200
# '+cmd|'/c calc',300
```

### Expected Response:
```json
{
  "success": true,
  "results": {
    "created": 0,
    "updated": 0,
    "failed": 3,
    "securityWarnings": [
      "Row 2: Potential CSV injection in Name field - row rejected",
      "Row 3: Potential CSV injection in Name field - row rejected",
      "Row 4: Potential CSV injection in Name field - row rejected"
    ],
    "errors": [
      "Row 2: Security violation detected",
      "Row 3: Security violation detected",
      "Row 4: Security violation detected"
    ]
  }
}
```

### Automated Testing

```typescript
// __tests__/sanitization.test.ts
import {
  sanitizeString,
  sanitizeCSVCell,
  detectXSS,
  detectSQLInjection,
} from '@/lib/sanitize';

describe('Input Sanitization', () => {
  test('should remove script tags', () => {
    const result = sanitizeString('<script>alert(1)</script>Hello');
    expect(result).toBe('Hello');
  });

  test('should detect XSS', () => {
    expect(detectXSS('<script>alert(1)</script>')).toBe(true);
    expect(detectXSS('Normal text')).toBe(false);
  });

  test('should detect SQL injection', () => {
    expect(detectSQLInjection("'; DROP TABLE users;--")).toBe(true);
    expect(detectSQLInjection('Normal text')).toBe(false);
  });

  test('should sanitize CSV cells', () => {
    expect(sanitizeCSVCell('=1+1')).toBe("'=1+1");
    expect(sanitizeCSVCell('Normal')).toBe('Normal');
  });
});
```

---

## Common Attack Vectors

### 1. XSS in Product Names
```
Input: <img src=x onerror="alert('XSS')">Product Name
Result: BLOCKED & SANITIZED
```

### 2. SQL Injection in Search
```
Input: Product'; DROP TABLE products;--
Result: DETECTED & BLOCKED
```

### 3. CSV Formula Injection
```
Input: =cmd|'/c calc'!A1
Result: SANITIZED to '=cmd|'/c calc'!A1
```

### 4. JavaScript URL in Product URL
```
Input: javascript:alert(document.cookie)
Result: BLOCKED
```

### 5. Event Handler in Description
```
Input: <p onclick="alert(1)">Description</p>
Result: SANITIZED to <p>Description</p>
```

---

## Error Messages

### Security Violations

When injection is detected, users see:
```json
{
  "error": "Security violation detected",
  "message": "Invalid input detected in submission"
}
```

### CSV Import Warnings

```json
{
  "success": true,
  "results": {
    "securityWarnings": [
      "Row 5: Potential XSS attack detected - row rejected",
      "Row 12: Potential SQL injection in Name field - row rejected"
    ]
  }
}
```

---

## Audit Logging

All security events are logged:

```typescript
await auditLog(req, {
  userId: context.userId,
  action: 'import_products',
  resource: 'products',
  status: 'success',
  metadata: {
    created: 10,
    updated: 5,
    failed: 3,
    securityWarnings: 2, // Attacks detected and blocked
  },
});
```

**View security logs:**
```bash
GET /api/admin/audit-logs?action=security_violation
```

---

## Performance Considerations

### Sanitization is Fast

- String operations are O(n)
- Regex matching is optimized
- No external dependencies
- Minimal overhead per request

### CSV Import

- Row-by-row processing
- Early rejection on security violations
- Memory-efficient streaming
- Max 10MB file size limit

---

## Configuration

### Environment Variables

No additional configuration needed!

Sanitization is automatically applied to:
- ✅ All admin API routes
- ✅ CSV imports
- ✅ Form submissions
- ✅ Product updates

---

## Troubleshooting

### Issue: Legitimate input being blocked

**Cause:** Input contains patterns that look like attacks

**Solution:**
1. Check the specific input that's being blocked
2. Review detection patterns in `src/lib/sanitize.ts`
3. Adjust patterns if needed (carefully!)

### Issue: CSV import rejecting valid data

**Cause:** CSV cells starting with =, +, -, @

**Solution:**
This is intentional! Formula injection is a real threat.
- Rename cells to not start with these characters
- Or accept the sanitized version (prefixed with ')

---

## Next Steps

### Additional Sanitization

Consider adding:
- File upload sanitization (validate MIME types)
- Image upload validation (check for embedded scripts)
- JSON structure validation (schema validation)
- Length limits enforcement

### Advanced Detection

- Machine learning-based anomaly detection
- IP reputation checking
- Rate limiting per security violation
- Automatic blocking after multiple violations

---

**Last Updated:** 2026-02-14

**Related Documentation:**
- [Audit Logging](./AUDIT_LOGGING.md) - Track security events
- [Rate Limiting](./RATE_LIMITING.md) - Prevent abuse
- [CSRF Protection](./CSRF_PROTECTION.md) - Prevent CSRF attacks
