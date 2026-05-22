'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Info, Lock, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  customerNotes: string;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    customerNotes: '',
  });

  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const shippingCost = subtotal >= 1000 || subtotal === 0 ? 0 : 49;
  const total = subtotal + tax + shippingCost;

  // If cart is empty (and we're not in the middle of placing an order), redirect away
  useEffect(() => {
    if (!submitting && items.length === 0) {
      const t = setTimeout(() => router.replace('/shop'), 50);
      return () => clearTimeout(t);
    }
  }, [items.length, submitting, router]);

  const handleChange = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      try {
        sessionStorage.setItem(
          'lumina_last_order',
          JSON.stringify({
            orderNumber: data.orderNumber,
            total: data.total,
            email: data.email,
          })
        );
      } catch {}

      clearCart();
      router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !submitting) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
        <ShoppingBag className="w-12 h-12 text-stone-200 mx-auto mb-4" />
        <h1 className="text-xl sm:text-2xl font-light text-stone-900 mb-2">Your cart is empty</h1>
        <p className="text-stone-400 text-sm mb-6">Redirecting you to the shop…</p>
        <Link href="/shop" className="text-sm text-stone-900 underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 mb-5 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Continue shopping
      </Link>

      <h1 className="text-2xl sm:text-3xl font-light text-stone-900 mb-2">Checkout</h1>
      <p className="text-stone-400 text-sm mb-6 sm:mb-8">Complete your order in a few simple steps</p>

      {/* Demo notice */}
      <div className="mb-6 sm:mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <strong className="font-medium">Demo mode</strong> — this is a portfolio project.
          No payment will be processed and no items will be shipped. Feel free to use any
          made-up shipping details to see the full flow.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Form */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-sm font-medium tracking-widest uppercase text-stone-500 mb-4">Contact</h2>
            <div className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email address"
                value={form.email}
                onChange={handleChange('email')}
                className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={handleChange('phone')}
                className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium tracking-widest uppercase text-stone-500 mb-4">Shipping address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="First name"
                value={form.firstName}
                onChange={handleChange('firstName')}
                className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
              <input
                type="text"
                required
                placeholder="Last name"
                value={form.lastName}
                onChange={handleChange('lastName')}
                className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
              <input
                type="text"
                required
                placeholder="Street address"
                value={form.address1}
                onChange={handleChange('address1')}
                className="sm:col-span-2 w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
              <input
                type="text"
                placeholder="Apartment, suite, etc. (optional)"
                value={form.address2}
                onChange={handleChange('address2')}
                className="sm:col-span-2 w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
              <input
                type="text"
                required
                placeholder="City"
                value={form.city}
                onChange={handleChange('city')}
                className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
              <input
                type="text"
                placeholder="State / Region"
                value={form.state}
                onChange={handleChange('state')}
                className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
              <input
                type="text"
                required
                placeholder="Postal code"
                value={form.postalCode}
                onChange={handleChange('postalCode')}
                className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
              <select
                required
                value={form.country}
                onChange={handleChange('country')}
                className="w-full border border-stone-200 px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium tracking-widest uppercase text-stone-500 mb-4">Order notes (optional)</h2>
            <textarea
              rows={3}
              placeholder="Special delivery instructions, gift message, etc."
              value={form.customerNotes}
              onChange={handleChange('customerNotes')}
              className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-400 transition-colors resize-none"
            />
          </section>

          <section>
            <h2 className="text-sm font-medium tracking-widest uppercase text-stone-500 mb-4">Payment</h2>
            <div className="border border-stone-200 px-4 py-5 bg-stone-50 text-center">
              <Lock className="w-5 h-5 text-stone-400 mx-auto mb-2" />
              <p className="text-sm text-stone-700 font-medium">Demo payment — no card required</p>
              <p className="text-xs text-stone-500 mt-1">
                A real Stripe / PayPal integration would render here.
              </p>
            </div>
          </section>
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-28 bg-stone-50 p-5 sm:p-6 rounded-sm">
            <h2 className="text-sm font-medium tracking-widest uppercase text-stone-500 mb-4">Order summary</h2>

            <ul className="space-y-3 mb-5 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative w-14 h-14 bg-stone-100 rounded-sm flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-stone-300" />
                      </div>
                    )}
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-900 text-white text-[10px] rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-900 line-clamp-2">{item.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      ${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-2 text-sm border-t border-stone-200 pt-4">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tax (8%)</span>
                <span>${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-medium text-stone-900 text-base pt-2 border-t border-stone-200 mt-2">
                <span>Total</span>
                <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="mt-5 w-full bg-stone-900 text-white py-3.5 text-sm font-medium tracking-widest uppercase hover:bg-stone-800 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Placing order…' : 'Place order (demo)'}
            </button>

            <p className="text-[11px] text-stone-400 mt-3 text-center leading-relaxed">
              By placing this demo order you acknowledge no payment is taken
              and no items will be shipped.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
