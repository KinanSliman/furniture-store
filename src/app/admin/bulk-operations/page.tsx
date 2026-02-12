'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

export default function BulkOperationsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/products/export');

      if (!response.ok) {
        throw new Error('Failed to export products');
      }

      // Get the CSV content
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Products exported successfully!');
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Failed to export products');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import products');
      }

      const data = await response.json();
      setImportResult(data.results);

      if (data.results.failed === 0) {
        toast.success(`Successfully imported ${data.results.created + data.results.updated} products!`);
      } else {
        toast.warning(`Import completed with ${data.results.failed} errors`);
      }
    } catch (error: any) {
      console.error('Error importing products:', error);
      toast.error(error.message || 'Failed to import products');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `ID,Name,Slug,Description,Short Description,Price,Compare At Price,Cost Price,SKU,Barcode,Stock Quantity,Low Stock Threshold,Track Inventory,Weight,Weight Unit,Length,Width,Height,Dimension Unit,Is Active,Is Featured,Categories,Variants Count,Meta Title,Meta Description,Meta Keywords,Created At,Updated At
,Example Product,example-product,"Product description",Short description,29.99,39.99,15.00,SKU-001,123456789,100,10,true,0.5,kg,10,5,3,cm,true,false,"Category 1; Category 2",0,Example Product Meta,Example meta description,keyword1 keyword2,,`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Template downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk Operations</h1>
        <p className="text-slate-600 mt-1">Import and export products in bulk using CSV files</p>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Download size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Export Products</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-600 mb-4">
            Export all your products to a CSV file. You can then edit the file and re-import it to update products in bulk.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isExporting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={20} />
                Export Products to CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Upload size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Import Products</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Import Guidelines:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use the CSV template for correct formatting</li>
                  <li>Leave ID empty for new products, provide ID to update existing products</li>
                  <li>Required fields: Name, Price</li>
                  <li>Boolean fields: use "true" or "false"</li>
                  <li>Existing products will be updated based on ID or SKU</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet size={18} />
              Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload size={48} className="mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-600 mb-1">
                {selectedFile ? (
                  <span className="font-medium text-slate-900">{selectedFile.name}</span>
                ) : (
                  <>Click to select CSV file or drag and drop</>
                )}
              </p>
              <p className="text-xs text-slate-500">CSV files only</p>
            </label>
          </div>

          {selectedFile && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isImporting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Import Products
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Import Results</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-900">Created</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{importResult.created}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Updated</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{importResult.updated}</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={18} className="text-red-600" />
                  <span className="text-sm font-medium text-red-900">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-900">{importResult.failed}</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Errors:</h3>
                <ul className="space-y-1 text-sm text-red-800 max-h-60 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setImportResult(null);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Import Another File
              </button>
              <Link
                href="/admin/products"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Products
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Tips for Bulk Operations</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-purple-600">•</span>
            <span>Export your current products first to see the correct CSV format</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600">•</span>
            <span>Use spreadsheet software (Excel, Google Sheets) to edit the CSV file</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600">•</span>
            <span>Make sure to save the file as CSV format, not Excel format</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600">•</span>
            <span>Test with a small batch first before importing large datasets</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600">•</span>
            <span>Keep a backup of your data before performing bulk imports</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
