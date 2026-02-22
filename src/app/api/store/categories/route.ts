import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { categories, productCategories, products } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const cats = await db.select().from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.displayOrder);

    // Count active products per category
    const counts = await db.select({
      categoryId: productCategories.categoryId,
      count: sql<number>`count(*)`,
    })
      .from(productCategories)
      .innerJoin(products, and(eq(products.id, productCategories.productId), eq(products.isActive, true)))
      .groupBy(productCategories.categoryId);

    const countMap: Record<string, number> = {};
    counts.forEach(c => { countMap[c.categoryId] = Number(c.count); });

    return NextResponse.json(
      cats.map(c => ({ ...c, productCount: countMap[c.id] || 0 }))
    );
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
