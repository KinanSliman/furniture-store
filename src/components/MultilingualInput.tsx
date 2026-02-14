'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface MultilingualInputProps {
  label: string;
  nameEn: string;
  nameAr: string;
  valueEn: string;
  valueAr: string;
  onChange: (field: string, value: string) => void;
  type?: 'text' | 'textarea';
  required?: boolean;
  placeholder?: string;
  rows?: number;
  error?: string;
}

export default function MultilingualInput({
  label,
  nameEn,
  nameAr,
  valueEn,
  valueAr,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  rows = 4,
  error,
}: MultilingualInputProps) {
  const [activeTab, setActiveTab] = useState<'en' | 'ar'>('en');
  const t = useTranslations('common');

  const inputClass = `
    w-full px-4 py-2 border rounded-lg
    focus:ring-2 focus:ring-purple-500 focus:border-purple-500
    ${error ? 'border-red-500' : 'border-slate-300'}
    ${activeTab === 'ar' ? 'text-right' : 'text-left'}
  `;

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Language Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('en')}
          className={`
            px-4 py-2 text-sm font-medium transition-colors
            ${
              activeTab === 'en'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          🇬🇧 English
          {valueEn && (
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full ml-2" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ar')}
          className={`
            px-4 py-2 text-sm font-medium transition-colors
            ${
              activeTab === 'ar'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          🇸🇦 العربية
          {valueAr && (
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full ml-2" />
          )}
        </button>
      </div>

      {/* Input Fields */}
      <div className="relative">
        {/* English Input */}
        {activeTab === 'en' && (
          <div>
            {type === 'text' ? (
              <input
                type="text"
                name={nameEn}
                value={valueEn}
                onChange={(e) => onChange(nameEn, e.target.value)}
                className={inputClass}
                placeholder={placeholder}
                required={required && !valueAr} // Required if no Arabic value
              />
            ) : (
              <textarea
                name={nameEn}
                value={valueEn}
                onChange={(e) => onChange(nameEn, e.target.value)}
                className={inputClass}
                placeholder={placeholder}
                rows={rows}
                required={required && !valueAr}
              />
            )}
          </div>
        )}

        {/* Arabic Input */}
        {activeTab === 'ar' && (
          <div dir="rtl">
            {type === 'text' ? (
              <input
                type="text"
                name={nameAr}
                value={valueAr}
                onChange={(e) => onChange(nameAr, e.target.value)}
                className={inputClass}
                placeholder={placeholder}
                required={required && !valueEn}
              />
            ) : (
              <textarea
                name={nameAr}
                value={valueAr}
                onChange={(e) => onChange(nameAr, e.target.value)}
                className={inputClass}
                placeholder={placeholder}
                rows={rows}
                required={required && !valueEn}
              />
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {activeTab === 'en' ? 'English version' : 'النسخة العربية'}
        </span>
        {required && (
          <span>
            At least one language is required
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
