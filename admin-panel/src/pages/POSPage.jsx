import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, User, Printer, Eye, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency, formatDateTime } from '../utils/format';

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Cart State
  const [cart, setCart] = useState([]); // { product, quantity }
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState(null);

  const [activeView, setActiveView] = useState('history'); // 'history' | 'billing'
  
  // History State
  const [sales, setSales] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

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

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.billNumber.toLowerCase().includes(historySearch.toLowerCase()) || 
                          (s.customerName || '').toLowerCase().includes(historySearch.toLowerCase()) || 
                          (s.customerPhone || '').includes(historySearch);
    const matchesPayment = paymentFilter ? s.paymentMethod === paymentFilter : true;
    return matchesSearch && matchesPayment;
  });


  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [productRes, catRes] = await Promise.all([
        API.get('/products?active=true&limit=1000'),
        API.get('/categories')
      ]);
      setProducts(productRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      toast.error('Failed to load products and categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const catId = typeof p.category === 'object' ? p.category?._id : p.category;
    const matchesCategory = selectedCategory === 'All' || catId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    if (product.stock <= 0) return toast.error('Product is out of stock');
    
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Maximum stock reached');
          return prev;
        }
        return prev.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
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

  const subtotal = cart.reduce((sum, item) => sum + (item.product.discountPrice || item.product.mrp) * item.quantity, 0);

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
        paymentMethod: 'cash',
        billType: invoiceType
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
                              {sale.invoice.type === 'normal' ? (
                                <button onClick={() => handleGenerateInvoice(sale._id, 'gst')} className="text-[10px] text-primary hover:underline">+ Gen GST</button>
                              ) : (
                                <button onClick={() => handleGenerateInvoice(sale._id, 'normal')} className="text-[10px] text-primary hover:underline">+ Gen Std</button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-gray-400 mb-1">No Invoice</span>
                              <div className="flex gap-2">
                                <button onClick={() => handleGenerateInvoice(sale._id, 'normal')} className="text-xs text-primary hover:underline">Gen Std</button>
                                <button onClick={() => handleGenerateInvoice(sale._id, 'gst')} className="text-xs text-secondary hover:underline">Gen GST</button>
                              </div>
                            </div>
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
    
  <div className="flex flex-col gap-4 h-[calc(100vh-6rem)]">
    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-border">
      <h2 className="font-bold text-lg text-text-primary flex items-center gap-2"><Printer size={20} className="text-primary" /> POS Billing Terminal</h2>
      <button onClick={() => setActiveView('history')} className="btn-secondary text-sm py-1.5 px-4">
        Back to History
      </button>
    </div>
    <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">

      
      {/* Left: Product Selection */}
      <div className="flex-[1.5] lg:flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {lastInvoiceId && (
          <div className="bg-green-50 border-b border-green-100 p-3 flex justify-between items-center">
            <span className="text-green-800 text-sm font-medium">Last Sale Completed</span>
            <div className="flex gap-2">
              <button onClick={handleDownloadLastInvoice} className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded hover:bg-green-50">Download PDF</button>
              <button onClick={handleViewLastInvoice} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">View PDF</button>
              <button onClick={() => setLastInvoiceId(null)} className="text-xs text-gray-500 hover:text-gray-700 ml-2">Dismiss</button>
            </div>
          </div>
        )}
        <div className="p-3 lg:p-4 border-b border-border bg-gray-50 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full bg-white text-sm py-2 lg:py-2.5"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button 
              onClick={() => setSelectedCategory('All')} 
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCategory === 'All' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-border text-text-secondary hover:bg-gray-100'}`}
            >
              All Products
            </button>
            {categories.map(cat => (
              <button 
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCategory === cat._id ? 'bg-primary text-white shadow-sm' : 'bg-white border border-border text-text-secondary hover:bg-gray-100'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col gap-2 bg-gray-50/50">
          {loading ? (
             <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredProducts.map(product => (
            <button 
              key={product._id} 
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className={`text-left bg-white border border-border rounded-xl p-3 flex items-center justify-between transition-all hover:border-primary/50 hover:shadow-md active:scale-95 ${product.stock === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              <div className="flex-1 pr-3">
                <p className="font-semibold text-sm text-text-primary line-clamp-1 mb-0.5">{product.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-secondary font-mono bg-gray-100 px-1.5 py-0.5 rounded">{product.sku}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'text-green-600 bg-green-50'}`}>
                    {product.stock} in stock
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-primary text-base block">
                  {formatCurrency(product.discountPrice || product.mrp)}
                </span>
                {product.discountPrice && (
                  <span className="text-[10px] text-text-secondary line-through block -mt-1">
                    {formatCurrency(product.mrp)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="flex-1 lg:flex-none w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20}/> Current Order</h2>
          {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-discount hover:underline font-medium">Clear All</button>}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-50"/>
              <p>No items in cart</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product._id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-border">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm leading-tight pr-2">{item.product.name}</p>
                  <button onClick={() => removeFromCart(item.product._id)} className="text-gray-400 hover:text-discount p-1 -mt-1 -mr-1"><X size={16}/></button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{formatCurrency((item.product.discountPrice || item.product.mrp) * item.quantity)}</span>
                  
                  <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-0.5">
                    <button onClick={() => item.quantity > 1 ? updateQuantity(item.product._id, -1) : removeFromCart(item.product._id)} className="p-1 hover:bg-gray-100 rounded text-text-secondary"><Minus size={14}/></button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product._id, 1)} className="p-1 hover:bg-gray-100 rounded text-text-secondary"><Plus size={14}/></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="border-t border-border p-4 bg-gray-50 space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Customer Name *" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="input-field pl-9 text-sm py-2" />
            </div>
            <div className="relative">
              <input type="text" placeholder="Phone Number *" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="input-field pl-9 text-sm py-2" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 flex justify-between items-center mb-2">
            <span className="font-bold text-text-primary text-lg">Total</span>
            <span className="font-bold text-primary text-2xl">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleCheckout('normal')}
              disabled={cart.length === 0 || isProcessing}
              className="bg-white border-2 border-primary text-primary hover:bg-primary-lighter w-full py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors"
            >
              {isProcessing ? 'Processing...' : <><Printer size={16}/> Print Invoice (Without GST)</>}
            </button>
            <button 
              onClick={() => handleCheckout('gst')}
              disabled={cart.length === 0 || isProcessing}
              className="btn-primary w-full py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2"
            >
              {isProcessing ? 'Processing...' : <><Printer size={16}/> Print Invoice (With GST)</>}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default POSPage;
