import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ShoppingCart, FileText, Shield, Truck, RotateCcw, Bell } from 'lucide-react';

const MobileMenu = ({ open, onClose, navLinks, settings }) => {
  const location = useLocation();

  if (!open) return null;

  const secondaryLinks = [
    { to: '/my-orders', label: 'My Orders', icon: FileText },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/terms', label: 'Terms & Conditions', icon: FileText },
    { to: '/privacy-policy', label: 'Privacy Policy', icon: Shield },
    { to: '/shipping-policy', label: 'Shipping Policy', icon: Truck },
    { to: '/cancellation-policy', label: 'Cancellation Policy', icon: RotateCcw },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Menu panel */}
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto"
        style={{ animation: 'slideInFromRight 0.3s ease-out' }}>
        
        <div className="p-4 flex items-center justify-between border-b border-border">
          <span className="text-lg font-bold text-text-primary">
            {settings?.business?.name || 'Menu'}
          </span>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-50 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === link.to
                  ? 'bg-primary-lighter text-primary'
                  : 'text-text-secondary hover:bg-gray-50'
              }`}
            >
              {link.icon && <link.icon size={18} />}
              {link.label}
            </Link>
          ))}

          <Link
            to="/cart"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-50 transition-all"
          >
            <ShoppingCart size={18} />
            Cart
          </Link>
        </div>

        <div className="border-t border-border mx-4" />

        <div className="p-4 space-y-1">
          {secondaryLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-secondary hover:bg-gray-50 transition-all"
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default MobileMenu;
