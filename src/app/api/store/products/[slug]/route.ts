import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products, productImages, productCategories, categories, productVariants, productReviews, users } from '@/db/schema';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  try {
    const [product] = await db.select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const [images, variants, catLinks] = await Promise.all([
      db.select().from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.displayOrder)),
      db.select().from(productVariants)
        .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)))
        .orderBy(asc(productVariants.displayOrder)),
      db.select({ categoryId: productCategories.categoryId })
        .from(productCategories)
        .where(eq(productCategories.productId, product.id)),
    ]);

    const catIds = catLinks.map(c => c.categoryId);
    const cats = catIds.length > 0
      ? await db.select().from(categories).where(inArray(categories.id, catIds))
      : [];

    // Reviews
    const reviews = await db.select({
      id: productReviews.id,
      rating: productReviews.rating,
      title: productReviews.title,
      content: productReviews.content,
      isVerifiedPurchase: productReviews.isVerifiedPurchase,
      createdAt: productReviews.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
      .from(productReviews)
      .leftJoin(users, eq(productReviews.userId, users.id))
      .where(and(eq(productReviews.productId, product.id), eq(productReviews.isApproved, true)))
      .orderBy(desc(productReviews.createdAt))
      .limit(20);

    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      ...product,
      images,
      primaryImage: images.find(i => i.isPrimary) || images[0] || null,
      variants,
      categories: cats,
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
