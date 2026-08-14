import React, { useState, useEffect } from 'react';
import { Search, Eye, Truck, PackageCheck, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/format';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/orders');
      setOrders(data.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setIsUpdatingStatus(true);
      const { data } = await API.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      setSelectedOrder(data.data);
      setOrders(orders.map(o => o._id === orderId ? data.data : o));
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      toast.loading('Generating invoice...', { id: 'inv' });
      await API.post(`/invoices/generate/${orderId}`);
      toast.success('Invoice generated!', { id: 'inv' });
      
      // Refresh order to get invoice data
      const { data } = await API.get(`/orders/${orderId}`);
      setSelectedOrder(data.data);
      setOrders(orders.map(o => o._id === orderId ? data.data : o));
    } catch (error) {
      toast.error('Failed to generate invoice', { id: 'inv' });
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.includes(search) || o.customerDetails.name.toLowerCase().includes(search.toLowerCase()) || o.customerDetails.phone.includes(search);
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      Processing: 'bg-blue-100 text-blue-700 border border-blue-200',
      Dispatched: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      Delivered: 'bg-green-100 text-green-700 border border-green-200',
      Cancelled: 'bg-red-100 text-red-700 border border-red-200'
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Online Orders</h1>
        <p className="text-sm text-text-secondary">Manage customer orders and fulfillment</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order No, Name or Phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order No.</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order._id}>
                    <td className="font-bold text-primary">#{order.orderNumber}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>
                      <p className="font-medium text-text-primary">{order.customerDetails.name}</p>
                      <p className="text-xs text-text-secondary">{order.customerDetails.phone}</p>
                    </td>
                    <td className="font-medium text-text-primary">{formatCurrency(order.grandTotal)}</td>
                    <td>
                      <span className="uppercase text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded-md">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td className="text-right">
                      <button onClick={() => setSelectedOrder(order)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 ml-auto">
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-8 text-text-secondary">No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 lg:p-8 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 bg-gray-50 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                  Order #{selectedOrder.orderNumber}
                  {getStatusBadge(selectedOrder.status)}
                </h2>
                <p className="text-sm text-text-secondary mt-1">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-5 bg-gray-50/50">
                  <h3 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wider text-text-secondary">Customer Details</h3>
                  <p className="font-medium">{selectedOrder.customerDetails.name}</p>
                  <p className="text-sm text-text-secondary">{selectedOrder.customerDetails.phone}</p>
                  {selectedOrder.customerDetails.email && <p className="text-sm text-text-secondary">{selectedOrder.customerDetails.email}</p>}
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <h3 className="font-bold text-text-primary mb-2 text-sm uppercase tracking-wider text-text-secondary">Shipping Address</h3>
                    <p className="text-sm leading-relaxed">
                      {selectedOrder.shippingAddress.address}<br/>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                    </p>
                  </div>
                </div>

                <div className="card p-5 bg-gray-50/50">
                   <h3 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wider text-text-secondary">Payment & Invoice</h3>
                   <div className="space-y-2 text-sm">
                     <p className="flex justify-between"><span className="text-text-secondary">Method:</span> <span className="font-medium uppercase">{selectedOrder.paymentMethod}</span></p>
                     <p className="flex justify-between"><span className="text-text-secondary">Status:</span> <span className="font-medium">{selectedOrder.paymentStatus}</span></p>
                     {selectedOrder.gstin && <p className="flex justify-between"><span className="text-text-secondary">GSTIN:</span> <span className="font-medium uppercase">{selectedOrder.gstin}</span></p>}
                   </div>

                   <div className="mt-4 pt-4 border-t border-border">
                     {selectedOrder.invoice ? (
                       <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/invoices/${selectedOrder.invoice}/pdf`} target="_blank" rel="noopener noreferrer" className="text-primary font-medium text-sm hover:underline flex items-center gap-1">
                         Download Invoice PDF
                       </a>
                     ) : (
                       <button onClick={() => handleGenerateInvoice(selectedOrder._id)} className="text-primary font-medium text-sm hover:underline">
                         Generate Invoice Now
                       </button>
                     )}
                   </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wider text-text-secondary">Order Items</h3>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <p className="font-medium text-sm text-text-primary">{item.productSnapshot.name}</p>
                            {item.isCombo ? (
                              <span className="badge bg-primary-lighter text-primary text-[10px] mt-1">COMBO</span>
                            ) : (
                              <p className="text-xs text-text-secondary">SKU: {item.productSnapshot.sku} | Pack: {item.productSnapshot.packQuantity}</p>
                            )}
                          </td>
                          <td className="text-sm">{formatCurrency(item.price)}</td>
                          <td className="text-sm">{item.quantity}</td>
                          <td className="text-right font-medium text-sm">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-gray-50 p-4 border-t border-border">
                    <div className="w-64 ml-auto space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                      {selectedOrder.discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatCurrency(selectedOrder.discount)}</span></div>}
                      <div className="flex justify-between"><span className="text-text-secondary">Delivery</span><span>{formatCurrency(selectedOrder.deliveryCharge)}</span></div>
                      {selectedOrder.gstAmount > 0 && <div className="flex justify-between text-xs text-text-secondary pt-1 border-t border-border"><span>Includes GST</span><span>{formatCurrency(selectedOrder.gstAmount)}</span></div>}
                      <div className="flex justify-between font-bold text-base pt-2 border-t border-border mt-2"><span>Total</span><span className="text-primary">{formatCurrency(selectedOrder.grandTotal)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="p-5 border-t border-border bg-white flex justify-between items-center">
              <div className="flex gap-2">
                {selectedOrder.status === 'Pending' && (
                  <button disabled={isUpdatingStatus} onClick={() => handleUpdateStatus(selectedOrder._id, 'Processing')} className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    Accept & Process
                  </button>
                )}
                {selectedOrder.status === 'Processing' && (
                  <button disabled={isUpdatingStatus} onClick={() => handleUpdateStatus(selectedOrder._id, 'Dispatched')} className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Truck size={16}/> Mark Dispatched
                  </button>
                )}
                {selectedOrder.status === 'Dispatched' && (
                  <button disabled={isUpdatingStatus} onClick={() => handleUpdateStatus(selectedOrder._id, 'Delivered')} className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700">
                    <PackageCheck size={16}/> Mark Delivered
                  </button>
                )}
                {['Pending', 'Processing'].includes(selectedOrder.status) && (
                  <button disabled={isUpdatingStatus} onClick={() => {
                    const reason = window.prompt("Reason for cancellation:");
                    if(reason) {
                       API.put(`/orders/${selectedOrder._id}/status`, { status: 'Cancelled', cancellationReason: reason })
                         .then(res => {
                           toast.success('Order cancelled');
                           setSelectedOrder(res.data.data);
                           setOrders(orders.map(o => o._id === selectedOrder._id ? res.data.data : o));
                         })
                         .catch(err => toast.error('Failed to cancel order'));
                    }
                  }} className="btn-danger flex items-center gap-2">
                    <AlertCircle size={16}/> Cancel Order
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
