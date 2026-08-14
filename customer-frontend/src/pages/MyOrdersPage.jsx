import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, User } from 'lucide-react';
import useAuthStore from '../store/authStore';
import API from '../api/axios';
import { formatCurrency, formatDate } from '../utils/formatCurrency';
import { STATUS_COLORS } from '../utils/constants';

const MyOrdersPage = () => {
  const { customer, setCustomer } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [identifyForm, setIdentifyForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (customer?._id) {
      fetchOrders(customer._id);
    }
  }, [customer]);

  const fetchOrders = async (customerId) => {
    try {
      setLoading(true);
      const { data } = await API.get(`/orders/customer/${customerId}`);
      setOrders(data.data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentify = async (e) => {
    e.preventDefault();
    if (!identifyForm.name || !identifyForm.phone) return;
    
    try {
      setLoading(true);
      const { data } = await API.post('/customers/identify', identifyForm);
      setCustomer(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={30} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Track Your Orders</h2>
          <p className="text-text-secondary text-sm mb-6">Enter your details used during checkout to view your order history.</p>
          
          <form onSubmit={handleIdentify} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
              <input type="text" value={identifyForm.name} onChange={e => setIdentifyForm({...identifyForm, name: e.target.value})} className="input-field" placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Phone Number</label>
              <input type="tel" value={identifyForm.phone} onChange={e => setIdentifyForm({...identifyForm, phone: e.target.value})} className="input-field" placeholder="10-digit number" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Verifying...' : 'View Orders'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Orders</h1>
          <p className="text-sm text-text-secondary">Welcome back, {customer.name}</p>
        </div>
        <button onClick={() => setCustomer(null)} className="text-sm font-medium text-discount hover:underline">
          Not {customer.name}?
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 card">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No orders found</h3>
          <p className="text-text-secondary mt-1 mb-6">You haven't placed any orders yet.</p>
          <Link to="/" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order._id} to={`/order/${order._id}`} className="block card p-5 hover:shadow-card-hover transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-text-primary">#{order.orderNumber}</span>
                    <span className={STATUS_COLORS[order.status]}>{order.status}</span>
                  </div>
                  <p className="text-sm text-text-secondary">Placed on {formatDate(order.createdAt)} · {order.items.length} items</p>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-text-secondary">Total</p>
                    <p className="font-bold text-primary text-lg">{formatCurrency(order.grandTotal)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary group-hover:bg-primary-lighter group-hover:text-primary transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
