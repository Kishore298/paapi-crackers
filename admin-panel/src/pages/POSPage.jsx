import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, User, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency } from '../utils/format';

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Cart State
  const [cart, setCart] = useState([]); // { product, quantity }
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/products?active=true&limit=1000');
      setProducts(data.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

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

  const subtotal = cart.reduce((sum, item) => sum + (item.product.discountPrice || item.product.sellingPrice) * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!customerInfo.name || !customerInfo.phone) return toast.error('Customer Name and Phone are required for billing');

    try {
      setIsProcessing(true);
      
      const payload = {
        customerDetails: customerInfo,
        items: cart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity
        })),
        paymentMethod
      };

      const { data } = await API.post('/pos/checkout', payload);
      
      toast.success('Sale completed successfully!');
      
      // Print Invoice Logic could go here (open PDF in new tab)
      if (data.data.invoiceId) {
         window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/invoices/${data.data.invoiceId}/pdf`, '_blank');
      }

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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          {loading ? (
             <div className="col-span-full py-10 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredProducts.map(product => (
            <button 
              key={product._id} 
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className={`text-left card p-3 flex flex-col h-32 transition-all hover:border-primary/50 hover:shadow-md active:scale-95 ${product.stock === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              <p className="font-semibold text-sm text-text-primary line-clamp-2 mb-1 leading-tight">{product.name}</p>
              <p className="text-[10px] text-text-secondary font-mono mb-auto">{product.sku}</p>
              
              <div className="flex items-end justify-between mt-2">
                <span className="font-bold text-primary text-sm">
                  {formatCurrency(product.discountPrice || product.sellingPrice)}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-text-secondary'}`}>
                  {product.stock} in stock
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-border overflow-hidden shrink-0">
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
                  <span className="font-bold text-sm">{formatCurrency((item.product.discountPrice || item.product.sellingPrice) * item.quantity)}</span>
                  
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

          <div className="flex gap-2">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${paymentMethod === 'cash' ? 'bg-primary-lighter text-primary border-primary' : 'bg-white border-border text-text-secondary hover:bg-gray-100'}`}
            >
              Cash
            </button>
            <button 
              onClick={() => setPaymentMethod('upi')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${paymentMethod === 'upi' ? 'bg-primary-lighter text-primary border-primary' : 'bg-white border-border text-text-secondary hover:bg-gray-100'}`}
            >
              UPI / Card
            </button>
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-between items-center mb-2">
            <span className="font-bold text-text-primary text-lg">Total</span>
            <span className="font-bold text-primary text-2xl">{formatCurrency(subtotal)}</span>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="btn-success w-full py-3 text-base flex justify-center items-center gap-2"
          >
            {isProcessing ? 'Processing...' : <><Printer size={18}/> Pay & Print Invoice</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;
