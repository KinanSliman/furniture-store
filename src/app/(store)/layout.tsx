'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useCart, CartProvider } from '@/hooks/useCart';

const navLinks = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Living Room', href: '/shop?category=living-room' },
  { label: 'Bedroom', href: '/shop?category=bedroom' },
  { label: 'Dining', href: '/shop?category=dining-room' },
  { label: 'Home Office', href: '/shop?category=home-office' },
  { label: 'Outdoor', href: '/shop?category=outdoor' },
];

function StoreHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { itemCount, openCart, CartDrawer } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
        }`}
      >
        {/* Promo bar - shorter copy on phones */}
        <div className="bg-stone-900 text-stone-100 text-center py-1.5 sm:py-2 text-[10px] sm:text-xs tracking-widest uppercase px-3">
          <span className="hidden sm:inline">
            Free white-glove delivery on orders over $1,000&nbsp;·&nbsp;Use code <span className="font-semibold text-amber-400">WELCOME10</span> for 10% off
          </span>
          <span className="sm:hidden">
            Code <span className="font-semibold text-amber-400">WELCOME10</span> · 10% off
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Mobile menu button (left on small) */}
            <button
              className="lg:hidden -ml-2 p-2 text-stone-700 hover:text-stone-900"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo - centered on mobile, left on desktop */}
            <Link
              href="/"
              className="flex items-center gap-2 group lg:flex-none absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-stone-900 rounded-sm flex items-center justify-center">
                <span className="text-amber-400 font-bold text-xs sm:text-sm">L</span>
              </div>
              <span className="text-base sm:text-xl font-light tracking-[0.15em] text-stone-900 group-hover:text-stone-600 transition-colors">
                LUMINA
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-stone-600 hover:text-stone-900 tracking-wide transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-stone-900 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 -mr-2 sm:mr-0">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search furniture..."
                    className="border-b border-stone-300 focus:border-stone-900 outline-none text-sm py-1 px-1 w-32 sm:w-44 transition-colors"
                  />
                  <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} aria-label="Close search">
                    <X className="w-4 h-4 text-stone-400" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="hidden sm:inline-flex p-2 text-stone-500 hover:text-stone-900 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={openCart}
                className="relative p-2 text-stone-500 hover:text-stone-900 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-stone-900 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer (slide in from left) */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute top-0 left-0 h-full w-[85%] max-w-sm bg-white shadow-xl flex flex-col transform transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-14 px-5 border-b border-stone-100">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <div className="w-7 h-7 bg-stone-900 rounded-sm flex items-center justify-center">
                <span className="text-amber-400 font-bold text-xs">L</span>
              </div>
              <span className="text-base font-light tracking-[0.15em] text-stone-900">LUMINA</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 -mr-2 text-stone-500 hover:text-stone-900"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="px-5 py-4 border-b border-stone-100">
            <div className="flex items-center gap-2 border border-stone-200 rounded-sm px-3 py-2 focus-within:border-stone-400">
              <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search furniture..."
                className="flex-1 outline-none text-sm bg-transparent"
              />
            </div>
          </form>

          <nav className="flex-1 overflow-y-auto px-2 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-3 text-stone-700 hover:bg-stone-50 hover:text-stone-900 text-sm tracking-wide rounded-sm"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-stone-100 px-5 py-4 text-xs text-stone-400">
            Free delivery over $1,000
          </div>
        </aside>
      </div>

      <CartDrawer />
    </>
  );
}

function StoreFooter() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-400 rounded-sm flex items-center justify-center">
                <span className="text-stone-900 font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-light tracking-[0.15em] text-white">LUMINA</span>
            </div>
            <p className="text-sm leading-relaxed text-stone-400">
              Thoughtfully designed furniture for spaces you love to live in.
            </p>
            <div className="flex gap-3 mt-6">
              {['IG', 'PI', 'FB'].map((s) => (
                <div key={s} className="w-8 h-8 border border-stone-700 rounded-full flex items-center justify-center text-xs text-stone-400 hover:border-stone-400 hover:text-stone-200 cursor-pointer transition-colors">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {[
            {
              title: 'Shop', links: [
                { label: 'Living Room', href: '/shop?category=living-room' },
                { label: 'Bedroom', href: '/shop?category=bedroom' },
                { label: 'Dining Room', href: '/shop?category=dining-room' },
                { label: 'Home Office', href: '/shop?category=home-office' },
                { label: 'Outdoor', href: '/shop?category=outdoor' },
                { label: 'Lighting', href: '/shop?category=lighting' },
              ]
            },
            {
              title: 'Company', links: [
                { label: 'About Us', href: '#' },
                { label: 'Sustainability', href: '#' },
                { label: 'Careers', href: '#' },
                { label: 'Press', href: '#' },
              ]
            },
            {
              title: 'Support', links: [
                { label: 'Delivery & Returns', href: '#' },
                { label: 'Care Guide', href: '#' },
                { label: 'Trade Programme', href: '#' },
                { label: 'Contact', href: '#' },
              ]
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white text-sm font-medium tracking-widest uppercase mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-stone-400 hover:text-stone-200 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-stone-500">© 2026 Lumina Living. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-stone-500">
            <Link href="#" className="hover:text-stone-300 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-stone-300 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-stone-300 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <StoreHeader />
      <main className="pt-[82px] sm:pt-[96px] min-h-screen bg-white">
        {children}
      </main>
      <StoreFooter />
    </CartProvider>
  );
}
