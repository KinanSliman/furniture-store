import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';
import { generateSlug } from '@/lib/utils';
import {
  sanitizeCSVCell,
  validateCSVRow,
  sanitizeProductData,
  detectSQLInjection,
  detectXSS
} from '@/lib/sanitize';
import { auditLog } from '@/lib/audit-log';

// POST - Import products from CSV
export const POST = withAuth(async (req: NextRequest, context) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      await auditLog(req, {
        userId: context.userId,
        action: 'import_products',
        resource: 'products',
        status: 'failed',
        errorMessage: 'No file provided',
      });

      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      await auditLog(req, {
        userId: context.userId,
        action: 'import_products',
        resource: 'products',
        status: 'failed',
        errorMessage: 'Invalid file type (must be CSV)',
      });

      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      await auditLog(req, {
        userId: context.userId,
        action: 'import_products',
        resource: 'products',
        status: 'failed',
        errorMessage: 'File too large (max 10MB)',
      });

      return NextResponse.json(
        { error: 'File too large (maximum 10MB)' },
        { status: 400 }
      );
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file is empty or invalid' },
        { status: 400 }
      );
    }

    // Parse CSV headers and sanitize them
    const headers = lines[0]
      .split(',')
      .map(h => sanitizeCSVCell(h.replace(/^"|"$/g, '')));

    const rows = lines.slice(1);

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
      securityWarnings: [] as string[],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];

        // Parse CSV row (handle quoted values with commas)
        const values: string[] = [];
        let currentValue = '';
        let inQuotes = false;

        for (let char of row) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            // Sanitize each CSV cell to prevent CSV injection
            const sanitizedValue = sanitizeCSVCell(
              currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
            );
            values.push(sanitizedValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        // Sanitize the last value
        const sanitizedValue = sanitizeCSVCell(
          currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
        );
        values.push(sanitizedValue);

        // Map values to object
        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || null;
        });

        // Detect injection attacks before validation
        const rowNumber = i + 2;
        let securityIssueDetected = false;

        if (detectSQLInjection(rowData['Name'])) {
          results.securityWarnings.push(`Row ${rowNumber}: Potential SQL injection in Name field - row rejected`);
          results.errors.push(`Row ${rowNumber}: Security violation detected`);
          results.failed++;
          securityIssueDetected = true;
        }

        if (detectXSS(rowData['Name']) || detectXSS(rowData['Description'])) {
          results.securityWarnings.push(`Row ${rowNumber}: Potential XSS attack detected - row rejected`);
          results.errors.push(`Row ${rowNumber}: Security violation detected`);
          results.failed++;
          securityIssueDetected = true;
        }

        if (securityIssueDetected) {
          continue;
        }

        // Validate required fields
        if (!rowData['Name']) {
          results.errors.push(`Row ${rowNumber}: Name is required`);
          results.failed++;
          continue;
        }

        if (!rowData['Price']) {
          results.errors.push(`Row ${rowNumber}: Price is required`);
          results.failed++;
          continue;
        }

        // Check if product exists (by ID or SKU)
        let existingProduct = null;
        if (rowData['ID']) {
          existingProduct = await db.query.products.findFirst({
            where: eq(products.id, rowData['ID']),
          });
        } else if (rowData['SKU']) {
          existingProduct = await db.query.products.findFirst({
            where: eq(products.sku, rowData['SKU']),
          });
        }

        // Sanitize and prepare product data
        const rawProductData = {
          name: rowData['Name'],
          slug: rowData['Slug'],
          description: rowData['Description'],
          shortDescription: rowData['Short Description'],
          price: rowData['Price'],
          compareAtPrice: rowData['Compare At Price'],
          costPerItem: rowData['Cost Price'],
          sku: rowData['SKU'],
          barcode: rowData['Barcode'],
          stockQuantity: rowData['Stock Quantity'],
          lowStockThreshold: rowData['Low Stock Threshold'],
          trackInventory: rowData['Track Inventory'],
          weight: rowData['Weight'],
          weightUnit: rowData['Weight Unit'],
          length: rowData['Length'],
          width: rowData['Width'],
          height: rowData['Height'],
          dimensionUnit: rowData['Dimension Unit'],
          isActive: rowData['Is Active'],
          isFeatured: rowData['Is Featured'],
          metaTitle: rowData['Meta Title'],
          metaDescription: rowData['Meta Description'],
          metaKeywords: rowData['Meta Keywords'],
        };

        // Apply comprehensive sanitization
        const sanitized = sanitizeProductData(rawProductData);

        // Generate slug if not provided
        if (!sanitized.slug) {
          sanitized.slug = generateSlug(sanitized.name);
        }

        // Add weight and dimension units with defaults
        const productData: any = {
          ...sanitized,
          weightUnit: rowData['Weight Unit'] || 'kg',
          dimensionUnit: rowData['Dimension Unit'] || 'cm',
          barcode: rowData['Barcode'] || null,
        };

        if (existingProduct) {
          // Update existing product
          productData.updatedAt = new Date();
          await db.update(products)
            .set(productData)
            .where(eq(products.id, existingProduct.id));
          results.updated++;
        } else {
          // Create new product
          await db.insert(products).values(productData);
          results.created++;
        }

      } catch (error: any) {
        console.error(`Error processing row ${i + 2}:`, error);
        results.errors.push(`Row ${i + 2}: ${error.message}`);
        results.failed++;
      }
    }

    // Log import completion
    await auditLog(req, {
      userId: context.userId,
      action: 'import_products',
      resource: 'products',
      status: 'success',
      metadata: {
        created: results.created,
        updated: results.updated,
        failed: results.failed,
        totalRows: rows.length,
        securityWarnings: results.securityWarnings.length,
      },
    });

    // If security warnings were detected, include them in response
    if (results.securityWarnings.length > 0) {
      console.warn('⚠️  Security warnings during CSV import:', results.securityWarnings);
    }

    return NextResponse.json({
      success: true,
      message: 'Import completed',
      results,
    });

  } catch (error: any) {
    console.error('Error importing products:', error);

    await auditLog(req, {
      userId: context.userId,
      action: 'import_products',
      resource: 'products',
      status: 'failed',
      errorMessage: error.message,
    });

    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
}, 'admin', { csrf: false });
