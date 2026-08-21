import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Download, FileText } from 'lucide-react';
import API from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/formatCurrency';
import { STATUS_COLORS, API_BASE_URL } from '../utils/constants';

const OrderDetailsPage = () => {
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
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!order) {
    return <div className="text-center py-20">Order not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/my-orders" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to My Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Order #{order.orderNumber}
            <span className={STATUS_COLORS[order.status]}>{order.status}</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        
        {order.invoice && (
          <a 
            href={`${API_BASE_URL}/invoices/${order.invoice.invoiceNumber}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline inline-flex items-center justify-center gap-2 h-10"
          >
            <Download size={16} /> Download Invoice
          </a>
        )}
      </div>

      {order.status === 'Cancelled' && order.cancellationReason && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6">
          <p className="font-semibold text-sm mb-1">Cancellation Reason:</p>
          <p className="text-sm">{order.cancellationReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Shipping details */}
        <div className="card p-5 md:col-span-1">
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2"><MapPin size={18} className="text-primary"/> Delivery To</h3>
          <p className="font-medium text-sm text-text-primary">{order.customerDetails.name}</p>
          <p className="text-sm text-text-secondary mt-1">{order.customerDetails.phone}</p>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            {order.shippingAddress.address}<br/>
            {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
          </p>
        </div>

        {/* Payment details */}
        <div className="card p-5 md:col-span-1">
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2"><CreditCard size={18} className="text-primary"/> Payment Info</h3>
          <p className="text-sm text-text-secondary mb-1">Method: <span className="font-medium text-text-primary uppercase">{order.paymentMethod}</span></p>
          <p className="text-sm text-text-secondary">Status: <span className={`font-medium ${order.paymentStatus === 'Completed' ? 'text-success' : 'text-yellow-600'}`}>{order.paymentStatus}</span></p>
          
          {order.gstin && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-secondary mb-1">GSTIN</p>
              <p className="text-sm font-medium uppercase">{order.gstin}</p>
            </div>
          )}
        </div>

        {/* Order tracking minimal */}
        <div className="card p-5 md:col-span-1">
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2"><Package size={18} className="text-primary"/> Status</h3>
          <div className="relative pl-6 space-y-4 before:absolute before:inset-y-2 before:left-2.5 before:w-0.5 before:bg-gray-200">
             <div className="relative">
                <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-primary-lighter"></div>
                <p className="text-sm font-medium">Order Placed</p>
                <p className="text-[10px] text-text-secondary">{formatDateTime(order.createdAt)}</p>
             </div>
             {order.status === 'Dispatched' && (
               <div className="relative">
                <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-success ring-4 ring-green-100"></div>
                <p className="text-sm font-medium">Dispatched</p>
                <p className="text-[10px] text-text-secondary">Your order is on the way</p>
             </div>
             )}
             {order.status === 'Cancelled' && (
               <div className="relative">
                <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-discount ring-4 ring-red-100"></div>
                <p className="text-sm font-medium text-discount">Cancelled</p>
             </div>
             )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h3 className="font-bold text-lg p-5 bg-gray-50 border-b border-border flex items-center gap-2">
           <FileText size={20} className="text-primary"/> Items in Order
        </h3>
        <div className="divide-y divide-border">
          {order.items.map((item, idx) => (
            <div key={idx} className="p-4 sm:p-5 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {item.productSnapshot?.image ? (
                  <img src={item.productSnapshot.image} alt={item.productSnapshot.name} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-text-secondary">Image</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-primary text-sm line-clamp-1">{item.productSnapshot.name}</h4>
                {item.isCombo ? (
                  <span className="inline-block mt-1 badge bg-primary-lighter text-primary text-[9px]">COMBO</span>
                ) : (
                  <p className="text-xs text-text-secondary mt-0.5">{item.productSnapshot.sku} · Pack: {item.productSnapshot.packQuantity}</p>
                )}
              </div>
              <div className="text-right">
                {item.discount > 0 && item.price < (item.price + (item.discount/item.quantity)) ? (
                  <div className="flex flex-col items-end">
                    <p className="font-bold text-text-primary">{formatCurrency(item.price)} <span className="text-xs text-text-secondary font-normal">x{item.quantity}</span></p>
                    <span className="text-[10px] text-text-secondary line-through">{formatCurrency(item.price + (item.discount/item.quantity))}</span>
                  </div>
                ) : (
                  <p className="font-bold text-text-primary">{formatCurrency(item.price)} <span className="text-xs text-text-secondary font-normal">x{item.quantity}</span></p>
                )}
                <p className="text-sm font-bold text-primary mt-1">{formatCurrency(item.total)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-5 border-t border-border">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>Delivery Charge</span>
              <span>{order.deliveryCharge === 0 ? 'Free' : formatCurrency(order.deliveryCharge)}</span>
            </div>
            {order.gstAmount > 0 && (
              <div className="flex justify-between text-text-secondary text-xs mt-2 border-t border-gray-200 pt-2">
                <span>Includes GST</span>
                <span>{formatCurrency(order.gstAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold text-text-primary border-t border-gray-200 mt-2 pt-3">
              <span>Grand Total</span>
              <span className="text-primary">{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
