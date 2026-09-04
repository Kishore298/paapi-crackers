import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Eye, Download, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/format';

const CameraScanner = ({ onScan, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 100 },
      fps: 5,
    }, false);

    scanner.render((text) => {
      scanner.clear();
      onScan(text);
    }, (error) => {
      // Ignore scan errors
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-text-primary">Scan Barcode</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
        </div>
        <div className="p-4">
          <div id="reader" className="w-full"></div>
          <p className="text-xs text-center text-text-secondary mt-4">Point the camera at the product barcode.</p>
        </div>
      </div>
    </div>
  );
};

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [searchQuantities, setSearchQuantities] = useState({});

  // Cart State
  const [cart, setCart] = useState([]); // { product, quantity }
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [manualDiscount, setManualDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState(null);

  const [activeView, setActiveView] = useState('history'); // 'history' | 'billing'

  // History State
  const [sales, setSales] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (activeView === 'history') {
      fetchSales();
    }
  }, [activeView]);

  const fetchSales = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await API.get('/pos/sales', { params: { limit: 100 } });
      setSales(data.data);
    } catch (error) {
      toast.error('Failed to load POS sales');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceData) => {
    try {
      const invoiceId = typeof invoiceData === 'object' ? invoiceData._id : invoiceData;
      if (!invoiceId) return toast.error('No invoice available');
      toast.loading('Downloading PDF...', { id: 'pdf' });
      const response = await API.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Downloaded!', { id: 'pdf' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to download PDF', { id: 'pdf' });
    }
  };

  const handleViewInvoice = async (invoiceData) => {
    try {
      const invoiceId = typeof invoiceData === 'object' ? invoiceData._id : invoiceData;
      if (!invoiceId) return toast.error('No invoice available');
      toast.loading('Opening PDF...', { id: 'pdf' });
      const response = await API.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      toast.success('Opened!', { id: 'pdf' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to open PDF', { id: 'pdf' });
    }
  };

  const handleGenerateInvoice = async (orderId, type) => {
    try {
      toast.loading('Generating invoice...', { id: 'gen-inv' });
      await API.post('/invoices/generate', { posSaleId: orderId, type });
      toast.success('Invoice generated successfully', { id: 'gen-inv' });
      fetchSales(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate invoice', { id: 'gen-inv' });
    }
  };

  const handleCancelSale = async (saleId) => {
    const reason = window.prompt("Enter reason for cancellation:");
    if (reason === null) return; // User cancelled the prompt

    try {
      toast.loading('Cancelling sale...', { id: 'cancel-sale' });
      await API.put(`/pos/sales/${saleId}/cancel`, { reason: reason || 'Cancelled by admin' });
      toast.success('Sale cancelled successfully', { id: 'cancel-sale' });
      fetchSales(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel sale', { id: 'cancel-sale' });
    }
  };

  const filteredSales = sales.filter(s => {
    const term = historySearch.toLowerCase();
    const matchesSearch = s.billNumber.toLowerCase().includes(term) ||
      (s.customerName || '').toLowerCase().includes(term) ||
      (s.customerPhone || '').includes(term) ||
      (s.customerEmail || '').toLowerCase().includes(term) ||
      (s.invoice?.invoiceNumber || '').toLowerCase().includes(term);
    const matchesPayment = paymentFilter ? s.paymentMethod === paymentFilter : true;
    return matchesSearch && matchesPayment;
  });

  useEffect(() => {
    if (activeView === 'billing') {
      fetchProducts();
    }
  }, [activeView]);

  const fetchProducts = async () => {
    try {
      const productRes = await API.get('/products?active=true&limit=1000');
      setProducts(productRes.data.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const filteredProducts = search.trim().length > 0 ? products.filter(p => {
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
  }) : [];

  const addToCart = (product, qty = 1) => {
    if (product.stock <= 0) return toast.error('Product is out of stock');

    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        if (existing.quantity + qty > product.stock) {
          toast.error('Maximum stock reached');
          return prev;
        }
        return prev.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    setSearch(''); // clear search after adding
    setSearchQuantities(prev => {
      const next = {...prev};
      delete next[product._id];
      return next;
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product._id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item; // Handled by remove
        if (newQty > item.product.stock) {
          toast.error('Maximum stock reached');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product._id !== productId));
  };

  const handleCameraScan = async (decodedText) => {
    setIsCameraOpen(false);
    try {
      const { data } = await API.get(`/products/lookup/${decodedText.trim()}`);
      if (data.data) {
        addToCart(data.data);
        toast.success(`Added ${data.data.name}`);
      }
    } catch (error) {
      toast.error('Product not found for scanned barcode');
    }
  };

  const handlePhoneBlur = async () => {
    if (customerInfo.phone && customerInfo.phone.length >= 10) {
      try {
        const { data } = await API.get(`/customers/search?phone=${customerInfo.phone}`);
        if (data.data && data.data.length > 0) {
          const cust = data.data[0];
          setCustomerInfo(prev => ({
            ...prev,
            name: cust.name || prev.name
          }));
          toast.success('Customer found');
        }
      } catch (error) {
        // Not found is fine
      }
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.discountPrice || item.product.mrp) * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - (Number(manualDiscount) || 0));

  const handleCheckout = async (invoiceType) => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!customerInfo.name || !customerInfo.phone) return toast.error('Customer Name and Phone are required for billing');

    try {
      setIsProcessing(true);

      const payload = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: cart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity
        })),
        paymentMethod: paymentMethod,
        billType: invoiceType,
        manualDiscount: Number(manualDiscount) || 0
      };

      const saleRes = await API.post('/pos/sale', payload);
      const posSaleId = saleRes.data.data._id;

      const invoiceRes = await API.post('/invoices/generate', {
        posSaleId,
        type: invoiceType,
        customerDetails: customerInfo
      });
      const invoiceId = invoiceRes.data.data._id;

      setLastInvoiceId(invoiceId);
      toast.success('Sale & Invoice completed successfully!');

      // Reset
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
      setManualDiscount(0);
      setPaymentMethod('cash');
      fetchProducts(); // Refresh stock

    } catch (error) {
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadLastInvoice = async () => {
    try {
      toast.loading('Downloading PDF...', { id: 'pdf' });
      const response = await API.get(`/invoices/${lastInvoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${lastInvoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Downloaded!', { id: 'pdf' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download PDF', { id: 'pdf' });
    }
  };

  const handleViewLastInvoice = async () => {
    try {
      toast.loading('Opening PDF...', { id: 'pdf' });
      const response = await API.get(`/invoices/${lastInvoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      toast.success('Opened!', { id: 'pdf' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to open PDF', { id: 'pdf' });
    }
  };

  if (activeView === 'history') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">POS Sales History</h1>
            <p className="text-sm text-text-secondary">Track and manage Point of Sale transactions</p>
          </div>
          <button onClick={() => setActiveView('billing')} className="btn-primary flex items-center gap-2 px-4 py-2">
            <Plus size={18} />
            New POS Sale
          </button>
        </div>

        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search by Bill No, Name, or Phone..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Payments</option>
                <option value="cash">Cash</option>
                <option value="gpay">Google Pay</option>
                <option value="phonepe">PhonePe</option>
                <option value="paytm">Paytm</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {historyLoading ? (
            <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : (
            <div className="table-container">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    <th className="p-3 text-sm font-semibold text-text-secondary">Bill No</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Date</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Customer</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Items</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Payment</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary">Total</th>
                    <th className="p-3 text-sm font-semibold text-text-secondary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-text-secondary">
                        No POS sales found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale._id} className="border-b border-border hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="font-medium text-text-primary">{sale.billNumber}</div>
                          <div className="text-xs text-text-secondary uppercase">{sale.billType} Bill</div>
                          {sale.status === 'Cancelled' && (
                            <span className="inline-block mt-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">CANCELLED</span>
                          )}
                        </td>
                        <td className="p-3 text-sm">{formatDateTime(sale.createdAt)}</td>
                        <td className="p-3">
                          <div className="text-sm font-medium">{sale.customerName || 'Walk-in Customer'}</div>
                          {sale.customerPhone && <div className="text-xs text-text-secondary">{sale.customerPhone}</div>}
                        </td>
                        <td className="p-3 text-sm">{sale.items?.length || 0} items</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium uppercase bg-gray-100 text-gray-700">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">{formatCurrency(sale.grandTotal)}</td>
                        <td className="p-3 text-right">
                          {sale.invoice ? (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewInvoice(sale.invoice)}
                                  className="p-1.5 text-secondary hover:bg-secondary/10 rounded transition-colors"
                                  title="View Invoice"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => handleDownloadInvoice(sale.invoice)}
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                                  title="Download Invoice"
                                >
                                  <Download size={18} />
                                </button>
                              </div>
                              {sale.invoice.type === 'normal' && (
                                <span className="text-[10px] text-green-600">Generated</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-gray-400 mb-1">No Invoice</span>
                              {sale.status !== 'Cancelled' && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleGenerateInvoice(sale._id, 'normal')} className="text-xs text-primary hover:underline">Gen Std</button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {sale.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleCancelSale(sale._id)}
                              className="mt-2 text-[10px] text-red-600 hover:underline block w-full text-right"
                            >
                              Cancel Bill
                            </button>
                          )}
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
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-6rem)]">
      {lastInvoiceId && (
        <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-sm">
          <span className="text-green-800 text-sm font-medium">Last Sale Completed Successfully</span>
          <div className="flex gap-2">
            <button onClick={handleDownloadLastInvoice} className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded hover:bg-green-50">Download PDF</button>
            <button onClick={handleViewLastInvoice} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">View PDF</button>
            <button onClick={() => setLastInvoiceId(null)} className="text-xs text-gray-500 hover:text-gray-700 ml-2"><X size={16}/></button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Column: Search and Cart */}
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          
          {/* Search Products Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-5 shrink-0">
            <h3 className="font-bold text-lg mb-4 text-text-primary">Search Products</h3>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="text"
                  placeholder="Search by product name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10 w-full"
                />
                
                {/* Search Dropdown / Results */}
                {search.trim().length > 0 && (
                  <div className="absolute top-full -left-2 -right-12 sm:left-0 sm:right-0 mt-2 bg-white border border-border rounded-xl shadow-xl max-h-80 overflow-y-auto z-50 p-2">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-text-secondary text-center py-4">No products found</p>
                    ) : (
                      filteredProducts.map(product => (
                        <div
                          key={product._id}
                          className={`w-full text-left p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${product.stock === 0 ? 'opacity-50 grayscale' : ''}`}
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-text-primary mb-0.5 leading-tight">{product.name}</p>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'text-green-600 bg-green-50'}`}>
                              {product.stock} in stock
                            </span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <div className="text-right">
                              <span className="font-bold text-primary text-sm block">
                                {formatCurrency(product.discountPrice || product.mrp)}
                              </span>
                            </div>
                            {product.stock > 0 && (
                              <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-0.5 shadow-sm">
                                <button 
                                  onClick={() => setSearchQuantities(prev => ({...prev, [product._id]: Math.max(1, (prev[product._id] || 1) - 1)}))}
                                  className="p-1 hover:bg-gray-100 rounded text-text-secondary"
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={product.stock}
                                  value={searchQuantities[product._id] || 1}
                                  onChange={(e) => {
                                    let val = parseInt(e.target.value) || 1;
                                    if (val < 1) val = 1;
                                    if (val > product.stock) val = product.stock;
                                    setSearchQuantities(prev => ({...prev, [product._id]: val}));
                                  }}
                                  className="w-10 text-center text-sm font-medium border-none p-0 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button 
                                  onClick={() => setSearchQuantities(prev => ({...prev, [product._id]: Math.min(product.stock, (prev[product._id] || 1) + 1)}))}
                                  className="p-1 hover:bg-gray-100 rounded text-text-secondary"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => addToCart(product, searchQuantities[product._id] || 1)}
                              disabled={product.stock === 0}
                              className="btn-primary py-1 px-3 text-xs shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCameraOpen(true)}
                className="btn-secondary px-3 flex items-center justify-center shrink-0 border-border bg-white hover:bg-gray-50"
                title="Scan Barcode with Camera"
              >
                <Camera size={18} className="text-text-secondary" />
              </button>
            </div>
          </div>

          {/* Cart Items Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-5 flex-1 flex flex-col lg:min-h-0 lg:overflow-hidden">
            <h3 className="font-bold text-lg mb-4 text-text-primary">Cart Items</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ShoppingCart size={48} className="mb-2 opacity-30" />
                  <p className="text-sm">No items added yet</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product._id} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-border">
                    <div className="flex-1 pr-4">
                      <p className="font-semibold text-sm leading-tight text-text-primary mb-1">{item.product.name}</p>
                      <span className="text-xs text-text-secondary font-mono">{formatCurrency(item.product.discountPrice || item.product.mrp)} / unit</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-0.5 shadow-sm">
                        <button onClick={() => item.quantity > 1 ? updateQuantity(item.product._id, -1) : removeFromCart(item.product._id)} className="p-1 hover:bg-gray-100 rounded text-text-secondary"><Minus size={14} /></button>
                        <span className="w-6 text-center text-sm font-medium text-text-primary">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product._id, 1)} className="p-1 hover:bg-gray-100 rounded text-text-secondary"><Plus size={14} /></button>
                      </div>
                      <span className="font-bold text-sm w-16 text-right text-text-primary">{formatCurrency((item.product.discountPrice || item.product.mrp) * item.quantity)}</span>
                      <button onClick={() => removeFromCart(item.product._id)} className="text-gray-400 hover:text-discount p-1.5 hover:bg-red-50 rounded-lg transition-colors"><X size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Checkout */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-5 flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-text-primary">Customer Info</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Customer Name *</label>
                <input 
                  type="text" 
                  placeholder="Walk-in Customer" 
                  value={customerInfo.name} 
                  onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} 
                  className="input-field py-2.5 text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Phone (auto-fetch)</label>
                <input 
                  type="text" 
                  placeholder="9876543210" 
                  value={customerInfo.phone} 
                  onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  onBlur={handlePhoneBlur}
                  className="input-field py-2.5 text-sm" 
                />
              </div>



              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Manual Discount (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="0" 
                  value={manualDiscount || ''} 
                  onChange={e => setManualDiscount(e.target.value)} 
                  className="input-field py-2.5 text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="input-field py-2.5 text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="gpay">Google Pay</option>
                  <option value="phonepe">PhonePe</option>
                  <option value="paytm">Paytm</option>
                  <option value="other">Other UPI / Card</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-secondary">Subtotal</span>
                <span className="text-sm font-medium text-text-primary">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-base text-text-primary">Total</span>
                <span className="font-bold text-xl text-discount">{formatCurrency(grandTotal)}</span>
              </div>

              <button
                onClick={() => handleCheckout('normal')}
                disabled={cart.length === 0 || isProcessing}
                className="mt-4 bg-white border-2 border-primary text-primary hover:bg-primary-lighter w-full py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Generate Bill'}
              </button>
            </div>
          </div>
        </div>

        {/* Camera Modal */}
        {isCameraOpen && (
          <CameraScanner
            onScan={handleCameraScan}
            onClose={() => setIsCameraOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default POSPage;
