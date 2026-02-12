'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  revenue: {
    total: number;
    change: number;
  };
  orders: {
    total: number;
    change: number;
  };
  products: {
    total: number;
    lowStock: number;
  };
  customers: {
    total: number;
    new: number;
  };
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats?.revenue.total.toLocaleString()}`,
      change: stats?.revenue.change || 0,
      icon: DollarSign,
      color: 'purple',
    },
    {
      title: 'Orders',
      value: stats?.orders.total.toLocaleString() || '0',
      change: stats?.orders.change || 0,
      icon: ShoppingCart,
      color: 'blue',
    },
    {
      title: 'Products',
      value: stats?.products.total.toLocaleString() || '0',
      subtitle: `${stats?.products.lowStock || 0} low stock`,
      icon: Package,
      color: 'green',
    },
    {
      title: 'Customers',
      value: stats?.customers.total.toLocaleString() || '0',
      subtitle: `${stats?.customers.new || 0} new this month`,
      icon: Users,
      color: 'orange',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            purple: 'bg-purple-500',
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            orange: 'bg-orange-500',
          }[stat.color];

          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${colorClasses} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                  <Icon size={24} />
                </div>
                {stat.change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <h3 className="text-slate-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-sm text-slate-500 mt-1">{stat.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <Link 
            href="/admin/orders"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-medium text-purple-600 hover:text-purple-700"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{order.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        ${order.total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/products/new"
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
        >
          <Package size={32} className="mb-3" />
          <h3 className="text-lg font-semibold mb-1">Add Product</h3>
          <p className="text-purple-100 text-sm">Create a new product listing</p>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
        >
          <ShoppingCart size={32} className="mb-3" />
          <h3 className="text-lg font-semibold mb-1">View Orders</h3>
          <p className="text-blue-100 text-sm">Manage customer orders</p>
        </Link>

        <Link
          href="/admin/analytics"
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
        >
          <TrendingUp size={32} className="mb-3" />
          <h3 className="text-lg font-semibold mb-1">Analytics</h3>
          <p className="text-green-100 text-sm">View sales & performance</p>
        </Link>
      </div>
    </div>
  );
}