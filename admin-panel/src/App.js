import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Components
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import CombosPage from './pages/CombosPage';
import OrdersPage from './pages/OrdersPage';
import POSPage from './pages/POSPage';
import InvoicesPage from './pages/InvoicesPage';
import CustomersPage from './pages/CustomersPage';
import StockPage from './pages/StockPage';
import ReportsPage from './pages/ReportsPage';
import BannersPage from './pages/BannersPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role) && user?.role !== 'superAdmin') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        
        {/* Inventory Management */}
        <Route path="/products" element={<ProtectedRoute allowedRoles={['admin', 'inventoryManager']}><ProductsPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute allowedRoles={['admin', 'inventoryManager']}><CategoriesPage /></ProtectedRoute>} />
        <Route path="/combos" element={<ProtectedRoute allowedRoles={['admin', 'inventoryManager']}><CombosPage /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute allowedRoles={['admin', 'inventoryManager']}><StockPage /></ProtectedRoute>} />
        
        {/* Order & Sales */}
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['admin', 'orderManager']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute allowedRoles={['admin', 'posOperator']}><POSPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute allowedRoles={['admin', 'orderManager', 'posOperator']}><InvoicesPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin', 'orderManager']}><CustomersPage /></ProtectedRoute>} />
        
        {/* Reports & Settings */}
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/banners" element={<ProtectedRoute allowedRoles={['admin']}><BannersPage /></ProtectedRoute>} />
        
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-discount mb-4">403</h1>
              <p className="text-text-secondary mb-6">You don't have permission to access this page.</p>
              <button onClick={() => window.history.back()} className="btn-primary">Go Back</button>
            </div>
          </div>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
