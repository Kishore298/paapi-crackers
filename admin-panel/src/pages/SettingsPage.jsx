import React, { useState, useEffect } from 'react';
import { Settings, Save, ShoppingBag, Truck, Percent, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await API.get('/settings');
      setSettings(data.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await API.put('/settings', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!settings) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Global Settings</h1>
          <p className="text-sm text-text-secondary">Configure store behaviour, limits, and business details</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
          <Save size={18} /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core Store Settings */}
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
            <ShoppingBag size={20} className="text-primary"/> Store Configuration
          </h2>
          
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer border border-border hover:border-primary/30 transition-colors">
            <div>
              <span className="font-bold text-text-primary block">Accept Online Orders</span>
              <span className="text-xs text-text-secondary">Toggle checkout availability for customers</span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.onlineSalesEnabled ? 'bg-success' : 'bg-gray-300'}`}>
              <input type="checkbox" checked={settings.onlineSalesEnabled} onChange={e => setSettings({...settings, onlineSalesEnabled: e.target.checked})} className="sr-only" />
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.onlineSalesEnabled ? 'left-7' : 'left-1'}`}></div>
            </div>
          </label>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-text-primary">Order Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Min Order Amount (₹)</label>
                <input type="number" value={settings.orders.minOrderAmount ?? ''} onChange={e => handleChange('orders', 'minOrderAmount', e.target.value === '' ? '' : Number(e.target.value))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Max Order Amount (₹)</label>
                <input type="number" value={settings.orders.maxOrderAmount ?? ''} onChange={e => handleChange('orders', 'maxOrderAmount', e.target.value === '' ? '' : Number(e.target.value))} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Configuration */}
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
            <Percent size={20} className="text-primary"/> Pricing & Discounts
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Global Discount (%)</label>
            <p className="text-xs text-text-secondary mb-3">This discount percentage will be applied automatically to all products during checkout.</p>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={settings.pricing?.globalDiscount ?? 0} 
              onChange={e => handleChange('pricing', 'globalDiscount', e.target.value === '' ? 0 : Number(e.target.value))} 
              className="input-field" 
              placeholder="e.g. 50"
            />
          </div>
        </div>

        {/* GST Configuration */}
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
            <Percent size={20} className="text-primary"/> Pricing & Discounts
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Global Discount Percentage (%)</label>
            <p className="text-xs text-text-secondary mb-2">This discount is automatically applied to all products' MRP to calculate the discount price.</p>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              max="100"
              value={settings.pricing?.globalDiscount ?? ''} 
              onChange={e => handleChange('pricing', 'globalDiscount', e.target.value === '' ? '' : Number(e.target.value))} 
              className="input-field max-w-xs font-bold text-lg" 
            />
          </div>
        </div>

        {/* GST Configuration */}
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
            <Percent size={20} className="text-primary"/> GST Configuration
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Global GST Rate (%)</label>
            <p className="text-xs text-text-secondary mb-2">Applied to all products and combos for invoice generation (usually 18% for fireworks)</p>
            <input 
              type="number" 
              step="0.01" 
              value={settings.gst.defaultRate ?? ''} 
              onChange={e => handleChange('gst', 'defaultRate', e.target.value === '' ? '' : Number(e.target.value))} 
              className="input-field max-w-xs font-bold text-lg" 
            />
          </div>

          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
            <input type="checkbox" checked={settings.gst.isPriceInclusive} onChange={e => handleChange('gst', 'isPriceInclusive', e.target.checked)} className="w-4 h-4 text-primary rounded" />
            <div>
              <span className="font-medium text-sm text-text-primary block">Prices are GST Inclusive</span>
              <span className="text-xs text-text-secondary">If checked, GST is backed out of the selling price for invoices.</span>
            </div>
          </label>
        </div>

        {/* Delivery Settings */}
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
            <Truck size={20} className="text-primary"/> Delivery Settings
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Standard Delivery Charge (₹)</label>
              <input type="number" value={settings.delivery.deliveryCharge ?? ''} onChange={e => handleChange('delivery', 'deliveryCharge', e.target.value === '' ? '' : Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Free Delivery Threshold (₹)</label>
              <input type="number" value={settings.delivery.freeDeliveryThreshold ?? ''} onChange={e => handleChange('delivery', 'freeDeliveryThreshold', e.target.value === '' ? '' : Number(e.target.value))} className="input-field" placeholder="0 = disabled" />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card p-6 space-y-6">
           <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
            <CreditCard size={20} className="text-primary"/> Payment Methods
          </h2>
          <div className="space-y-3">
             <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input type="checkbox" checked={settings.payments?.cash?.enabled || false} onChange={e => setSettings({...settings, payments: {...settings.payments, cash: { enabled: e.target.checked } }})} className="w-4 h-4 text-primary rounded" />
              <span className="font-medium text-sm text-text-primary block">Cash on Delivery / Pay at Store</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input type="checkbox" checked={settings.payments?.otherUpi?.enabled || false} onChange={e => setSettings({...settings, payments: {...settings.payments, otherUpi: { ...settings.payments?.otherUpi, enabled: e.target.checked } }})} className="w-4 h-4 text-primary rounded" />
              <span className="font-medium text-sm text-text-primary block">UPI / Online Transfer</span>
            </label>
          </div>
        </div>

        {/* Business Details */}
        <div className="card p-6 lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 border-b border-border pb-3">
            <Settings size={20} className="text-primary"/> Business Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Business Name</label>
                <input type="text" value={settings.business.name} onChange={e => handleChange('business', 'name', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Contact Phone</label>
                <input type="text" value={settings.business.phone} onChange={e => handleChange('business', 'phone', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Contact Email</label>
                <input type="email" value={settings.business.email} onChange={e => handleChange('business', 'email', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">GSTIN Number</label>
                <input type="text" value={settings.business.gstin} onChange={e => handleChange('business', 'gstin', e.target.value)} className="input-field uppercase" />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-text-primary mb-1">Registered Address</label>
                <textarea rows={2} value={settings.business.address} onChange={e => handleChange('business', 'address', e.target.value)} className="input-field resize-none"></textarea>
              </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default SettingsPage;
