'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Store, Globe, DollarSign, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Settings {
  // Store Information
  storeName?: string;
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: string;
  storeCity?: string;
  storeState?: string;
  storePostalCode?: string;
  storeCountry?: string;

  // Regional Settings
  currency?: string;
  currencySymbol?: string;
  timezone?: string;
  weightUnit?: string;
  dimensionUnit?: string;

  // Tax Settings
  defaultTaxRate?: number;
  taxInclusive?: boolean;
  displayPricesWithTax?: boolean;

  // Email Settings
  emailFromName?: string;
  emailFromAddress?: string;
  emailReplyTo?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    storeAddress: '',
    storeCity: '',
    storeState: '',
    storePostalCode: '',
    storeCountry: 'US',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/New_York',
    weightUnit: 'kg',
    dimensionUnit: 'cm',
    defaultTaxRate: 0,
    taxInclusive: false,
    displayPricesWithTax: false,
    emailFromName: '',
    emailFromAddress: '',
    emailReplyTo: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings((prev) => ({ ...prev, ...data.settings }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setSettings((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'store', label: 'Store Information', icon: Store },
    { id: 'regional', label: 'Regional', icon: Globe },
    { id: 'tax', label: 'Tax', icon: DollarSign },
    { id: 'email', label: 'Email', icon: Mail },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your store configuration</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Store Information Tab */}
        {activeTab === 'store' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Store Information</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="storeName" className="block text-sm font-medium text-slate-700 mb-1">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={settings.storeName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="My Awesome Store"
                  />
                </div>

                <div>
                  <label htmlFor="storeEmail" className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="storeEmail"
                    name="storeEmail"
                    value={settings.storeEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="storePhone" className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="storePhone"
                  name="storePhone"
                  value={settings.storePhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="storeAddress" className="block text-sm font-medium text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  id="storeAddress"
                  name="storeAddress"
                  value={settings.storeAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="storeCity" className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="storeCity"
                    name="storeCity"
                    value={settings.storeCity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label htmlFor="storeState" className="block text-sm font-medium text-slate-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="storeState"
                    name="storeState"
                    value={settings.storeState}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label htmlFor="storePostalCode" className="block text-sm font-medium text-slate-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="storePostalCode"
                    name="storePostalCode"
                    value={settings.storePostalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10001"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="storeCountry" className="block text-sm font-medium text-slate-700 mb-1">
                  Country
                </label>
                <select
                  id="storeCountry"
                  name="storeCountry"
                  value={settings.storeCountry}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                  <option value="JP">Japan</option>
                  <option value="CN">China</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Regional Settings Tab */}
        {activeTab === 'regional' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Regional Settings</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="currencySymbol" className="block text-sm font-medium text-slate-700 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    id="currencySymbol"
                    name="currencySymbol"
                    value={settings.currencySymbol}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="$"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-1">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weightUnit" className="block text-sm font-medium text-slate-700 mb-1">
                    Weight Unit
                  </label>
                  <select
                    id="weightUnit"
                    name="weightUnit"
                    value={settings.weightUnit}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lb">Pounds (lb)</option>
                    <option value="g">Grams (g)</option>
                    <option value="oz">Ounces (oz)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dimensionUnit" className="block text-sm font-medium text-slate-700 mb-1">
                    Dimension Unit
                  </label>
                  <select
                    id="dimensionUnit"
                    name="dimensionUnit"
                    value={settings.dimensionUnit}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="cm">Centimeters (cm)</option>
                    <option value="m">Meters (m)</option>
                    <option value="in">Inches (in)</option>
                    <option value="ft">Feet (ft)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tax Settings Tab */}
        {activeTab === 'tax' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tax Settings</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="defaultTaxRate" className="block text-sm font-medium text-slate-700 mb-1">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  id="defaultTaxRate"
                  name="defaultTaxRate"
                  value={settings.defaultTaxRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="8.00"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter the tax rate as a percentage (e.g., 8.5 for 8.5%)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="taxInclusive"
                    name="taxInclusive"
                    checked={settings.taxInclusive}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="taxInclusive" className="text-sm font-medium text-slate-700">
                    Prices include tax
                  </label>
                </div>
                <p className="text-xs text-slate-500 ml-6">
                  Product prices already include tax (tax-inclusive pricing)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="displayPricesWithTax"
                    name="displayPricesWithTax"
                    checked={settings.displayPricesWithTax}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="displayPricesWithTax" className="text-sm font-medium text-slate-700">
                    Display prices with tax on storefront
                  </label>
                </div>
                <p className="text-xs text-slate-500 ml-6">
                  Show tax-inclusive prices to customers in the store
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Email Settings</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="emailFromName" className="block text-sm font-medium text-slate-700 mb-1">
                  From Name
                </label>
                <input
                  type="text"
                  id="emailFromName"
                  name="emailFromName"
                  value={settings.emailFromName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="My Store"
                />
                <p className="text-xs text-slate-500 mt-1">
                  The name that appears in the "From" field of emails
                </p>
              </div>

              <div>
                <label htmlFor="emailFromAddress" className="block text-sm font-medium text-slate-700 mb-1">
                  From Email Address
                </label>
                <input
                  type="email"
                  id="emailFromAddress"
                  name="emailFromAddress"
                  value={settings.emailFromAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="noreply@example.com"
                />
                <p className="text-xs text-slate-500 mt-1">
                  The email address that emails are sent from
                </p>
              </div>

              <div>
                <label htmlFor="emailReplyTo" className="block text-sm font-medium text-slate-700 mb-1">
                  Reply-To Email Address
                </label>
                <input
                  type="email"
                  id="emailReplyTo"
                  name="emailReplyTo"
                  value={settings.emailReplyTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="support@example.com"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Where customer replies should be sent
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
