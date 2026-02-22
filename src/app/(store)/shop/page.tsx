'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, X, ChevronDown, SlidersHorizontal, Star } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  shortDescriptionEn?: string | null;
  primaryImage?: { url: string; altText?: string | null } | null;
  isFeatured?: boolean;
}

interface Category {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  productCount?: number;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
];

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const price = parseFloat(product.price);
  const compareAt = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const discount = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden rounded-sm mb-4">
          {product.primaryImage ? (
            <img
              src={product.primaryImage.url}
              alt={product.primaryImage.altText || product.nameEn || product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
              <span className="text-stone-300 text-xs">No image</span>
            </div>
          )}

          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded-sm">
              −{discount}%
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem({
                  id: product.id,
                  productId: product.id,
                  name: product.nameEn || product.name,
                  slug: product.slug,
                  price,
                  compareAtPrice: compareAt,
                  image: product.primaryImage?.url || null,
                });
              }}
              className="w-full bg-stone-900 text-white text-sm py-2.5 hover:bg-stone-800 transition-colors tracking-wide"
            >
              Add to Cart
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-stone-900 mb-1 group-hover:text-stone-600 transition-colors">
            {product.nameEn || product.name}
          </h3>
          {product.shortDescriptionEn && (
            <p className="text-xs text-stone-400 mb-1 line-clamp-1">{product.shortDescriptionEn}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-stone-900 font-light">
              ${price.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
            {compareAt && (
              <span className="text-stone-400 text-sm line-through font-light">
                ${compareAt.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const limit = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      sort,
      ...(category && { category }),
      ...(search && { search }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
    });

    try {
      const data = await fetch(`/api/store/products?${params}`).then(r => r.json());
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, page, minPrice, maxPrice]);

  useEffect(() => {
    fetch('/api/store/categories').then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/shop?${params.toString()}`);
  };

  const currentCategory = categories.find(c => c.slug === category);
  const pageTitle = currentCategory ? (currentCategory.nameEn || currentCategory.name) : search ? `Search: "${search}"` : 'All Products';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb + Title */}
      <div className="mb-8">
        <nav className="text-xs text-stone-400 mb-3 flex items-center gap-2">
          <Link href="/" className="hover:text-stone-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-stone-600">{pageTitle}</span>
        </nav>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-light text-stone-900">{pageTitle}</h1>
          <p className="text-sm text-stone-400 hidden md:block">{total} {total === 1 ? 'piece' : 'pieces'}</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters - desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-28 space-y-8">
            {/* Categories */}
            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-stone-500 mb-4">Collections</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => updateParam('category', null)}
                    className={`text-sm w-full text-left transition-colors ${!category ? 'text-stone-900 font-medium' : 'text-stone-500 hover:text-stone-800'}`}
                  >
                    All Products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => updateParam('category', cat.slug)}
                      className={`text-sm w-full text-left transition-colors flex justify-between items-center ${
                        category === cat.slug ? 'text-stone-900 font-medium' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <span>{cat.nameEn || cat.name}</span>
                      <span className={`text-xs ${category === cat.slug ? 'text-stone-400' : 'text-stone-300'}`}>
                        {cat.productCount || 0}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price range */}
            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-stone-500 mb-4">Price Range</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:border-stone-400 text-stone-700"
                />
                <span className="text-stone-300 flex-shrink-0">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:border-stone-400 text-stone-700"
                />
              </div>
              <button
                onClick={fetchProducts}
                className="mt-2 w-full bg-stone-900 text-white text-xs py-2 hover:bg-stone-800 transition-colors"
              >
                Apply
              </button>
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                  className="mt-1 w-full text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile filter button */}
              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:border-stone-400 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filter
              </button>

              {/* Active filters */}
              {category && (
                <div className="flex items-center gap-1 bg-stone-100 px-3 py-1.5 text-xs text-stone-700">
                  {currentCategory?.nameEn || currentCategory?.name || category}
                  <button onClick={() => updateParam('category', null)} className="ml-1 text-stone-400 hover:text-stone-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {search && (
                <div className="flex items-center gap-1 bg-stone-100 px-3 py-1.5 text-xs text-stone-700">
                  "{search}"
                  <button onClick={() => updateParam('search', null)} className="ml-1 text-stone-400 hover:text-stone-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="appearance-none border border-stone-200 text-sm text-stone-600 px-4 py-2 pr-8 focus:outline-none focus:border-stone-400 bg-white cursor-pointer"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array(12).fill(0).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[4/5] bg-stone-100 animate-pulse rounded-sm mb-3" />
                  <div className="h-3 bg-stone-100 animate-pulse rounded w-3/4 mb-2" />
                  <div className="h-3 bg-stone-100 animate-pulse rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-6 h-6 text-stone-300" />
              </div>
              <h3 className="text-stone-900 font-medium mb-2">No products found</h3>
              <p className="text-stone-400 text-sm mb-6">Try adjusting your filters or search terms</p>
              <Link href="/shop" className="text-sm text-stone-900 underline underline-offset-4 hover:text-stone-600 transition-colors">
                View all products
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {page > 1 && (
                    <button
                      onClick={() => updateParam('page', String(page - 1))}
                      className="px-4 py-2 border border-stone-200 text-sm text-stone-600 hover:border-stone-400 transition-colors"
                    >
                      Previous
                    </button>
                  )}
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParam('page', String(p))}
                      className={`w-10 h-10 text-sm transition-colors ${
                        p === page
                          ? 'bg-stone-900 text-white'
                          : 'border border-stone-200 text-stone-600 hover:border-stone-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {page < pages && (
                    <button
                      onClick={() => updateParam('page', String(page + 1))}
                      className="px-4 py-2 border border-stone-200 text-sm text-stone-600 hover:border-stone-400 transition-colors"
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filterOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setFilterOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-stone-900">Filter</h3>
              <button onClick={() => setFilterOpen(false)}>
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold tracking-widest uppercase text-stone-500 mb-3">Collections</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { updateParam('category', null); setFilterOpen(false); }}
                    className={`px-3 py-1.5 text-sm border transition-colors ${!category ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { updateParam('category', cat.slug); setFilterOpen(false); }}
                      className={`px-3 py-1.5 text-sm border transition-colors ${
                        category === cat.slug ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                      }`}
                    >
                      {cat.nameEn || cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-8 bg-stone-100 animate-pulse rounded w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] bg-stone-100 animate-pulse rounded-sm mb-3" />
              <div className="h-3 bg-stone-100 animate-pulse rounded w-3/4 mb-2" />
              <div className="h-3 bg-stone-100 animate-pulse rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
