import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/middleware';

// GET single category
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        parent: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          columns: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });

  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}, 'admin');

// PATCH (update) category
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if category exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check it's unique
    if (body.slug && body.slug !== existingCategory.slug) {
      const slugExists = await db.query.categories.findFirst({
        where: eq(categories.slug, body.slug),
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Prevent setting itself as parent
    if (body.parentId && body.parentId === id) {
      return NextResponse.json(
        { error: 'A category cannot be its own parent' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.metaTitle !== undefined) updateData.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined) updateData.metaDescription = body.metaDescription;

    updateData.updatedAt = new Date();

    // Update category
    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json({
      message: 'Category updated successfully',
      category: updatedCategory,
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}, 'admin');

// DELETE category
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    // Check if category exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        children: true,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has children
    if (existingCategory.children && existingCategory.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Delete or move subcategories first.' },
        { status: 400 }
      );
    }

    // Delete category
    await db.delete(categories).where(eq(categories.id, id));

    return NextResponse.json({
      message: 'Category deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}, 'admin');
