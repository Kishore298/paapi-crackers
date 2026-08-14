import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { io } from 'socket.io-client';
import API from './api/axios';
import useAuthStore from './store/authStore';
import useNotificationStore from './store/notificationStore';
import { SOCKET_URL } from './utils/constants';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import NotificationsPage from './pages/NotificationsPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ShippingPolicyPage from './pages/ShippingPolicyPage';
import CancellationPolicyPage from './pages/CancellationPolicyPage';
import OnlineOrdersClosedPage from './pages/OnlineOrdersClosedPage';

function App() {
  const [onlineSalesEnabled, setOnlineSalesEnabled] = useState(true);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { customer } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Fetch public settings
    const fetchSettings = async () => {
      try {
        const { data } = await API.get('/settings/public');
        setSettings(data.data);
        setOnlineSalesEnabled(data.data.onlineSalesEnabled);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();

    // Socket.IO connection
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      if (customer?._id) {
        socket.emit('join', { customerId: customer._id });
      }
    });

    socket.on('notification', (notification) => {
      addNotification(notification);
    });

    socket.on('online-sales-status', ({ enabled }) => {
      setOnlineSalesEnabled(enabled);
    });

    return () => {
      socket.disconnect();
    };
  }, [customer, addNotification]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // If online sales are OFF, show only the closed page
  if (!onlineSalesEnabled) {
    return (
      <Router>
        <Toaster position="top-center" />
        <Routes>
          <Route path="*" element={<OnlineOrdersClosedPage settings={settings} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{
        style: { borderRadius: '12px', background: '#fff', color: '#18181B', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
        success: { iconTheme: { primary: '#159447', secondary: '#fff' } },
        error: { iconTheme: { primary: '#E83E6F', secondary: '#fff' } },
      }} />
      <Layout settings={settings}>
        <Routes>
          <Route path="/" element={<HomePage settings={settings} />} />
          <Route path="/cart" element={<CartPage settings={settings} />} />
          <Route path="/checkout" element={<CheckoutPage settings={settings} />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/order/:orderId" element={<OrderDetailsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/about" element={<AboutUsPage settings={settings} />} />
          <Route path="/contact" element={<ContactUsPage settings={settings} />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
