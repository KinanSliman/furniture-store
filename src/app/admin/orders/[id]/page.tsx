'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  Clock,
  Mail,
  Phone,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  price: string;
  discount: string;
  tax: string;
  total: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variant?: {
    id: string;
    name: string;
  } | null;
}

interface StatusHistoryItem {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface Address {
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  paymentStatus: string;
  subtotal: string;
  tax: string;
  shippingCost: string;
  discountAmount: string;
  total: string;
  paymentMethod: string | null;
  shippingMethod: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  items: OrderItem[];
  statusHistory: StatusHistoryItem[];
  shippingAddress: Address | null;
  billingAddress: Address | null;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data.order);
      setNewStatus(data.order.status);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
      router.push('/admin/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order?.status) {
      toast.error('Please select a different status');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Order status updated successfully');
      setStatusNote('');
      fetchOrder();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      partially_refunded: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">Order {order.orderNumber}</h1>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {formatStatusLabel(order.status)}
            </span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
              {formatStatusLabel(order.paymentStatus)}
            </span>
          </div>
          <p className="text-slate-600 mt-1 flex items-center gap-2">
            <Calendar size={16} />
            {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package size={20} />
              Order Items
            </h2>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={24} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900">{item.productName}</h3>
                    {item.variantName && (
                      <p className="text-sm text-slate-600">{item.variantName}</p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(parseFloat(item.total))}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatCurrency(parseFloat(item.price))} each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(parseFloat(order.subtotal))}</span>
              </div>
              {parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(parseFloat(order.discountAmount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Shipping</span>
                <span className="font-medium">{formatCurrency(parseFloat(order.shippingCost))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax</span>
                <span className="font-medium">{formatCurrency(parseFloat(order.tax))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>{formatCurrency(parseFloat(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Customer Information
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span className="text-slate-900">
                  {order.user
                    ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Guest'
                    : 'Guest'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <a href={`mailto:${order.email}`} className="text-purple-600 hover:text-purple-800">
                  {order.email}
                </a>
              </div>
              {order.user?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-slate-400" />
                  <a href={`tel:${order.user.phone}`} className="text-purple-600 hover:text-purple-800">
                    {order.user.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Truck size={20} />
                  Shipping Address
                </h2>
                <div className="text-sm text-slate-600 space-y-1">
                  <p className="font-medium text-slate-900">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                </div>
              </div>
            )}

            {/* Billing Address */}
            {order.billingAddress && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard size={20} />
                  Billing Address
                </h2>
                <div className="text-sm text-slate-600 space-y-1">
                  <p className="font-medium text-slate-900">
                    {order.billingAddress.firstName} {order.billingAddress.lastName}
                  </p>
                  {order.billingAddress.company && <p>{order.billingAddress.company}</p>}
                  <p>{order.billingAddress.address1}</p>
                  {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                  <p>
                    {order.billingAddress.city}, {order.billingAddress.state}{' '}
                    {order.billingAddress.postalCode}
                  </p>
                  <p>{order.billingAddress.country}</p>
                  {order.billingAddress.phone && <p>{order.billingAddress.phone}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {(order.customerNotes || order.adminNotes) && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
              {order.customerNotes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Customer Notes</h3>
                  <p className="text-sm text-slate-600">{order.customerNotes}</p>
                </div>
              )}
              {order.adminNotes && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Admin Notes</h3>
                  <p className="text-sm text-slate-600">{order.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Update Status</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                  Order Status
                </label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label htmlFor="statusNote" className="block text-sm font-medium text-slate-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  id="statusNote"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add a note about this status change..."
                />
              </div>

              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || newStatus === order.status}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Update Status
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Payment & Shipping Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600">Payment Method</p>
                <p className="font-medium text-slate-900">
                  {order.paymentMethod ? formatStatusLabel(order.paymentMethod) : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Shipping Method</p>
                <p className="font-medium text-slate-900">
                  {order.shippingMethod || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Created</p>
                <p className="font-medium text-slate-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-600">Last Updated</p>
                <p className="font-medium text-slate-900">{formatDate(order.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock size={20} />
                Status History
              </h2>

              <div className="space-y-4">
                {order.statusHistory.map((history) => (
                  <div key={history.id} className="border-l-2 border-purple-200 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusColor(history.status)}`}>
                        {formatStatusLabel(history.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{formatDate(history.createdAt)}</p>
                    {history.note && (
                      <p className="text-sm text-slate-700 mt-1">{history.note}</p>
                    )}
                    {history.createdBy && (
                      <p className="text-xs text-slate-500 mt-1">
                        by {history.createdBy.firstName} {history.createdBy.lastName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
