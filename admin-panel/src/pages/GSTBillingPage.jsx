import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, X, User, Printer, Eye, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/format';

const GSTBillingPage = () => {
  const [activeView, setActiveView] = useState('billing'); // 'billing' or 'history'
  
  // Products Search
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Cart State
  const [cart, setCart] = useState([]); 
  
  // Manual Item Entry State
  const [manualItem, setManualItem] = useState({ name: '', rate: '', quantity: 1 });

  // Customer State
  const [customerInfo, setCustomerInfo] = useState({
    name: '', phone: '', address: '', city: '', state: '', pincode: '', gstin: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState(null);

  // History State
  const [sales, setSales] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Business State (for IGST vs CGST/SGST preview)
  const [businessState, setBusinessState] = useState('Tamil Nadu'); // Default, though backend calculates exactly.

  useEffect(() => {
    if (activeView === 'history') {
      fetchHistory();
    }
    // Fetch business state for preview calculation
    API.get('/settings').then(res => {
      if (res.data?.data?.business?.state) {
        setBusinessState(res.data.data.business.state);
      }
    }).catch(() => {});
  }, [activeView]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      API.get(`/products?active=true&search=${search}&limit=10`)
        .then(res => {
          setSearchResults(res.data.data);
        })
        .finally(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await API.get('/invoices', { params: { type: 'gst', limit: 100 } });
      setSales(data.data);
    } catch (error) {
      toast.error('Failed to load GST invoices');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      toast.loading('Downloading PDF...', { id: 'pdf' });
      const response = await API.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GST-Invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Downloaded!', { id: 'pdf' });
    } catch (err) {
      toast.error('Failed to download PDF', { id: 'pdf' });
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      toast.loading('Opening PDF...', { id: 'pdf' });
      const response = await API.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      toast.success('Opened!', { id: 'pdf' });
    } catch (err) {
      toast.error('Failed to open PDF', { id: 'pdf' });
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product._id);
      if (existing) {
        return prev.map(item => 
          item.id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: product._id, 
        name: product.name, 
        rate: product.discountPrice || product.mrp, 
        quantity: 1 
      }];
    });
    setSearch('');
    setSearchResults([]);
  };

  const addManualItem = () => {
    if (!manualItem.name || !manualItem.rate) return toast.error('Name and Rate required');
    setCart(prev => [...prev, {
      id: 'manual_' + Date.now(),
      name: manualItem.name,
      rate: Number(manualItem.rate),
      quantity: Number(manualItem.quantity) || 1
    }]);
    setManualItem({ name: '', rate: '', quantity: 1 });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateRate = (id, newRate) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, rate: Number(newRate) };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Preview Calculations (18% GST)
  const taxableAmount = cart.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  const isIntra = !customerInfo.state || customerInfo.state.toLowerCase().trim() === businessState.toLowerCase().trim();
  const cgstAmount = isIntra ? (taxableAmount * 0.09) : 0;
  const sgstAmount = isIntra ? (taxableAmount * 0.09) : 0;
  const igstAmount = !isIntra ? (taxableAmount * 0.18) : 0;
  const grandTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('No items added');
    if (!customerInfo.name) return toast.error('Customer Name is required');

    try {
      setIsProcessing(true);
      
      const payload = {
        customerDetails: customerInfo,
        items: cart.map(item => ({
          name: item.name,
          rate: item.rate,
          quantity: item.quantity
        }))
      };

      const { data } = await API.post('/invoices/standalone-gst', payload);
      const invoiceId = data.data._id;
      
      setLastInvoiceId(invoiceId);
      toast.success('GST Invoice generated successfully!');
      
      // Reset
      setCart([]);
      setCustomerInfo({ name: '', phone: '', address: '', city: '', state: '', pincode: '', gstin: '' });
      setManualItem({ name: '', rate: '', quantity: 1 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invoice generation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredHistory = sales.filter(sale => {
    const custName = sale.customerSnapshot?.name || '';
    const custGst = sale.customerSnapshot?.gstin || '';
    const invNum = sale.invoiceNumber || '';
    return custName.toLowerCase().includes(historySearch.toLowerCase()) || 
           invNum.toLowerCase().includes(historySearch.toLowerCase()) ||
           custGst.toLowerCase().includes(historySearch.toLowerCase());
  });

  if (activeView === 'history') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">GST Invoices</h1>
            <p className="text-sm text-text-secondary">View and manage generated GST invoices</p>
          </div>
          <button onClick={() => setActiveView('billing')} className="btn-primary flex items-center gap-2 px-4 py-2">
            <Plus size={18} />
            New GST Invoice
          </button>
        </div>

        <div className="card p-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search by Invoice No, Customer Name, or GSTIN..." 
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {historyLoading ? (
            <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : (
            <div className="table-container">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    <th className="p-3 text-sm font-semibold text-text-secondary">Invoice No</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Date</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Customer</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">GSTIN/URP</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Taxable</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Tax</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Total</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan="8" className="p-8 text-center text-text-secondary">No GST invoices found.</td></tr>
                  ) : (
                    filteredHistory.map((invoice) => (
                      <tr key={invoice._id} className="border-b border-border hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium text-text-primary">{invoice.invoiceNumber}</td>
                        <td className="p-3 text-sm">{formatDateTime(invoice.createdAt)}</td>
                        <td className="p-3 text-sm">{invoice.customerSnapshot?.name}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium uppercase bg-gray-100 text-gray-700">
                            {invoice.customerSnapshot?.gstin || 'URP'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">{formatCurrency(invoice.taxableAmount)}</td>
                        <td className="p-3 text-sm text-text-secondary">{formatCurrency(invoice.totalTax)}</td>
                        <td className="p-3 font-semibold">{formatCurrency(invoice.grandTotal)}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleViewInvoice(invoice._id)} className="p-1.5 text-secondary hover:bg-secondary/10 rounded" title="View PDF">
                              <Eye size={18} />
                            </button>
                            <button onClick={() => handleDownloadInvoice(invoice._id)} className="p-1.5 text-primary hover:bg-primary/10 rounded" title="Download PDF">
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-border">
        <h2 className="font-bold text-lg text-text-primary flex items-center gap-2"><FileText size={20} className="text-primary" /> GST Billing Terminal</h2>
        <button onClick={() => setActiveView('history')} className="btn-secondary text-sm py-1.5 px-4">
          View History
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
        
        {/* Left: Product & Customer */}
        <div className="flex-[1.5] lg:flex-1 flex flex-col gap-4 min-h-0">
          
          {/* Success Message */}
          {lastInvoiceId && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex justify-between items-center shrink-0">
              <span className="text-green-800 text-sm font-medium">GST Invoice Generated Successfully</span>
              <div className="flex gap-2">
                <button onClick={() => handleDownloadInvoice(lastInvoiceId)} className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded hover:bg-green-50">Download</button>
                <button onClick={() => handleViewInvoice(lastInvoiceId)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">View PDF</button>
                <button onClick={() => setLastInvoiceId(null)} className="text-xs text-gray-500 hover:text-gray-700 ml-2"><X size={16}/></button>
              </div>
            </div>
          )}

          {/* Customer Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-4 shrink-0">
            <h3 className="font-bold text-sm text-text-primary mb-3 uppercase tracking-wide flex items-center gap-2"><User size={16}/> Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Customer / Business Name *" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="input-field text-sm py-2" />
              <input type="text" placeholder="Phone Number" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="input-field text-sm py-2" />
              <input type="text" placeholder="GSTIN (Optional)" value={customerInfo.gstin} onChange={e => setCustomerInfo({...customerInfo, gstin: e.target.value.toUpperCase()})} className="input-field text-sm py-2 uppercase" />
              <input type="text" placeholder="State (e.g., Tamil Nadu)" value={customerInfo.state} onChange={e => setCustomerInfo({...customerInfo, state: e.target.value})} className="input-field text-sm py-2" />
              <div className="md:col-span-2 flex gap-3">
                <input type="text" placeholder="Address" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} className="input-field text-sm py-2 flex-1" />
                <input type="text" placeholder="City" value={customerInfo.city} onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})} className="input-field text-sm py-2 w-32" />
                <input type="text" placeholder="Pincode" value={customerInfo.pincode} onChange={e => setCustomerInfo({...customerInfo, pincode: e.target.value})} className="input-field text-sm py-2 w-24" />
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-2 text-right">If GSTIN is empty, "URP" will be printed on invoice.</p>
          </div>

          {/* Product Entry */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-4 flex flex-col flex-1 min-h-[300px]">
            <h3 className="font-bold text-sm text-text-primary mb-3 uppercase tracking-wide">Add Items</h3>
            
            <div className="flex gap-2 mb-4 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input 
                  type="text" 
                  placeholder="Search existing products..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10 text-sm py-2 w-full"
                />
                
                {search && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
                    {isSearching ? <div className="p-3 text-sm text-center text-text-secondary">Searching...</div> : 
                     searchResults.length === 0 ? <div className="p-3 text-sm text-center text-text-secondary">No products found</div> :
                     searchResults.map(p => (
                       <button key={p._id} onClick={() => addToCart(p)} className="w-full text-left p-2 hover:bg-gray-50 border-b border-border last:border-0 flex justify-between">
                         <span className="text-sm font-medium">{p.name}</span>
                         <span className="text-sm text-primary font-bold">{formatCurrency(p.discountPrice || p.mrp)}</span>
                       </button>
                     ))
                    }
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 my-2 shrink-0">
              <div className="h-px bg-border flex-1"></div>
              <span className="text-xs text-text-secondary uppercase font-medium">OR Add Custom Item</span>
              <div className="h-px bg-border flex-1"></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4 shrink-0">
              <input type="text" placeholder="Custom Item Name" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} className="input-field text-sm py-2 flex-1" />
              <input type="number" placeholder="Rate (Rs)" value={manualItem.rate} onChange={e => setManualItem({...manualItem, rate: e.target.value})} className="input-field text-sm py-2 w-full sm:w-28" />
              <input type="number" placeholder="Qty" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: e.target.value})} className="input-field text-sm py-2 w-full sm:w-20" />
              <button onClick={addManualItem} className="btn-secondary whitespace-nowrap"><Plus size={16}/> Add</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50 rounded-xl border border-border p-2">
               {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   <p className="text-sm">No items added to invoice.</p>
                 </div>
               ) : (
                 <div className="space-y-2">
                   {cart.map((item, index) => (
                     <div key={item.id + index} className="bg-white p-3 rounded-lg border border-border flex flex-col gap-2 relative group">
                       <button onClick={() => removeFromCart(item.id)} className="absolute right-2 top-2 text-gray-400 hover:text-discount p-1"><X size={16}/></button>
                       <div className="pr-6 font-medium text-sm">{item.name}</div>
                       <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-text-secondary">Rate:</span>
                           <input type="number" value={item.rate} onChange={(e) => updateRate(item.id, e.target.value)} className="w-20 px-2 py-1 text-sm border border-border rounded focus:border-primary outline-none" />
                           <span className="text-xs text-text-secondary ml-2">Qty:</span>
                           <div className="flex items-center border border-border rounded">
                             <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 hover:bg-gray-50 text-gray-500"><Minus size={12}/></button>
                             <span className="w-8 text-center text-sm">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 hover:bg-gray-50 text-gray-500"><Plus size={12}/></button>
                           </div>
                         </div>
                         <div className="font-bold text-sm text-primary">
                           {formatCurrency(item.rate * item.quantity)}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right: Tax Calculation & Checkout */}
        <div className="flex-none w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-gray-50">
            <h2 className="font-bold text-lg">GST Summary</h2>
            <p className="text-xs text-text-secondary mt-1">Based on Customer State: <span className="font-medium text-text-primary">{customerInfo.state || 'Not Set (Assumes Intra-state)'}</span></p>
          </div>

          <div className="flex-1 p-5 space-y-4 text-sm bg-gray-50/50">
            <div className="flex justify-between">
              <span className="text-text-secondary">Total Taxable Value</span>
              <span className="font-medium">{formatCurrency(taxableAmount)}</span>
            </div>
            
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">GST Rate</span>
                <span className="font-medium">18%</span>
              </div>
              
              {isIntra ? (
                <>
                  <div className="flex justify-between text-text-secondary">
                    <span>CGST (9%)</span>
                    <span>{formatCurrency(cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>SGST (9%)</span>
                    <span>{formatCurrency(sgstAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-text-secondary">
                  <span>IGST (18%)</span>
                  <span>{formatCurrency(igstAmount)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border p-5 bg-white">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg">Grand Total</span>
              <span className="font-bold text-2xl text-primary">{formatCurrency(grandTotal)}</span>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="btn-primary w-full py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2"
            >
              {isProcessing ? 'Generating...' : <><Printer size={18}/> Generate GST Invoice</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSTBillingPage;
