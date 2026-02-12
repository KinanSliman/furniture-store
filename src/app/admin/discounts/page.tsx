'use client';

import { useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  Loader2,
  Percent,
  DollarSign,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  value: string;
  minPurchase: string | null;
  maxUses: number | null;
  usesCount: number;
  maxUsesPerCustomer: number;
  applicableProductIds: any;
  applicableCategoryIds: any;
  firstTimeCustomerOnly: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y',
    value: '',
    minPurchase: '',
    maxUses: '',
    maxUsesPerCustomer: 1,
    firstTimeCustomerOnly: false,
    startsAt: '',
    expiresAt: '',
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/discounts?limit=100');

      if (!response.ok) {
        throw new Error('Failed to fetch discounts');
      }

      const data = await response.json();
      setDiscounts(data.discounts);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast.error('Failed to load discounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (discount?: Discount) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minPurchase: discount.minPurchase || '',
        maxUses: discount.maxUses?.toString() || '',
        maxUsesPerCustomer: discount.maxUsesPerCustomer,
        firstTimeCustomerOnly: discount.firstTimeCustomerOnly,
        startsAt: discount.startsAt ? new Date(discount.startsAt).toISOString().split('T')[0] : '',
        expiresAt: discount.expiresAt ? new Date(discount.expiresAt).toISOString().split('T')[0] : '',
        isActive: discount.isActive,
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: '',
        type: 'percentage',
        value: '',
        minPurchase: '',
        maxUses: '',
        maxUsesPerCustomer: 1,
        firstTimeCustomerOnly: false,
        startsAt: '',
        expiresAt: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDiscount(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingDiscount
        ? `/api/admin/discounts/${editingDiscount.id}`
        : '/api/admin/discounts';

      const method = editingDiscount ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save discount');
      }

      toast.success(editingDiscount ? 'Discount updated successfully!' : 'Discount created successfully!');
      handleCloseModal();
      fetchDiscounts();
    } catch (error: any) {
      console.error('Error saving discount:', error);
      toast.error(error.message || 'Failed to save discount');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete discount code "${code}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete discount');
      }

      toast.success('Discount deleted successfully');
      fetchDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error('Failed to delete discount');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update discount');
      }

      toast.success(`Discount ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchDiscounts();
    } catch (error) {
      console.error('Error updating discount:', error);
      toast.error('Failed to update discount');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      percentage: 'Percentage Off',
      fixed_amount: 'Fixed Amount',
      free_shipping: 'Free Shipping',
      buy_x_get_y: 'Buy X Get Y',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    if (type === 'percentage') return <Percent size={16} />;
    return <DollarSign size={16} />;
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Discount Codes</h1>
          <p className="text-slate-600 mt-1">Manage promotional codes and discounts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Create Discount
        </button>
      </div>

      {/* Discounts List */}
      <div className="bg-white rounded-xl border border-slate-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Tag size={64} className="mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold mb-2">No discount codes yet</h3>
            <p className="text-sm mb-4">Create your first discount code to boost sales</p>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Plus size={20} />
              Create Discount
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Type & Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Valid Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Tag size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-purple-600">{discount.code}</div>
                          {discount.firstTimeCustomerOnly && (
                            <span className="text-xs text-orange-600">First-time only</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(discount.type)}
                        <div>
                          <div className="font-medium text-slate-900">
                            {discount.type === 'percentage'
                              ? `${discount.value}% off`
                              : discount.type === 'fixed_amount'
                              ? formatCurrency(parseFloat(discount.value))
                              : getTypeLabel(discount.type)}
                          </div>
                          <div className="text-xs text-slate-500">{getTypeLabel(discount.type)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">
                          {discount.usesCount} {discount.maxUses ? `/ ${discount.maxUses}` : ''}
                        </div>
                        <div className="text-xs text-slate-500">
                          {discount.maxUses ? 'uses' : 'unlimited'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">
                        {discount.startsAt && (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            From {formatDate(discount.startsAt.toString())}
                          </div>
                        )}
                        {discount.expiresAt && (
                          <div className={`flex items-center gap-1 ${isExpired(discount.expiresAt) ? 'text-red-600' : ''}`}>
                            <Calendar size={12} />
                            {isExpired(discount.expiresAt) ? 'Expired' : 'Until'} {formatDate(discount.expiresAt.toString())}
                          </div>
                        )}
                        {!discount.startsAt && !discount.expiresAt && (
                          <span className="text-slate-400">No expiry</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(discount.id, discount.isActive)}
                        className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full transition-colors ${
                          discount.isActive && !isExpired(discount.expiresAt)
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        }`}
                      >
                        {discount.isActive && !isExpired(discount.expiresAt) ? (
                          <>
                            <Eye size={12} />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            {isExpired(discount.expiresAt) ? 'Expired' : 'Inactive'}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(discount)}
                          className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id, discount.code)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingDiscount ? 'Edit Discount' : 'Create Discount'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
                    Discount Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                    placeholder="SAVE20"
                  />
                  <p className="text-xs text-slate-500 mt-1">Will be automatically uppercased</p>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed_amount">Fixed Amount Off</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-slate-700 mb-1">
                    Value <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    {formData.type === 'percentage' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                    )}
                    {formData.type === 'fixed_amount' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    )}
                    <input
                      type="number"
                      id="value"
                      name="value"
                      value={formData.value}
                      onChange={handleChange}
                      required
                      step="0.01"
                      min="0"
                      max={formData.type === 'percentage' ? '100' : undefined}
                      className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        formData.type === 'fixed_amount' ? 'pl-8' : ''
                      }`}
                      placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                      disabled={formData.type === 'free_shipping'}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="minPurchase" className="block text-sm font-medium text-slate-700 mb-1">
                    Minimum Purchase
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      id="minPurchase"
                      name="minPurchase"
                      value={formData.minPurchase}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maxUses" className="block text-sm font-medium text-slate-700 mb-1">
                    Maximum Total Uses
                  </label>
                  <input
                    type="number"
                    id="maxUses"
                    name="maxUses"
                    value={formData.maxUses}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <label htmlFor="maxUsesPerCustomer" className="block text-sm font-medium text-slate-700 mb-1">
                    Max Uses Per Customer
                  </label>
                  <input
                    type="number"
                    id="maxUsesPerCustomer"
                    name="maxUsesPerCustomer"
                    value={formData.maxUsesPerCustomer}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startsAt" className="block text-sm font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startsAt"
                    name="startsAt"
                    value={formData.startsAt}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-slate-700 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    id="expiresAt"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="firstTimeCustomerOnly"
                    name="firstTimeCustomerOnly"
                    checked={formData.firstTimeCustomerOnly}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="firstTimeCustomerOnly" className="text-sm font-medium text-slate-700">
                    First-time customers only
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        {editingDiscount ? 'Update' : 'Create'} Discount
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
