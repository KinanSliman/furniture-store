'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, AlertTriangle, XCircle, Search, Filter, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  isActive: boolean;
  images?: Array<{ url: string }>;
  variants?: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    attributes: any;
  }>;
}

interface InventoryAlerts {
  outOfStock: number;
  lowStock: number;
  variantsLowStock: number;
  variantsOutOfStock: number;
}

interface VariantAlert {
  id: string;
  name: string;
  stockQuantity: number;
  attributes: any;
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlerts>({
    outOfStock: 0,
    lowStock: 0,
    variantsLowStock: 0,
    variantsOutOfStock: 0,
  });
  const [variantAlerts, setVariantAlerts] = useState<{
    lowStock: VariantAlert[];
    outOfStock: VariantAlert[];
  }>({
    lowStock: [],
    outOfStock: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertFilter, setAlertFilter] = useState('all'); // 'all', 'low_stock', 'out_of_stock'
  const [searchQuery, setSearchQuery] = useState('');
  const [editedProducts, setEditedProducts] = useState<Map<string, { stockQuantity: number; lowStockThreshold: number }>>(new Map());

  useEffect(() => {
    fetchInventory();
  }, [alertFilter]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/inventory?alertType=${alertFilter}&sortBy=stockQuantity&sortOrder=asc`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data = await response.json();
      setProducts(data.products);
      setAlerts(data.alerts);
      setVariantAlerts(data.variantAlerts);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockChange = (productId: string, field: 'stockQuantity' | 'lowStockThreshold', value: number) => {
    const existing = editedProducts.get(productId) || {
      stockQuantity: products.find(p => p.id === productId)?.stockQuantity || 0,
      lowStockThreshold: products.find(p => p.id === productId)?.lowStockThreshold || 5,
    };

    editedProducts.set(productId, {
      ...existing,
      [field]: value,
    });

    setEditedProducts(new Map(editedProducts));

    // Update local state for immediate UI feedback
    setProducts(products.map(p =>
      p.id === productId
        ? { ...p, [field]: value }
        : p
    ));
  };

  const handleSaveChanges = async () => {
    if (editedProducts.size === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      const updates = Array.from(editedProducts.entries()).map(([id, data]) => ({
        id,
        ...data,
      }));

      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update inventory');
      }

      toast.success(`Updated ${updates.length} product(s) successfully`);
      setEditedProducts(new Map());
      fetchInventory(); // Refresh to get updated alerts
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (stock <= threshold) return { label: 'Low Stock', color: 'text-orange-600 bg-orange-50' };
    return { label: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <p className="text-slate-600 mt-1">Track stock levels and manage inventory alerts</p>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Out of Stock</p>
              <p className="text-2xl font-bold text-slate-900">{alerts.outOfStock}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            +{alerts.variantsOutOfStock} variants
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Low Stock</p>
              <p className="text-2xl font-bold text-slate-900">{alerts.lowStock}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            +{alerts.variantsLowStock} variants
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Tracked Products</p>
              <p className="text-2xl font-bold text-slate-900">{products.length}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Active inventory tracking
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Save size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending Changes</p>
              <p className="text-2xl font-bold text-slate-900">{editedProducts.size}</p>
            </div>
          </div>
          {editedProducts.size > 0 && (
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="w-full mt-3 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Products</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="low_stock">Low Stock</option>
          </select>

          <button
            onClick={fetchInventory}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Variant Alerts (if any) */}
      {(variantAlerts.outOfStock.length > 0 || variantAlerts.lowStock.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={20} />
            Variant Alerts
          </h3>
          <div className="space-y-2">
            {variantAlerts.outOfStock.slice(0, 3).map((variant) => (
              <div key={variant.id} className="text-sm text-amber-800">
                <Link
                  href={`/admin/products/${variant.product.id}`}
                  className="font-medium hover:text-amber-900 underline"
                >
                  {variant.product.name}
                </Link>
                {' - '}
                <span className="font-medium">{variant.name}</span>
                {' '}
                <span className="text-red-600">(Out of stock)</span>
              </div>
            ))}
            {variantAlerts.lowStock.slice(0, 3).map((variant) => (
              <div key={variant.id} className="text-sm text-amber-800">
                <Link
                  href={`/admin/products/${variant.product.id}`}
                  className="font-medium hover:text-amber-900 underline"
                >
                  {variant.product.name}
                </Link>
                {' - '}
                <span className="font-medium">{variant.name}</span>
                {' '}
                <span className="text-orange-600">({variant.stockQuantity} left)</span>
              </div>
            ))}
            {(variantAlerts.outOfStock.length + variantAlerts.lowStock.length) > 6 && (
              <p className="text-xs text-amber-700 mt-2">
                +{(variantAlerts.outOfStock.length + variantAlerts.lowStock.length) - 6} more variant alerts
              </p>
            )}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-500">
            <Package size={64} className="mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Threshold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Variants
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.stockQuantity, product.lowStockThreshold);
                  const hasChanges = editedProducts.has(product.id);

                  return (
                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${hasChanges ? 'bg-purple-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.images?.[0]?.url ? (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="font-medium text-slate-900 hover:text-purple-600 transition-colors block truncate"
                            >
                              {product.name}
                            </Link>
                            {hasChanges && (
                              <span className="text-xs text-purple-600">● Edited</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{product.sku || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={product.stockQuantity}
                          onChange={(e) => handleStockChange(product.id, 'stockQuantity', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={product.lowStockThreshold}
                          onChange={(e) => handleStockChange(product.id, 'lowStockThreshold', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.variants && product.variants.length > 0 ? (
                          <span className="text-sm text-slate-600">
                            {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Save Button */}
      {editedProducts.size > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
          >
            <Save size={20} />
            Save {editedProducts.size} Change{editedProducts.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
