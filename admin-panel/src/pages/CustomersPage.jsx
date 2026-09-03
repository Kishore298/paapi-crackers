import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Download, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency, formatDate } from '../utils/format';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', gstin: '' });
  const [submitting, setSubmitting] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/customers?search=${encodeURIComponent(search)}`);
      setCustomers(data.data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = async (id) => {
    try {
      setSelectedCustomer(id);
      setDetailsLoading(true);
      const { data } = await API.get(`/customers/${id}`);
      setCustomerDetails(data.data);
    } catch (error) {
      toast.error('Failed to load customer details');
      setSelectedCustomer(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Source', 'Total Orders', 'Total Value'];
    const csvContent = [
      headers.join(','),
      ...customers.map(c => [
        `"${c.name || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.email || ''}"`,
        `"${c.source === 'admin' ? 'By Admin' : 'Website'}"`,
        c.totalOrders || 0,
        c.totalSpending || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const { data } = await API.post('/customers', formData);
      toast.success('Customer added successfully');
      setCustomers([data.data, ...customers]);
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', gstin: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Customers</h1>
          <p className="text-sm text-text-secondary">View customer database and their value</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
            <Download size={18} /> Export CSV
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <ShoppingBag size={18} /> Add Customer
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search by Name, Phone, or Email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer Details</th>
                  <th>Contact</th>
                  <th>Source</th>
                  <th>Total Orders</th>
                  <th>Total Value</th>
                  <th>Joined On</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-lighter text-primary flex items-center justify-center font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{customer.name}</p>
                          {customer.gstin && <span className="badge bg-gray-100 text-[10px] mt-0.5">B2B: {customer.gstin}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm">{customer.phone}</p>
                      <p className="text-xs text-text-secondary">{customer.email || '-'}</p>
                    </td>
                    <td>
                      <span className={`badge ${customer.source === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {customer.source === 'admin' ? 'By Admin' : 'Website'}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1">
                        <ShoppingBag size={14} className="text-text-secondary"/>
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="font-bold text-primary">{formatCurrency(customer.totalSpending || 0)}</td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td className="text-right">
                      <button 
                        onClick={() => handleViewCustomer(customer._id)} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-8 text-text-secondary">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">Add New Customer</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Phone Number *</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Email (Optional)</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">GSTIN (Optional)</label>
                <input type="text" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} className="input-field uppercase" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-text-primary">Customer Details</h2>
              <button onClick={() => { setSelectedCustomer(null); setCustomerDetails(null); }} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {detailsLoading || !customerDetails ? (
                <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 p-4 rounded-xl border border-border">
                      <h3 className="font-bold text-text-primary mb-4 text-lg">Profile</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-text-secondary w-24 inline-block">Name:</span> <span className="font-medium text-gray-900">{customerDetails.name}</span></p>
                        <p><span className="text-text-secondary w-24 inline-block">Phone:</span> <span className="font-medium text-gray-900">{customerDetails.phone}</span></p>
                        <p><span className="text-text-secondary w-24 inline-block">Email:</span> <span className="font-medium text-gray-900">{customerDetails.email || '-'}</span></p>
                        <p><span className="text-text-secondary w-24 inline-block">GSTIN:</span> <span className="font-medium text-gray-900">{customerDetails.gstin || '-'}</span></p>
                      </div>
                    </div>
                    <div className="bg-primary-lighter/30 p-4 rounded-xl border border-primary-lighter">
                      <h3 className="font-bold text-text-primary mb-4 text-lg">Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-text-secondary">Total Orders</p>
                          <p className="text-xl font-bold text-gray-900">{customerDetails.totalOrders}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">Total Spending</p>
                          <p className="text-xl font-bold text-primary">{formatCurrency(customerDetails.totalSpending || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-text-primary mb-4 text-lg">Online Order History</h3>
                    {customerDetails.orders && customerDetails.orders.length > 0 ? (
                      <div className="table-container border border-border rounded-xl">
                        <table className="table w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-left">
                              <th className="p-3 font-medium text-text-secondary">Order ID</th>
                              <th className="p-3 font-medium text-text-secondary">Date</th>
                              <th className="p-3 font-medium text-text-secondary">Items</th>
                              <th className="p-3 font-medium text-text-secondary">Total</th>
                              <th className="p-3 font-medium text-text-secondary">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDetails.orders.map(order => (
                              <tr key={order._id} className="border-t border-border">
                                <td className="p-3 font-medium text-gray-900">{order.orderNumber}</td>
                                <td className="p-3 text-gray-600">{formatDate(order.createdAt)}</td>
                                <td className="p-3 text-gray-600">{order.items?.length || 0} items</td>
                                <td className="p-3 font-medium text-gray-900">{formatCurrency(order.grandTotal)}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                    order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'Dispatched' ? 'bg-green-100 text-green-700' :
                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-text-secondary text-sm">No online orders found.</p>
                    )}
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="font-bold text-text-primary mb-4 text-lg">POS Sales History</h3>
                    {customerDetails.posSales && customerDetails.posSales.length > 0 ? (
                      <div className="table-container border border-border rounded-xl">
                        <table className="table w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-left">
                              <th className="p-3 font-medium text-text-secondary">Receipt No</th>
                              <th className="p-3 font-medium text-text-secondary">Date</th>
                              <th className="p-3 font-medium text-text-secondary">Items</th>
                              <th className="p-3 font-medium text-text-secondary">Total</th>
                              <th className="p-3 font-medium text-text-secondary">Payment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDetails.posSales.map(sale => (
                              <tr key={sale._id} className="border-t border-border">
                                <td className="p-3 font-medium text-gray-900">{sale.receiptNumber}</td>
                                <td className="p-3 text-gray-600">{formatDate(sale.createdAt)}</td>
                                <td className="p-3 text-gray-600">{sale.items?.length || 0} items</td>
                                <td className="p-3 font-medium text-gray-900">{formatCurrency(sale.grandTotal)}</td>
                                <td className="p-3">
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold uppercase">
                                    {sale.paymentMethod}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-text-secondary text-sm">No POS sales found.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
