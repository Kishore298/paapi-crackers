import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, Bell, Store, User, LogOut, Package, Phone } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useNotificationStore from '../../store/notificationStore';
import useAuthStore from '../../store/authStore';
import MobileMenu from './MobileMenu';

const Navbar = ({ settings }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { unreadCount } = useNotificationStore();
  const { customer, clearCustomer } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearCustomer();
    setProfileOpen(false);
    navigate('/');
  };

  const businessName = settings?.business?.name || 'Paapi Crackers';
  const logo = settings?.business?.logo?.url || '/paapi-logo.png';

  const navLinks = [
    { to: '/', label: 'Shop', icon: Store },
    { to: '/contact', label: 'Contact Us', icon: Phone },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left - Logo + Business Name */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <img src={logo} alt={businessName} className="h-14 object-contain" />
              <span className="text-lg font-bold text-text-primary hidden sm:block">{businessName}</span>
            </Link>

            {/* Center - Nav Links (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-primary-lighter text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right - Notifications + Cart + Mobile Menu */}
            <div className="flex items-center gap-2">
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-discount text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-all"
              >
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {customer ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-all"
                  >
                    <User size={20} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-border py-2 z-50">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-bold text-text-primary truncate">{customer.name}</p>
                        <p className="text-xs text-text-secondary truncate">{customer.phone}</p>
                      </div>
                      <Link
                        to="/my-orders"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-colors"
                      >
                        <Package size={16} /> My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-discount hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-all"
                >
                  <User size={20} />
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-all"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navLinks={navLinks}
        settings={settings}
      />
    </>
  );
};

export default Navbar;
