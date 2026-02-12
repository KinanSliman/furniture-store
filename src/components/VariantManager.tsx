'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Package } from 'lucide-react';
import { toast } from 'sonner';

interface VariantAttribute {
  [key: string]: string; // e.g., { "size": "Large", "color": "Red" }
}

interface Variant {
  id?: string;
  name: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  attributes: VariantAttribute;
  isActive: boolean;
  displayOrder: number;
}

interface VariantManagerProps {
  productId?: string; // Optional: if editing existing product
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  basePrice?: number; // Product base price for reference
}

export default function VariantManager({
  productId,
  variants,
  onVariantsChange,
  basePrice,
}: VariantManagerProps) {
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Variant>({
    name: '',
    sku: '',
    price: undefined,
    compareAtPrice: undefined,
    costPrice: undefined,
    stockQuantity: 0,
    imageUrl: '',
    attributes: {},
    isActive: true,
    displayOrder: 0,
  });
  const [attributeKey, setAttributeKey] = useState('');
  const [attributeValue, setAttributeValue] = useState('');

  const handleAddAttribute = () => {
    if (!attributeKey.trim() || !attributeValue.trim()) {
      toast.error('Please enter both attribute name and value');
      return;
    }

    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        [attributeKey.toLowerCase()]: attributeValue,
      },
    });

    setAttributeKey('');
    setAttributeValue('');
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...formData.attributes };
    delete newAttributes[key];
    setFormData({ ...formData, attributes: newAttributes });
  };

  const handleSaveVariant = () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Variant name is required');
      return;
    }

    if (Object.keys(formData.attributes).length === 0) {
      toast.error('At least one attribute is required');
      return;
    }

    if (editingIndex !== null) {
      // Update existing variant
      const updatedVariants = [...variants];
      updatedVariants[editingIndex] = formData;
      onVariantsChange(updatedVariants);
      toast.success('Variant updated');
    } else {
      // Add new variant
      onVariantsChange([...variants, { ...formData, displayOrder: variants.length }]);
      toast.success('Variant added');
    }

    // Reset form
    setFormData({
      name: '',
      sku: '',
      price: undefined,
      compareAtPrice: undefined,
      costPrice: undefined,
      stockQuantity: 0,
      imageUrl: '',
      attributes: {},
      isActive: true,
      displayOrder: 0,
    });
    setIsAddingVariant(false);
    setEditingIndex(null);
  };

  const handleEditVariant = (index: number) => {
    setFormData(variants[index]);
    setEditingIndex(index);
    setIsAddingVariant(true);
  };

  const handleDeleteVariant = (index: number) => {
    if (confirm('Are you sure you want to delete this variant?')) {
      const updatedVariants = variants.filter((_, i) => i !== index);
      onVariantsChange(updatedVariants);
      toast.success('Variant deleted');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      sku: '',
      price: undefined,
      compareAtPrice: undefined,
      costPrice: undefined,
      stockQuantity: 0,
      imageUrl: '',
      attributes: {},
      isActive: true,
      displayOrder: 0,
    });
    setIsAddingVariant(false);
    setEditingIndex(null);
    setAttributeKey('');
    setAttributeValue('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Product Variants</h3>
          <p className="text-sm text-slate-600 mt-1">
            Add variants like size, color, or material with different prices and stock
          </p>
        </div>
        {!isAddingVariant && (
          <button
            type="button"
            onClick={() => setIsAddingVariant(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} />
            Add Variant
          </button>
        )}
      </div>

      {/* Variant List */}
      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="bg-slate-50 border border-slate-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-slate-900">{variant.name}</h4>
                    {!variant.isActive && (
                      <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">
                        Inactive
                      </span>
                    )}
                    {variant.sku && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        SKU: {variant.sku}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Price:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {variant.price ? `$${parseFloat(variant.price.toString()).toFixed(2)}` :
                         basePrice ? `$${parseFloat(basePrice.toString()).toFixed(2)} (base)` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Stock:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {variant.stockQuantity} units
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-600">Attributes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleEditVariant(index)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVariant(index)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {variants.length === 0 && !isAddingVariant && (
        <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
          <Package size={48} className="mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 mb-4">No variants added yet</p>
          <button
            type="button"
            onClick={() => setIsAddingVariant(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} />
            Add First Variant
          </button>
        </div>
      )}

      {/* Add/Edit Variant Form */}
      {isAddingVariant && (
        <div className="bg-white border-2 border-purple-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">
              {editingIndex !== null ? 'Edit Variant' : 'Add New Variant'}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Variant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Large - Red"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SKU (Optional)
              </label>
              <input
                type="text"
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g., PROD-L-RED"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price (Override)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder={basePrice ? `Default: $${basePrice}` : 'Enter price'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Attributes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Variant Attributes <span className="text-red-500">*</span>
            </label>

            {/* Current Attributes */}
            {Object.keys(formData.attributes).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(formData.attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full"
                  >
                    <span className="text-sm font-medium">{key}:</span>
                    <span className="text-sm">{value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(key)}
                      className="hover:text-purple-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Attribute */}
            <div className="flex gap-2">
              <input
                type="text"
                value={attributeKey}
                onChange={(e) => setAttributeKey(e.target.value)}
                placeholder="Attribute name (e.g., size, color)"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="text"
                value={attributeValue}
                onChange={(e) => setAttributeValue(e.target.value)}
                placeholder="Value (e.g., Large, Red)"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSaveVariant}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Save size={18} />
              {editingIndex !== null ? 'Update Variant' : 'Save Variant'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
