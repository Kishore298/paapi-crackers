import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home, AlertCircle, MessageCircle } from 'lucide-react';
import API from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/formatCurrency';

const OrderSuccessPage = ({ settings }) => {
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

  const whatsappNumber = settings?.website?.contactInfo?.whatsapp || settings?.business?.phone || '';
  const paymentPhone = settings?.business?.phone || whatsappNumber || '+91 00000 00000';

  // Build WhatsApp deep link
  const getWhatsAppLink = () => {
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const formattedNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    const message = encodeURIComponent(
      `Hi! I have completed the payment for Order #${order?.orderNumber}. Amount: ${formatCurrency(order?.grandTotal)}. Please find the payment screenshot attached.`
    );
    return `https://wa.me/${formattedNumber}?text=${message}`;
  };

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
      {/* Success Banner */}
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

      {/* Payment Section — Prominent */}
      <div className="card overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-5">
          <h2 className="text-white font-bold text-lg sm:text-xl flex items-center gap-2">
            💳 Complete Your Payment
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            Pay the total amount below via UPI to confirm your order
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {/* Amount to Pay */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-center">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-bold mb-1">Amount to Pay</p>
            <p className="text-4xl font-black text-primary">{formatCurrency(order.grandTotal)}</p>
          </div>

          {/* UPI Payment Details */}
          <div className="bg-white rounded-xl border border-border p-4 sm:p-5 mb-5 shadow-sm">
            <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wider font-bold mb-2">Pay to this Number via UPI</p>
            <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-wider mb-4">
              {paymentPhone}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center min-w-[70px] sm:min-w-[90px] h-10 sm:h-12">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-4 sm:h-5" />
              </div>
              <div className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center min-w-[70px] sm:min-w-[90px] h-10 sm:h-12">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-5 sm:h-6" />
              </div>
              <div className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center min-w-[70px] sm:min-w-[90px] h-10 sm:h-12">
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-3 sm:h-4" />
              </div>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="bg-yellow-50/80 border border-yellow-200 text-yellow-800 p-4 rounded-xl text-sm flex gap-3 items-start mb-5">
            <AlertCircle className="shrink-0 mt-0.5 w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-bold mb-1 text-yellow-900">Action Required!</p>
              <p>After completing the payment, please share the <strong>payment screenshot</strong> to our WhatsApp number <strong className="underline">{whatsappNumber || paymentPhone}</strong> so we can confirm and process your order immediately.</p>
            </div>
          </div>

          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-green-500/30"
          >
            <MessageCircle size={20} />
            Send Screenshot via WhatsApp
          </a>
        </div>
      </div>

      {/* Order & Shipping Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-lg border-b border-border pb-3 mb-4 flex items-center gap-2">
            <Package size={20} className="text-primary"/> Order Details
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-text-secondary">Order No.</span>
              <span className="font-medium text-text-primary">#{order.orderNumber}</span>
            </li>
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
