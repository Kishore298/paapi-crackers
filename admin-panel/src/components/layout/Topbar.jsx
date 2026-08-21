import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Store, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { requestFirebaseToken } from '../../firebase';
import useNotificationStore from '../../store/notificationStore';

const Topbar = ({ setMobileOpen }) => {
  const [onlineSalesEnabled, setOnlineSalesEnabled] = useState(true);
  const [permission, setPermission] = useState(Notification.permission);
  const unreadCount = useNotificationStore(state => state.unreadCount);

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

  const handleEnablePush = async () => {
    try {
      const token = await requestFirebaseToken();
      if (token) {
        await API.put('/auth/fcm-token', { fcmToken: token });
        setPermission('granted');
        toast.success('Admin push notifications enabled!');
      } else {
        setPermission(Notification.permission);
        if (Notification.permission === 'denied') {
          toast.error('Notifications are blocked by your browser.');
        } else {
          toast.error('Failed to enable push notifications.');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred.');
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
        {permission !== 'granted' && (
          <button 
            onClick={handleEnablePush}
            className="hidden sm:flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 text-sm font-medium transition-colors"
          >
            <Smartphone size={16} /> Enable Push
          </button>
        )}

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

        <Link to="/notifications" className="p-2 text-text-secondary hover:bg-gray-100 rounded-xl relative transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-discount rounded-full border-2 border-white"></span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
