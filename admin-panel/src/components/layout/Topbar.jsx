import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Store } from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const Topbar = ({ setMobileOpen }) => {
  const [onlineSalesEnabled, setOnlineSalesEnabled] = useState(true);

  useEffect(() => {
    API.get('/settings').then(res => setOnlineSalesEnabled(res.data.data.onlineSalesEnabled)).catch(() => {});
  }, []);

  const toggleOnlineSales = async (e) => {
    const newValue = e.target.checked;
    setOnlineSalesEnabled(newValue);
    try {
      await API.put('/settings', { onlineSalesEnabled: newValue });
      toast.success(newValue ? 'Online orders opened' : 'Online orders closed');
    } catch (error) {
      setOnlineSalesEnabled(!newValue);
      toast.error('Failed to update status');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 -ml-2 text-text-secondary hover:bg-gray-100 rounded-xl transition-colors"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>

        {/* Optional Search */}
        <div className="hidden sm:flex items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all w-64">
          <Search size={16} className="text-text-secondary mr-2" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-full text-text-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-xl border border-border">
          <Store size={16} className={onlineSalesEnabled ? 'text-success' : 'text-text-secondary'} />
          <span className="text-sm font-medium text-text-primary hidden md:block">
            {onlineSalesEnabled ? 'Store Open' : 'Store Closed'}
          </span>
          <div className={`w-8 h-4 rounded-full transition-colors relative ml-1 ${onlineSalesEnabled ? 'bg-success' : 'bg-gray-300'}`}>
            <input type="checkbox" checked={onlineSalesEnabled} onChange={toggleOnlineSales} className="sr-only" />
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${onlineSalesEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} style={{ transform: onlineSalesEnabled ? 'translateX(18px)' : 'translateX(2px)' }}></div>
          </div>
        </label>

        <button className="p-2 text-text-secondary hover:bg-gray-100 rounded-xl relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-discount rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
