'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Star, Package, RotateCcw, Shield, Truck, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
}

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  content?: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface Product {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  descriptionEn?: string | null;
  shortDescriptionEn?: string | null;
  sku?: string | null;
  stockQuantity: number;
  attributes?: Record<string, unknown> | null;
  images: ProductImage[];
  primaryImage?: ProductImage | null;
  categories: Array<{ id: string; name: string; nameEn?: string | null; slug: string }>;
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
  weight?: string | null;
  weightUnit?: string | null;
  length?: string | null;
  width?: string | null;
  height?: string | null;
  dimensionUnit?: string | null;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex gap-0.5">
      {Array(5).fill(0).map((_, i) => (
        <Star
          key={i}
          className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
            i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
          }`}
        />
      ))}
    </div>
  );
}

function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>
      {open && (
        <div className="pb-4 text-sm text-stone-500 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/store/products/${slug}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data) {
          setProduct(data);
          const primaryIdx = data.images.findIndex((i: ProductImage) => i.isPrimary);
          setSelectedImage(primaryIdx >= 0 ? primaryIdx : 0);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    const price = parseFloat(product.price);
    const compareAt = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;

    addItem({
      id: product.id,
      productId: product.id,
      name: product.nameEn || product.name,
      slug: product.slug,
      price,
      compareAtPrice: compareAt,
      image: product.images[selectedImage]?.url || product.primaryImage?.url || null,
      quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="aspect-square bg-stone-100 animate-pulse rounded-sm" />
          <div className="space-y-4">
            <div className="h-6 bg-stone-100 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-stone-100 animate-pulse rounded w-1/4" />
            <div className="h-8 bg-stone-100 animate-pulse rounded w-1/3" />
            <div className="space-y-2 mt-8">
              <div className="h-3 bg-stone-100 animate-pulse rounded" />
              <div className="h-3 bg-stone-100 animate-pulse rounded" />
              <div className="h-3 bg-stone-100 animate-pulse rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-light text-stone-900 mb-4">Product not found</h1>
        <Link href="/shop" className="text-sm text-stone-600 underline underline-offset-4 hover:text-stone-900 transition-colors">
          Back to shop
        </Link>
      </div>
    );
  }

  const price = parseFloat(product.price);
  const compareAt = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const discount = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const inStock = product.stockQuantity > 0;

  const attributes = product.attributes as Record<string, unknown> | null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-stone-400 mb-6 sm:mb-8 flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <Link href="/" className="hover:text-stone-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-stone-600 transition-colors">Shop</Link>
        {product.categories[0] && (
          <>
            <span>/</span>
            <Link href={`/shop?category=${product.categories[0].slug}`} className="hover:text-stone-600 transition-colors hidden sm:inline">
              {product.categories[0].nameEn || product.categories[0].name}
            </Link>
            <span className="hidden sm:inline">/</span>
          </>
        )}
        <span className="text-stone-600 truncate max-w-[60vw]">{product.nameEn || product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-20">
        {/* Images */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="relative aspect-square bg-stone-100 overflow-hidden rounded-sm">
            {product.images[selectedImage] ? (
              <img
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].altText || product.nameEn || product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-stone-300" />
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-sm">
                Save {discount}%
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square bg-stone-100 overflow-hidden rounded-sm transition-all ${
                    i === selectedImage ? 'ring-2 ring-stone-900 ring-offset-2' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {/* Category */}
          {product.categories[0] && (
            <Link
              href={`/shop?category=${product.categories[0].slug}`}
              className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors mb-2 block"
            >
              {product.categories[0].nameEn || product.categories[0].name}
            </Link>
          )}

          {/* Name */}
          <h1 className="text-3xl sm:text-4xl font-light text-stone-900 leading-tight mb-4">
            {product.nameEn || product.name}
          </h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <StarRating rating={product.avgRating} />
              <span className="text-sm text-stone-500">
                {product.avgRating} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline flex-wrap gap-3 mb-5 sm:mb-6">
            <span className="text-2xl sm:text-3xl font-light text-stone-900">
              ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {compareAt && (
              <span className="text-stone-400 text-base sm:text-lg line-through font-light">
                ${compareAt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Short description */}
          {product.shortDescriptionEn && (
            <p className="text-stone-500 text-sm leading-relaxed mb-6">{product.shortDescriptionEn}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-xs text-stone-500">
              {inStock ? `In stock · ${product.stockQuantity} available` : 'Out of stock'}
            </span>
          </div>

          {/* Quantity + Add to cart */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-stone-200">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-2.5 text-stone-500 hover:text-stone-900 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2.5 text-sm text-stone-900 min-w-[48px] text-center border-x border-stone-200">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stockQuantity, q + 1))}
                  className="px-3 py-2.5 text-stone-500 hover:text-stone-900 transition-colors"
                  disabled={quantity >= product.stockQuantity}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-stone-400">Max {product.stockQuantity}</span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`w-full py-4 text-sm font-medium tracking-widest uppercase transition-all duration-300 ${
                added
                  ? 'bg-green-600 text-white'
                  : inStock
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {added ? 'Added to Cart ✓' : inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-stone-400 mb-6">SKU: {product.sku}</p>
          )}

          {/* Delivery badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 py-5 sm:py-6 border-y border-stone-100">
            {[
              { icon: <Truck className="w-4 h-4" />, title: 'Free Delivery', sub: 'On orders over $1,000' },
              { icon: <Shield className="w-4 h-4" />, title: '10-Year Warranty', sub: 'Solid wood pieces' },
              { icon: <RotateCcw className="w-4 h-4" />, title: '30-Day Returns', sub: 'Hassle-free process' },
              { icon: <Package className="w-4 h-4" />, title: 'Expert Assembly', sub: 'White glove service' },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="text-stone-400 mt-0.5 flex-shrink-0">{b.icon}</div>
                <div>
                  <p className="text-xs font-medium text-stone-700">{b.title}</p>
                  <p className="text-xs text-stone-400">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Accordion details */}
          <div>
            <AccordionSection title="Product Details">
              <p className="whitespace-pre-line">{product.descriptionEn}</p>
            </AccordionSection>

            {attributes && Object.keys(attributes).length > 0 && (
              <AccordionSection title="Specifications">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(attributes).map(([key, val]) => {
                    if (Array.isArray(val)) {
                      return (
                        <div key={key} className="col-span-2">
                          <dt className="font-medium text-stone-600 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1')}</dt>
                          <dd className="flex flex-wrap gap-1">
                            {val.map((v: unknown) => (
                              <span key={String(v)} className="bg-stone-100 px-2 py-0.5 text-xs rounded-sm text-stone-600">
                                {String(v)}
                              </span>
                            ))}
                          </dd>
                        </div>
                      );
                    }
                    return (
                      <div key={key}>
                        <dt className="font-medium text-stone-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                        <dd className="text-stone-500">{String(val)}</dd>
                      </div>
                    );
                  })}
                  {(product.weight || product.length) && (
                    <>
                      {product.weight && (
                        <div>
                          <dt className="font-medium text-stone-600">Weight</dt>
                          <dd className="text-stone-500">{product.weight} {product.weightUnit}</dd>
                        </div>
                      )}
                      {product.length && product.width && product.height && (
                        <div>
                          <dt className="font-medium text-stone-600">Dimensions</dt>
                          <dd className="text-stone-500">{product.length}×{product.width}×{product.height} {product.dimensionUnit}</dd>
                        </div>
                      )}
                    </>
                  )}
                </dl>
              </AccordionSection>
            )}

            <AccordionSection title="Delivery & Returns">
              <ul className="space-y-2 list-disc list-inside">
                <li>Free standard delivery on orders over $1,000</li>
                <li>White glove delivery and assembly available</li>
                <li>Orders typically dispatched within 3–5 business days</li>
                <li>Large items (sofas, beds, dining tables) may take 2–6 weeks</li>
                <li>30-day returns — contact us to arrange collection</li>
              </ul>
            </AccordionSection>

            <AccordionSection title="Care Instructions">
              <ul className="space-y-2 list-disc list-inside">
                <li>Wipe with a soft, damp cloth. Avoid harsh chemical cleaners.</li>
                <li>Keep solid wood pieces out of direct sunlight to prevent fading.</li>
                <li>Apply furniture wax or oil every 6–12 months to maintain finish.</li>
                <li>For upholstered items, spot-clean spills immediately with a dry cloth.</li>
              </ul>
            </AccordionSection>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <section className="mt-12 sm:mt-16 lg:mt-20 border-t border-stone-100 pt-10 sm:pt-12 lg:pt-16">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-light text-stone-900 mb-2">Customer Reviews</h2>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                <StarRating rating={product.avgRating} size="md" />
                <span className="text-stone-500 text-sm">
                  {product.avgRating} out of 5 · {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {product.reviews.map((review) => (
              <div key={review.id} className="bg-stone-50 p-5 sm:p-6 rounded-sm">
                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={review.rating} />
                  {review.isVerifiedPurchase && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                {review.title && (
                  <h4 className="text-sm font-medium text-stone-900 mb-2">{review.title}</h4>
                )}
                {review.content && (
                  <p className="text-sm text-stone-500 leading-relaxed mb-4 italic">"{review.content}"</p>
                )}
                <p className="text-xs text-stone-400">
                  {review.firstName} {review.lastName?.charAt(0)}.
                  <span className="mx-2">·</span>
                  {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
