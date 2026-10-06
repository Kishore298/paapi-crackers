import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import { formatCurrency } from '../../utils/format';

const EditOrderModal = ({ order, onClose, onSave }) => {
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [search, setSearch] = useState('');
  
  const [cart, setCart] = useState([]);
  const [customerDetails, setCustomerDetails] = useState(order.customerDetails || { name: '', phone: '', email: '' });
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress || { address: '', city: '', state: '', pincode: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoadingItems(true);
      const [prodRes, comboRes] = await Promise.all([
        API.get('/products', { params: { limit: 1000 } }),
        API.get('/combos', { params: { limit: 1000 } })
      ]);
      const fetchedProducts = prodRes.data.data;
      const fetchedCombos = comboRes.data.data;
      setProducts(fetchedProducts);
      setCombos(fetchedCombos);

      // Prepopulate cart
      const initialCart = order.items.map(item => {
        let comboId = item.combo ? (typeof item.combo === 'object' ? item.combo._id : item.combo) : (item.comboId ? (typeof item.comboId === 'object' ? item.comboId._id : item.comboId) : undefined);
        let prodId = item.product ? (typeof item.product === 'object' ? item.product._id : item.product) : (item.productId ? (typeof item.productId === 'object' ? item.productId._id : item.productId) : undefined);
        
        let foundCombo = comboId ? fetchedCombos.find(c => c._id === comboId) : undefined;
        let foundProd = prodId ? fetchedProducts.find(p => p._id === prodId) : undefined;
        
        const itemName = item.productSnapshot?.name;
        if (!foundCombo && !foundProd && itemName) {
          foundCombo = fetchedCombos.find(c => c.name === itemName);
          if (!foundCombo) {
            foundProd = fetchedProducts.find(p => p.name === itemName);
          }
        }

        if (foundCombo || item.isCombo || !!comboId) {
          return {
            itemDetails: foundCombo || { _id: comboId || item._id, ...item.productSnapshot },
            isCombo: true,
            quantity: item.quantity,
            price: item.price
          };
        } else {
          return {
            itemDetails: foundProd || { _id: prodId || item._id, ...item.productSnapshot },
            isCombo: false,
            quantity: item.quantity,
            price: item.price
          };
        }
      });
      setCart(initialCart);
    } catch (error) {
      toast.error('Failed to load products/combos for editing');
    } finally {
      setLoadingItems(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const filteredCombos = combos.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddToCart = (item, isCombo) => {
    setCart(prev => {
      const existing = prev.find(c => c.itemDetails._id === item._id && c.isCombo === isCombo);
      if (existing) {
        return prev.map(c => 
          c.itemDetails._id === item._id && c.isCombo === isCombo
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, {
        itemDetails: item,
        isCombo,
        quantity: 1,
        price: isCombo ? item.price : (item.discountPrice || item.mrp)
      }];
    });
  };

  const handleUpdateQuantity = (index, delta) => {
    setCart(prev => {
      const newCart = [...prev];
      const newQ = newCart[index].quantity + delta;
      if (newQ <= 0) {
        newCart.splice(index, 1);
      } else {
        newCart[index].quantity = newQ;
      }
      return newCart;
    });
  };

  const handleRemoveItem = (index) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      return newCart;
    });
  };

  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0);

  const handleSave = async () => {
    if (cart.length === 0) return toast.error('Order must have at least one item');
    try {
      setIsSaving(true);
      const validCart = cart.filter(c => c.itemDetails && c.itemDetails._id);
      if (validCart.length === 0) return toast.error('Order must have at least one valid item');

      const payloadItems = validCart.map(c => ({
        [c.isCombo ? 'comboId' : 'productId']: c.itemDetails._id,
        isCombo: c.isCombo,
        quantity: c.quantity
      }));
      
      const payload = {
        items: payloadItems,
        customerDetails,
        shippingAddress
      };

      const { data } = await API.put(`/orders/${order._id}`, payload);
      toast.success('Order updated successfully!');
      onSave(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gray-50">
          <div>
            <h2 className="font-bold text-lg text-text-primary">Edit Order - {order.orderNumber}</h2>
            <p className="text-sm text-text-secondary">Modify items, customer info, or address</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Side: Items Catalog */}
          <div className="w-full md:w-2/5 md:border-r border-b md:border-b-0 border-border flex flex-col bg-white shrink-0">
            <div className="p-4 border-b border-border z-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products or combos..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {/* Mobile Search Dropdown */}
                {search.trim().length > 0 && (
                  <div className="absolute md:hidden top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-xl max-h-80 overflow-y-auto p-2">
                    {filteredCombos.length === 0 && filteredProducts.length === 0 ? (
                      <p className="text-sm text-text-secondary text-center py-4">No results found</p>
                    ) : (
                      <>
                        {filteredCombos.map(combo => (
                           <div key={combo._id} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                             <div>
                               <p className="font-semibold text-sm text-text-primary">{combo.name}</p>
                               <span className="text-primary font-bold text-sm">{formatCurrency(combo.price)}</span>
                             </div>
                             <button onClick={() => { handleAddToCart(combo, true); setSearch(''); }} className="bg-primary text-white py-1 px-3 rounded-lg text-xs font-bold">Add</button>
                           </div>
                        ))}
                        {filteredProducts.map(prod => (
                           <div key={prod._id} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                             <div>
                               <p className="font-semibold text-sm text-text-primary">{prod.name}</p>
                               <span className="text-primary font-bold text-sm">{formatCurrency(prod.discountPrice || prod.mrp)}</span>
                             </div>
                             <button onClick={() => { handleAddToCart(prod, false); setSearch(''); }} className="bg-primary text-white py-1 px-3 rounded-lg text-xs font-bold">Add</button>
                           </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:block flex-1 overflow-y-auto p-4 space-y-6">
              {loadingItems ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <>
                  {filteredCombos.length > 0 && (
                    <div>
                      <h3 className="font-bold text-text-primary mb-3 sticky top-0 bg-white py-1">Combos</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {filteredCombos.map(combo => (
                          <div key={combo._id} onClick={() => handleAddToCart(combo, true)} className="border border-border rounded-xl p-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all flex flex-col justify-between">
                            <span className="text-sm font-medium line-clamp-2">{combo.name}</span>
                            <span className="text-primary font-bold text-sm mt-2">{formatCurrency(combo.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredProducts.length > 0 && (
                    <div>
                      <h3 className="font-bold text-text-primary mb-3 sticky top-0 bg-white py-1">Products</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {filteredProducts.map(prod => (
                          <div key={prod._id} onClick={() => handleAddToCart(prod, false)} className="border border-border rounded-xl p-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all flex flex-col justify-between">
                            <span className="text-sm font-medium line-clamp-2">{prod.name}</span>
                            <span className="text-primary font-bold text-sm mt-2">{formatCurrency(prod.discountPrice || prod.mrp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Side: Cart & Details */}
          <div className="w-full md:w-3/5 flex flex-col bg-gray-50 flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Order Items */}
              <div className="bg-white border border-border rounded-xl shadow-sm p-4">
                <h3 className="font-bold text-text-primary mb-3">Order Items</h3>
                <div className="space-y-3">
                  {cart.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-border rounded-xl">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">
                          {c.itemDetails.name || (!c.itemDetails._id ? <span className="text-red-500">Removed/Corrupted Product (Delete this)</span> : 'Unknown Product')}
                        </div>
                        <div className="text-xs text-text-secondary">{c.isCombo ? 'Combo' : 'Product'} - {formatCurrency(c.price)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-lg p-1">
                          <button onClick={() => handleUpdateQuantity(i, -1)} className="p-1 hover:bg-white rounded text-text-secondary"><Minus size={14}/></button>
                          <span className="text-sm font-medium w-6 text-center">{c.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(i, 1)} className="p-1 hover:bg-white rounded text-text-secondary"><Plus size={14}/></button>
                        </div>
                        <div className="w-20 text-right font-bold text-primary text-sm">
                          {formatCurrency(c.price * c.quantity)}
                        </div>
                        <button onClick={() => handleRemoveItem(i)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && <div className="text-center text-text-secondary py-6 text-sm">No items in order</div>}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between font-bold text-lg">
                  <span>Subtotal</span>
                  <span className="text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-white border border-border rounded-xl shadow-sm p-4">
                <h3 className="font-bold text-text-primary mb-3">Customer Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
                    <input type="text" value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} className="w-full text-sm border border-border rounded-lg p-2 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
                    <input type="text" value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} className="w-full text-sm border border-border rounded-lg p-2 focus:outline-none focus:border-primary" />
                  </div>
                </div>
              </div>

            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-border bg-white flex justify-end gap-3 shadow-lg">
              <button onClick={onClose} className="px-6 py-2 border border-border rounded-xl text-text-secondary font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving || cart.length === 0} 
                className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
