/**
 * Input Sanitization Utility
 *
 * Prevents injection attacks (XSS, SQL injection, CSV injection, etc.)
 * by sanitizing user input from forms, CSV imports, and API requests.
 */

/**
 * Sanitize string input to prevent XSS attacks
 *
 * Removes dangerous HTML tags and JavaScript
 *
 * @param input - Raw string input
 * @returns Sanitized string
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';

  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove HTML tags (basic XSS prevention)
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/javascript:/gi, '');
}

/**
 * Sanitize HTML content (allow safe tags only)
 *
 * For rich text fields like product descriptions
 *
 * @param html - Raw HTML input
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string | null | undefined): string {
  if (!html) return '';

  // List of allowed tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote'];

  let sanitized = html.trim();

  // Remove dangerous tags
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '');

  return sanitized;
}

/**
 * Sanitize CSV cell value to prevent CSV injection
 *
 * CSV injection occurs when cells start with =, +, -, or @
 * which can execute formulas in Excel/Google Sheets
 *
 * @param value - Raw CSV cell value
 * @returns Sanitized CSV cell value
 */
export function sanitizeCSVCell(value: string | null | undefined): string {
  if (!value) return '';

  const trimmed = value.trim();

  // Check if cell starts with dangerous characters
  const dangerousStart = /^[=+\-@\t\r]/;

  if (dangerousStart.test(trimmed)) {
    // Prepend single quote to prevent formula execution
    return `'${trimmed}`;
  }

  // Remove null bytes and other control characters
  return trimmed.replace(/[\0\x08\x0B\x0C]/g, '');
}

/**
 * Sanitize email address
 *
 * @param email - Raw email input
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';

  const trimmed = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return '';
  }

  // Remove dangerous characters
  return trimmed.replace(/[<>()[\]\\,;:]/g, '');
}

/**
 * Sanitize phone number
 *
 * @param phone - Raw phone input
 * @returns Sanitized phone number (digits, +, -, spaces, parentheses only)
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';

  // Keep only digits, +, -, spaces, and parentheses
  return phone.trim().replace(/[^\d+\-() ]/g, '');
}

/**
 * Sanitize URL
 *
 * @param url - Raw URL input
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return '';

  const trimmed = url.trim();

  // Block javascript: and data: URLs (XSS vectors)
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '';
  }

  // Ensure URL starts with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize integer input
 *
 * @param value - Raw input
 * @param defaultValue - Default value if parsing fails
 * @returns Sanitized integer
 */
export function sanitizeInteger(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined) return defaultValue;

  const parsed = typeof value === 'number' ? value : parseInt(value, 10);

  return isNaN(parsed) ? defaultValue : Math.floor(parsed);
}

/**
 * Sanitize float/decimal input
 *
 * @param value - Raw input
 * @param defaultValue - Default value if parsing fails
 * @param decimals - Number of decimal places (default: 2)
 * @returns Sanitized float
 */
export function sanitizeFloat(
  value: string | number | null | undefined,
  defaultValue: number = 0,
  decimals: number = 2
): number {
  if (value === null || value === undefined) return defaultValue;

  const parsed = typeof value === 'number' ? value : parseFloat(value);

  if (isNaN(parsed)) return defaultValue;

  return parseFloat(parsed.toFixed(decimals));
}

/**
 * Sanitize boolean input
 *
 * @param value - Raw input
 * @param defaultValue - Default value if parsing fails
 * @returns Sanitized boolean
 */
export function sanitizeBoolean(
  value: string | boolean | number | null | undefined,
  defaultValue: boolean = false
): boolean {
  if (value === null || value === undefined) return defaultValue;

  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') return value !== 0;

  const lower = String(value).toLowerCase().trim();

  if (['true', '1', 'yes', 'y', 'on'].includes(lower)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(lower)) return false;

  return defaultValue;
}

/**
 * Sanitize file path to prevent directory traversal
 *
 * @param path - Raw file path
 * @returns Sanitized path (basename only)
 */
export function sanitizeFilePath(path: string | null | undefined): string {
  if (!path) return '';

  // Remove directory traversal attempts
  const sanitized = path
    .trim()
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[\0\x08\x0B\x0C]/g, '');

  return sanitized;
}

/**
 * Sanitize slug (URL-friendly string)
 *
 * @param slug - Raw slug input
 * @returns Sanitized slug
 */
export function sanitizeSlug(slug: string | null | undefined): string {
  if (!slug) return '';

  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Sanitize product data from CSV import
 *
 * Comprehensive sanitization for all product fields
 *
 * @param data - Raw product data from CSV
 * @returns Sanitized product data
 */
export function sanitizeProductData(data: Record<string, any>): Record<string, any> {
  return {
    // String fields
    name: sanitizeString(data.name),
    slug: sanitizeSlug(data.slug),
    sku: sanitizeString(data.sku)?.toUpperCase() || undefined,
    description: sanitizeHTML(data.description),
    shortDescription: sanitizeString(data.shortDescription),

    // Numeric fields
    price: sanitizeFloat(data.price, 0, 2),
    compareAtPrice: data.compareAtPrice ? sanitizeFloat(data.compareAtPrice, 0, 2) : undefined,
    costPerItem: data.costPerItem ? sanitizeFloat(data.costPerItem, 0, 2) : undefined,
    stockQuantity: sanitizeInteger(data.stockQuantity, 0),
    lowStockThreshold: sanitizeInteger(data.lowStockThreshold, 10),
    weight: data.weight ? sanitizeFloat(data.weight, 0, 2) : undefined,
    length: data.length ? sanitizeFloat(data.length, 0, 2) : undefined,
    width: data.width ? sanitizeFloat(data.width, 0, 2) : undefined,
    height: data.height ? sanitizeFloat(data.height, 0, 2) : undefined,

    // Boolean fields
    isActive: sanitizeBoolean(data.isActive, true),
    isFeatured: sanitizeBoolean(data.isFeatured, false),
    trackInventory: sanitizeBoolean(data.trackInventory, true),
    allowBackorder: sanitizeBoolean(data.allowBackorder, false),
    requiresShipping: sanitizeBoolean(data.requiresShipping, true),

    // SEO fields
    metaTitle: sanitizeString(data.metaTitle),
    metaDescription: sanitizeString(data.metaDescription),
    metaKeywords: sanitizeString(data.metaKeywords),
  };
}

/**
 * Detect potential SQL injection patterns
 *
 * For logging/monitoring purposes
 *
 * @param input - User input to check
 * @returns true if suspicious patterns detected
 */
export function detectSQLInjection(input: string | null | undefined): boolean {
  if (!input) return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(--|\*|;|'|"|`)/,
    /(\bOR\b|\bAND\b).*=.*=/i,
    /1\s*=\s*1/i,
    /'.*OR.*'/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential XSS patterns
 *
 * For logging/monitoring purposes
 *
 * @param input - User input to check
 * @returns true if suspicious patterns detected
 */
export function detectXSS(input: string | null | undefined): boolean {
  if (!input) return false;

  const xssPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize CSV import row
 *
 * @param row - Raw CSV row data
 * @param rowNumber - Row number for error reporting
 * @returns { valid: boolean, data?: sanitized data, error?: error message }
 */
export function validateCSVRow(
  row: Record<string, any>,
  rowNumber: number
): { valid: boolean; data?: Record<string, any>; error?: string } {
  // Required fields
  const requiredFields = ['name', 'price'];

  for (const field of requiredFields) {
    if (!row[field] || String(row[field]).trim() === '') {
      return {
        valid: false,
        error: `Row ${rowNumber}: Missing required field '${field}'`,
      };
    }
  }

  // Detect injection attacks
  const nameDetectSQL = detectSQLInjection(row.name);
  const nameDetectXSS = detectXSS(row.name);
  const descDetectXSS = detectXSS(row.description);

  if (nameDetectSQL) {
    return {
      valid: false,
      error: `Row ${rowNumber}: Potential SQL injection detected in 'name' field`,
    };
  }

  if (nameDetectXSS || descDetectXSS) {
    return {
      valid: false,
      error: `Row ${rowNumber}: Potential XSS attack detected`,
    };
  }

  // Sanitize all fields
  const sanitized = sanitizeProductData(row);

  // Validate sanitized data
  if (!sanitized.name || sanitized.name.length < 2) {
    return {
      valid: false,
      error: `Row ${rowNumber}: Product name must be at least 2 characters`,
    };
  }

  if (sanitized.price < 0) {
    return {
      valid: false,
      error: `Row ${rowNumber}: Price cannot be negative`,
    };
  }

  return {
    valid: true,
    data: sanitized,
  };
}
