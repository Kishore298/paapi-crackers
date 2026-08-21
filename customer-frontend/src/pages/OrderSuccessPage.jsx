import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import API from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/formatCurrency';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await API.get(`/orders/${orderId}`);
        setOrder(data.data);
      } catch (error) {
        console.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-discount mb-4">Order Not Found</h2>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home size={18} /> Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="card p-8 text-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-success"></div>
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-success" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Order Confirmed!</h1>
        <p className="text-text-secondary mb-6">
          Thank you for your purchase. Your order <span className="font-bold text-text-primary">#{order.orderNumber}</span> has been received.
        </p>
        <div className="inline-flex flex-col sm:flex-row items-center gap-3">
          <Link to={`/order/${order.orderNumber}`} className="btn-primary w-full sm:w-auto">
            Track Order
          </Link>
          <Link to="/" className="btn-outline w-full sm:w-auto inline-flex justify-center items-center gap-2">
            Continue Shopping <ArrowRight size={18}/>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-lg border-b border-border pb-3 mb-4 flex items-center gap-2">
            <Package size={20} className="text-primary"/> Order Details
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-text-secondary">Date</span>
              <span className="font-medium text-text-primary">{formatDateTime(order.createdAt)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-text-secondary">Payment Method</span>
              <span className="font-medium text-text-primary uppercase">{order.paymentMethod}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-text-secondary">Total Amount</span>
              <span className="font-bold text-primary">{formatCurrency(order.grandTotal)}</span>
            </li>
          </ul>
        </div>

        <div className="card p-6">
           <h3 className="font-bold text-lg border-b border-border pb-3 mb-4 text-text-primary">Shipping Address</h3>
           <div className="text-sm text-text-secondary space-y-1">
             <p className="font-medium text-text-primary">{order.customerDetails.name}</p>
             <p>{order.customerDetails.phone}</p>
             <p className="mt-2">{order.shippingAddress.address}</p>
             <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
