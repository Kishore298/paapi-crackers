import React, { useState, useEffect } from 'react';
import { Search, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/format';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/invoices');
      setInvoices(data.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (invoiceId) => {
    window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/invoices/${invoiceId}/pdf`, '_blank');
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || 
    (inv.order?.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.customer?.name || inv.customerName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Invoices</h1>
        <p className="text-sm text-text-secondary">View and download generated invoices</p>
      </div>

      <div className="card p-4">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search by Invoice No, Order No, or Customer..." 
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
                  <th>Invoice No.</th>
                  <th>Date Generated</th>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>GST Details</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice._id}>
                    <td className="font-bold text-text-primary flex items-center gap-2">
                      <FileText size={16} className="text-primary"/> {invoice.invoiceNumber}
                    </td>
                    <td>{formatDateTime(invoice.createdAt)}</td>
                    <td className="font-mono text-sm">{invoice.order?.orderNumber || 'POS Order'}</td>
                    <td>
                      <p className="font-medium text-text-primary">{invoice.customer?.name || invoice.customerName}</p>
                      {invoice.gstin && <p className="text-[10px] text-text-secondary">GSTIN: {invoice.gstin}</p>}
                    </td>
                    <td className="font-bold text-primary">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="text-xs">
                       <p><span className="text-text-secondary">Rate:</span> {invoice.gstRate}%</p>
                       <p><span className="text-text-secondary">Tax:</span> {formatCurrency(invoice.totalGst)}</p>
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => handleDownloadPdf(invoice._id)} 
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 ml-auto"
                      >
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-8 text-text-secondary">No invoices found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;
