'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Star, Truck, Shield, RotateCcw, Award } from 'lucide-react';
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
  imageUrl?: string | null;
  productCount?: number;
}

const HERO_SLIDES = [
  {
    headline: 'Designed for\nthe way you live',
    sub: 'Premium furniture crafted to last a lifetime',
    cta: 'Shop Living Room',
    ctaHref: '/shop?category=living-room',
    bg: 'from-stone-900 to-stone-700',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop',
  },
  {
    headline: 'Rest well,\nlive beautifully',
    sub: 'Bedroom furniture that brings calm and comfort',
    cta: 'Explore Bedroom',
    ctaHref: '/shop?category=bedroom',
    bg: 'from-stone-800 to-amber-900',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&auto=format&fit=crop',
  },
  {
    headline: 'Gather,\ndine, celebrate',
    sub: 'Dining pieces made for the moments that matter',
    cta: 'Discover Dining',
    ctaHref: '/shop?category=dining-room',
    bg: 'from-stone-700 to-stone-900',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1600&auto=format&fit=crop',
  },
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
            <div className="w-full h-full flex items-center justify-center bg-stone-100">
              <span className="text-stone-300 text-xs">No image</span>
            </div>
          )}

          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded-sm">
              −{discount}%
            </div>
          )}

          {/* Quick add on hover */}
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

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/store/products?featured=true&limit=8').then(r => r.json()),
      fetch('/api/store/categories').then(r => r.json()),
    ]).then(([prodsData, catsData]) => {
      setFeatured(prodsData.products || []);
      setCategories(catsData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Hero auto-advance
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = HERO_SLIDES[slideIdx];

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative h-[80vh] min-h-[480px] sm:min-h-[560px] lg:min-h-[640px] overflow-hidden">
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === slideIdx ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={s.image}
              alt={s.headline}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-900/50 to-transparent" />
          </div>
        ))}

        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-lg">
              <p className="text-amber-400 text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3 sm:mb-4 font-medium">
                New Collection 2026
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-4 sm:mb-6 whitespace-pre-line">
                {slide.headline}
              </h1>
              <p className="text-stone-300 text-base sm:text-lg font-light mb-6 sm:mb-8 leading-relaxed">
                {slide.sub}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  href={slide.ctaHref}
                  className="inline-flex items-center gap-2 bg-white text-stone-900 px-5 sm:px-7 py-3 sm:py-3.5 text-sm font-medium tracking-wide hover:bg-amber-400 transition-colors"
                >
                  {slide.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/shop"
                  className="text-white text-sm underline underline-offset-4 hover:text-amber-300 transition-colors tracking-wide"
                >
                  View All
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIdx(i)}
              className={`h-0.5 transition-all duration-300 ${i === slideIdx ? 'w-8 bg-amber-400' : 'w-4 bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="border-y border-stone-100 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {[
              { icon: <Truck className="w-5 h-5" />, label: 'Free Delivery', sub: 'On orders over $1,000' },
              { icon: <Shield className="w-5 h-5" />, label: '10-Year Warranty', sub: 'On all solid wood pieces' },
              { icon: <RotateCcw className="w-5 h-5" />, label: '30-Day Returns', sub: 'Hassle-free returns' },
              { icon: <Award className="w-5 h-5" />, label: 'Sustainably Made', sub: 'FSC certified materials' },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-2">
                <div className="text-stone-500">{b.icon}</div>
                <div>
                  <p className="text-sm font-medium text-stone-900">{b.label}</p>
                  <p className="text-xs text-stone-400">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-light text-stone-900 mb-2 sm:mb-3">Shop by Room</h2>
            <p className="text-stone-400 text-sm sm:text-base">Curated collections for every space in your home</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-stone-100 animate-pulse rounded-sm" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-stone-100"
                >
                  {cat.imageUrl && (
                    <img
                      src={cat.imageUrl}
                      alt={cat.nameEn || cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium">{cat.nameEn || cat.name}</p>
                    <p className="text-stone-300 text-xs mt-0.5">{cat.productCount} pieces</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-12 sm:py-16 lg:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-light text-stone-900 mb-2 sm:mb-3">Featured Pieces</h2>
              <p className="text-stone-400 text-sm sm:text-base">Hand-picked from our latest collection</p>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 lg:gap-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[4/5] bg-stone-200 animate-pulse rounded-sm mb-3" />
                  <div className="h-3 bg-stone-200 animate-pulse rounded w-3/4 mb-2" />
                  <div className="h-3 bg-stone-200 animate-pulse rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 lg:gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-10 sm:mt-12 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 border border-stone-900 text-stone-900 px-6 sm:px-8 py-3 text-sm font-medium tracking-wide hover:bg-stone-900 hover:text-white transition-colors"
            >
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Editorial Banner ── */}
      <section className="relative h-[60vh] min-h-[360px] sm:min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&auto=format&fit=crop"
          alt="Lumina Living interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/60" />
        <div className="relative h-full flex items-center justify-center text-center">
          <div className="max-w-lg px-4 sm:px-6">
            <p className="text-amber-400 text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3 sm:mb-4">The Lumina Difference</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4 sm:mb-6 leading-tight">
              Built to last,<br />designed to delight
            </h2>
            <p className="text-stone-300 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
              Every piece in our collection is crafted by skilled artisans using sustainably sourced materials — furniture you'll pass down to the next generation.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-amber-400 text-stone-900 px-5 sm:px-7 py-3 sm:py-3.5 text-sm font-medium tracking-wide hover:bg-amber-300 transition-colors"
            >
              Explore the collection <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-light text-stone-900 mb-2 sm:mb-3">What our customers say</h2>
            <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
              {Array(5).fill(0).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              <span className="ml-2 text-sm text-stone-500">4.9 · 2,400+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {[
              {
                name: 'Emma T.', location: 'New York',
                review: 'The Havana sofa completely transformed our living room. The bouclé fabric is incredibly soft and the modular design made it so easy to configure. Zero regrets.',
                product: 'Havana Modular Sofa',
              },
              {
                name: 'Liam C.', location: 'Los Angeles',
                review: 'The Kyoto bed is stunning in person. The craftsmanship is impeccable and it arrived perfectly packaged. Best furniture purchase we\'ve ever made.',
                product: 'Kyoto Platform Bed',
              },
              {
                name: 'Sophia L.', location: 'Chicago',
                review: 'Every single person who visits asks about the coffee table. The marble veining is unique and the walnut base is the perfect complement. A true showstopper.',
                product: 'Marble & Walnut Coffee Table',
              },
            ].map((r) => (
              <div key={r.name} className="bg-stone-50 p-6 sm:p-8 rounded-sm">
                <div className="flex gap-0.5 mb-3 sm:mb-4">
                  {Array(5).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-stone-600 text-sm leading-relaxed mb-4 sm:mb-6 italic">"{r.review}"</p>
                <div>
                  <p className="text-sm font-medium text-stone-900">{r.name}</p>
                  <p className="text-xs text-stone-400">{r.location} · Verified Buyer</p>
                  <p className="text-xs text-stone-400 mt-0.5">{r.product}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-stone-900 py-12 sm:py-14 lg:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-amber-400 text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">Stay in the loop</p>
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-3 sm:mb-4">Design inspiration, first</h2>
          <p className="text-stone-400 text-sm mb-6 sm:mb-8">
            Join our community of design lovers. Get early access to new collections, styling tips, and exclusive member discounts.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-stone-800 border border-stone-700 text-white placeholder-stone-500 px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
            <button
              type="submit"
              className="bg-amber-400 text-stone-900 px-6 py-3 text-sm font-medium tracking-wide hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
          <p className="text-xs text-stone-500 mt-4">We respect your privacy. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  );
}
