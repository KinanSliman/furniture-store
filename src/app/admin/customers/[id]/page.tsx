'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string;
  createdAt: Date;
  items: any[];
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }

      const data = await response.json();
      setCustomer(data.customer);
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer');
      router.push('/admin/customers');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

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

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/customers"
          className="text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {customer.firstName && customer.lastName
              ? `${customer.firstName} ${customer.lastName}`
              : customer.email}
          </h1>
          <p className="text-slate-600 mt-1 flex items-center gap-2">
            <Calendar size={16} />
            Customer since {formatDate(customer.createdAt.toString())}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={20} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">Total Orders</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">Total Spent</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">Avg. Order Value</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(averageOrderValue)}</p>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Order History</h2>
            </div>

            {orders.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <ShoppingCart size={48} className="mx-auto mb-3 text-slate-300" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {orders.map((order) => (
                  <div key={order.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-purple-600 hover:text-purple-800 transition-colors"
                        >
                          {order.orderNumber}
                        </Link>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-slate-600">
                            {formatDate(order.createdAt.toString())}
                          </span>
                          <span className="text-sm text-slate-600">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-900 mb-1">
                          {formatCurrency(parseFloat(order.total))}
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {formatStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer Information</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Name</label>
                <div className="flex items-center gap-2 mt-1">
                  <User size={16} className="text-slate-400" />
                  <span className="text-slate-900">
                    {customer.firstName && customer.lastName
                      ? `${customer.firstName} ${customer.lastName}`
                      : 'Not provided'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail size={16} className="text-slate-400" />
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    {customer.email}
                  </a>
                  {customer.emailVerified ? (
                    <CheckCircle size={16} className="text-green-600" aria-label="Verified" />
                  ) : (
                    <XCircle size={16} className="text-slate-400" aria-label="Not verified" />
                  )}
                </div>
              </div>

              {customer.phone && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Phone</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone size={16} className="text-slate-400" />
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Status</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    customer.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Email Verified</span>
                <span className="font-medium text-slate-900">
                  {customer.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Last Login</span>
                <span className="font-medium text-slate-900">
                  {customer.lastLoginAt
                    ? formatDate(customer.lastLoginAt.toString())
                    : 'Never'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Member Since</span>
                <span className="font-medium text-slate-900">
                  {formatDate(customer.createdAt.toString())}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
