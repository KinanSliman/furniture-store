import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';
import { generateSlug } from '@/lib/utils';

// POST - Import products from CSV
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
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

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1);

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
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
            values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

        // Map values to object
        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || null;
        });

        // Validate required fields
        if (!rowData['Name']) {
          results.errors.push(`Row ${i + 2}: Name is required`);
          results.failed++;
          continue;
        }

        if (!rowData['Price']) {
          results.errors.push(`Row ${i + 2}: Price is required`);
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

        // Prepare product data
        const productData: any = {
          name: rowData['Name'],
          slug: rowData['Slug'] || generateSlug(rowData['Name']),
          description: rowData['Description'] || null,
          shortDescription: rowData['Short Description'] || null,
          price: parseFloat(rowData['Price']) || 0,
          compareAtPrice: rowData['Compare At Price'] ? parseFloat(rowData['Compare At Price']) : null,
          costPrice: rowData['Cost Price'] ? parseFloat(rowData['Cost Price']) : null,
          sku: rowData['SKU'] || null,
          barcode: rowData['Barcode'] || null,
          stockQuantity: parseInt(rowData['Stock Quantity']) || 0,
          lowStockThreshold: parseInt(rowData['Low Stock Threshold']) || 5,
          trackInventory: rowData['Track Inventory'] === 'true' || rowData['Track Inventory'] === '1',
          weight: rowData['Weight'] ? parseFloat(rowData['Weight']) : null,
          weightUnit: rowData['Weight Unit'] || 'kg',
          length: rowData['Length'] ? parseFloat(rowData['Length']) : null,
          width: rowData['Width'] ? parseFloat(rowData['Width']) : null,
          height: rowData['Height'] ? parseFloat(rowData['Height']) : null,
          dimensionUnit: rowData['Dimension Unit'] || 'cm',
          isActive: rowData['Is Active'] === 'true' || rowData['Is Active'] === '1',
          isFeatured: rowData['Is Featured'] === 'true' || rowData['Is Featured'] === '1',
          metaTitle: rowData['Meta Title'] || null,
          metaDescription: rowData['Meta Description'] || null,
          metaKeywords: rowData['Meta Keywords'] || null,
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

    return NextResponse.json({
      success: true,
      message: 'Import completed',
      results,
    });

  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
}, 'admin');
