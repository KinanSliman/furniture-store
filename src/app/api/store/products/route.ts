import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { products, productImages, productCategories, categories } from '@/db/schema';
import { eq, and, ilike, or, desc, asc, sql, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const featured = searchParams.get('featured') === 'true';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(products.isActive, true)];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.nameEn, `%${search}%`),
          ilike(products.description, `%${search}%`)
        ) as any
      );
    }

    if (featured) {
      conditions.push(eq(products.isFeatured, true));
    }

    if (minPrice) {
      conditions.push(sql`${products.price} >= ${parseFloat(minPrice)}`);
    }

    if (maxPrice) {
      conditions.push(sql`${products.price} <= ${parseFloat(maxPrice)}`);
    }

    let orderBy;
    switch (sort) {
      case 'price-asc': orderBy = asc(products.price); break;
      case 'price-desc': orderBy = desc(products.price); break;
      case 'name': orderBy = asc(products.name); break;
      case 'popular': orderBy = desc(products.salesCount); break;
      default: orderBy = desc(products.createdAt);
    }

    // Filter by category slug
    let productIds: string[] | null = null;
    if (category) {
      const cat = await db.select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category))
        .limit(1);

      if (cat.length > 0) {
        const catProducts = await db.select({ productId: productCategories.productId })
          .from(productCategories)
          .where(eq(productCategories.categoryId, cat[0].id));
        productIds = catProducts.map(p => p.productId);
        if (productIds.length === 0) {
          return NextResponse.json({ products: [], total: 0, page, limit });
        }
      }
    }

    if (productIds) {
      conditions.push(inArray(products.id, productIds));
    }

    const whereClause = and(...conditions);

    const [countResult, productRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause),
      db.select().from(products).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
    ]);

    const total = Number(countResult[0].count);

    // Fetch images for these products
    if (productRows.length === 0) {
      return NextResponse.json({ products: [], total, page, limit, pages: Math.ceil(total / limit) });
    }

    const ids = productRows.map(p => p.id);
    const images = await db.select()
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.displayOrder));

    const catLinks = await db.select({ productId: productCategories.productId, categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(inArray(productCategories.productId, ids));

    const catIds = [...new Set(catLinks.map(c => c.categoryId))];
    const catData = catIds.length > 0
      ? await db.select().from(categories).where(inArray(categories.id, catIds))
      : [];

    const imageMap: Record<string, typeof images[0][]> = {};
    images.forEach(img => {
      if (!imageMap[img.productId]) imageMap[img.productId] = [];
      imageMap[img.productId].push(img);
    });

    const catMap: Record<string, string> = {};
    catData.forEach(c => { catMap[c.id] = c.name; });

    const catLinkMap: Record<string, string[]> = {};
    catLinks.forEach(cl => {
      if (!catLinkMap[cl.productId]) catLinkMap[cl.productId] = [];
      catLinkMap[cl.productId].push(catMap[cl.categoryId] || '');
    });

    const result = productRows.map(p => ({
      ...p,
      images: imageMap[p.id] || [],
      primaryImage: (imageMap[p.id] || []).find(i => i.isPrimary) || imageMap[p.id]?.[0] || null,
      categories: catLinkMap[p.id] || [],
    }));

    return NextResponse.json({
      products: result,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Store products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
