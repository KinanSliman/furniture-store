import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products, productImages, productCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET single product
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.displayOrder)],
        },
        productCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}, 'admin');

// PATCH (update) product
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if product exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check it's unique
    if (body.slug && body.slug !== existingProduct.slug) {
      const slugExists = await db.query.products.findFirst({
        where: eq(products.slug, body.slug),
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A product with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    // Only include fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription;
    if (body.price !== undefined) updateData.price = body.price.toString();
    if (body.compareAtPrice !== undefined) updateData.compareAtPrice = body.compareAtPrice ? body.compareAtPrice.toString() : null;
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice ? body.costPrice.toString() : null;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.barcode !== undefined) updateData.barcode = body.barcode;
    if (body.trackInventory !== undefined) updateData.trackInventory = body.trackInventory;
    if (body.stockQuantity !== undefined) updateData.stockQuantity = body.stockQuantity;
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = body.lowStockThreshold;
    if (body.weight !== undefined) updateData.weight = body.weight ? body.weight.toString() : null;
    if (body.weightUnit !== undefined) updateData.weightUnit = body.weightUnit;
    if (body.length !== undefined) updateData.length = body.length ? body.length.toString() : null;
    if (body.width !== undefined) updateData.width = body.width ? body.width.toString() : null;
    if (body.height !== undefined) updateData.height = body.height ? body.height.toString() : null;
    if (body.dimensionUnit !== undefined) updateData.dimensionUnit = body.dimensionUnit;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.attributes !== undefined) updateData.attributes = body.attributes;
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription;
    if (body.metaKeywords !== undefined) updateData.metaKeywords = body.metaKeywords;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    // Handle images update if provided
    if (body.images !== undefined && Array.isArray(body.images)) {
      // Delete existing images
      await db.delete(productImages).where(eq(productImages.productId, id));

      // Insert new images
      if (body.images.length > 0) {
        await db.insert(productImages).values(
          body.images.map((img: any, index: number) => ({
            productId: id,
            url: img.url,
            altText: img.altText || body.name || existingProduct.name,
            displayOrder: img.displayOrder ?? index,
            isPrimary: img.isPrimary ?? (index === 0),
          }))
        );
      }
    }

    // Handle categories update if provided
    if (body.categoryIds !== undefined && Array.isArray(body.categoryIds)) {
      // Delete existing category associations
      await db.delete(productCategories).where(eq(productCategories.productId, id));

      // Insert new category associations
      if (body.categoryIds.length > 0) {
        await db.insert(productCategories).values(
          body.categoryIds.map((categoryId: string) => ({
            productId: id,
            categoryId,
          }))
        );
      }
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}, 'admin');

// DELETE product
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    // Check if product exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product (cascade will handle related records)
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({
      message: 'Product deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}, 'admin');
