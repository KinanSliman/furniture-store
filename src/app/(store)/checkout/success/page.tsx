'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, Mail } from 'lucide-react';

interface OrderSummary {
  orderNumber: string;
  total: string;
  email: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderParam = searchParams.get('order');
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('lumina_last_order');
      if (stored) {
        const parsed = JSON.parse(stored) as OrderSummary;
        if (!orderParam || parsed.orderNumber === orderParam) {
          setOrder(parsed);
          return;
        }
      }
    } catch {}
    if (orderParam) {
      setOrder({ orderNumber: orderParam, total: '', email: '' });
    }
  }, [orderParam]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-light text-stone-900 mb-3">Thank you for your order</h1>
      <p className="text-stone-500 text-sm sm:text-base mb-2">
        This was a demo checkout — no payment was taken and nothing will ship.
      </p>
      <p className="text-stone-400 text-sm mb-8 sm:mb-10">
        Your order has been recorded in the admin dashboard so you can see the full flow.
      </p>

      {order && (
        <div className="bg-stone-50 border border-stone-100 rounded-sm p-5 sm:p-6 mb-8 sm:mb-10 text-left">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-100 mb-4">
            <div>
              <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Order number</p>
              <p className="text-base font-medium text-stone-900 break-all">{order.orderNumber}</p>
            </div>
            {order.total && (
              <div className="text-right">
                <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Total</p>
                <p className="text-base font-medium text-stone-900">
                  ${parseFloat(order.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          {order.email && (
            <div className="flex items-start gap-3 text-sm text-stone-600">
              <Mail className="w-4 h-4 mt-0.5 text-stone-400 flex-shrink-0" />
              <span>
                A confirmation would normally be sent to{' '}
                <span className="text-stone-900">{order.email}</span>.
              </span>
            </div>
          )}
          <div className="flex items-start gap-3 text-sm text-stone-600 mt-3">
            <Package className="w-4 h-4 mt-0.5 text-stone-400 flex-shrink-0" />
            <span>You can find this order under <Link href="/admin/orders" className="text-stone-900 underline underline-offset-2">Admin → Orders</Link>.</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 text-sm font-medium tracking-wide hover:bg-stone-800 transition-colors"
        >
          Continue shopping
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 border border-stone-200 text-stone-700 px-6 py-3 text-sm font-medium tracking-wide hover:border-stone-400 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-full mx-auto mb-6 animate-pulse" />
          <div className="h-6 bg-stone-100 rounded w-2/3 mx-auto mb-3 animate-pulse" />
          <div className="h-4 bg-stone-100 rounded w-1/2 mx-auto animate-pulse" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
