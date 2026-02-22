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
        {/* Promo bar */}
        <div className="bg-stone-900 text-stone-100 text-center py-2 text-xs tracking-widest uppercase">
          Free white-glove delivery on orders over $1,000&nbsp;·&nbsp;Use code <span className="font-semibold text-amber-400">WELCOME10</span> for 10% off
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-stone-900 rounded-sm flex items-center justify-center">
                <span className="text-amber-400 font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-light tracking-[0.15em] text-stone-900 group-hover:text-stone-600 transition-colors">
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
            <div className="flex items-center gap-2">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search furniture..."
                    className="border-b border-stone-300 focus:border-stone-900 outline-none text-sm py-1 px-1 w-44 transition-colors"
                  />
                  <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                    <X className="w-4 h-4 text-stone-400" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-stone-500 hover:text-stone-900 transition-colors"
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
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-stone-900 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              <button
                className="lg:hidden p-2 text-stone-500 hover:text-stone-900"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-stone-100">
            <nav className="px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-stone-700 hover:text-stone-900 text-sm tracking-wide py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}

function StoreFooter() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
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
      <main className="pt-[88px] min-h-screen bg-white">
        {children}
      </main>
      <StoreFooter />
    </CartProvider>
  );
}
