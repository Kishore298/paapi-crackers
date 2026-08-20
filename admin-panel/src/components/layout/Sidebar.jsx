import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Grid, Layers,
  ShoppingCart, FileText, Users,
  BarChart3, Image, LogOut, X, Shield, Box, Settings
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuGroups = [
    {
      title: 'Main',
      items: [
        { title: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['superAdmin', 'admin', 'inventoryManager', 'orderManager', 'posOperator'] },
      ]
    },
    {
      title: 'Inventory',
      items: [
        { title: 'Products', icon: Package, path: '/products', roles: ['superAdmin', 'admin', 'inventoryManager'] },
        { title: 'Categories', icon: Grid, path: '/categories', roles: ['superAdmin', 'admin', 'inventoryManager'] },
        { title: 'Combos', icon: Layers, path: '/combos', roles: ['superAdmin', 'admin', 'inventoryManager'] },
        { title: 'Stock Manager', icon: Box, path: '/stock', roles: ['superAdmin', 'admin', 'inventoryManager'] },
      ]
    },
    {
      title: 'Sales & Orders',
      items: [
        { title: 'Online Orders', icon: ShoppingCart, path: '/orders', roles: ['superAdmin', 'admin', 'orderManager'] },
        { title: 'POS Billing', icon: Shield, path: '/pos', roles: ['superAdmin', 'admin', 'posOperator'] },
        { title: 'Customers', icon: Users, path: '/customers', roles: ['superAdmin', 'admin', 'orderManager'] },
      ]
    },
    {
      title: 'Admin',
      items: [
        { title: 'Reports', icon: BarChart3, path: '/reports', roles: ['superAdmin', 'admin'] },
        { title: 'Banners', icon: Image, path: '/banners', roles: ['superAdmin', 'admin'] },
        { title: 'Settings', icon: Settings, path: '/settings', roles: ['superAdmin', 'admin'] },
      ]
    }
  ];

  const hasAccess = (roles) => {
    if (user?.role === 'superAdmin') return true;
    return roles.includes(user?.role);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-background-sidebar text-white">
      {/* Logo */}
      <div className="h-24 py-4 flex items-center justify-between px-6 border-b border-gray-800">
        <img src="/paapi-logo.png" alt="Paapi Admin" className="h-16 object-contain" />
        <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {menuGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => hasAccess(item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="mb-6 px-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                {group.title}
              </p>
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                        {item.title}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/10 bg-white/5 mx-4 mb-4 rounded-xl mt-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen fixed top-0 left-0 z-40 shadow-xl">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-64 transform transition-transform duration-300 ease-in-out shadow-2xl ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {SidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
