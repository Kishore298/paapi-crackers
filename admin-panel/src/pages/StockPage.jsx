import React, { useState, useEffect } from 'react';
import { Search, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const StockPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Update state
  const [stockUpdates, setStockUpdates] = useState({}); // { productId: newStockValue }
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data } = await API.get('/products?limit=1000');
      setProducts(data.data);
      setStockUpdates({});
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleStockChange = (productId, value) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;
    setStockUpdates({ ...stockUpdates, [productId]: numValue });
  };

  const handleSaveAll = async () => {
    const updates = Object.keys(stockUpdates).map(id => ({
      productId: id,
      stock: stockUpdates[id],
      reason: 'Manual admin stock adjustment'
    }));

    if (updates.length === 0) return;

    try {
      setIsUpdating(true);
      await API.put('/stock/bulk-update', { updates });
      toast.success('Stock updated successfully');
      fetchProducts(false);
    } catch (error) {
      toast.error('Failed to update stock');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const aLow = a.stock <= 10 ? 1 : 0;
    const bLow = b.stock <= 10 ? 1 : 0;
    if (aLow !== bLow) return bLow - aLow;
    return a.stock - b.stock;
  });

  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Stock Manager</h1>
          <p className="text-sm text-text-secondary">Quickly adjust inventory levels for products</p>
        </div>
        <div className="flex gap-2">
          {Object.keys(stockUpdates).length > 0 && (
            <button 
              onClick={handleSaveAll} 
              disabled={isUpdating} 
              className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 animate-pulse-subtle"
            >
              <Save size={18} /> {isUpdating ? 'Saving...' : `Save ${Object.keys(stockUpdates).length} Updates`}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 flex items-center gap-4 bg-red-50 border-red-100">
          <div className="p-3 bg-red-100 rounded-xl text-red-600"><AlertTriangle size={24}/></div>
          <div>
            <p className="text-sm font-medium text-red-800">Out of Stock Products</p>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 bg-yellow-50 border-yellow-100">
          <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600"><AlertTriangle size={24}/></div>
          <div>
            <p className="text-sm font-medium text-yellow-800">Low Stock Products (≤ 10)</p>
            <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="table-container max-h-[60vh] overflow-y-auto">
            <table className="table sticky-header">
              <thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
                <tr>
                  <th>Product Details</th>
                  <th>Current Stock</th>
                  <th>New Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const hasUpdate = stockUpdates[product._id] !== undefined;
                  const newStock = hasUpdate ? stockUpdates[product._id] : product.stock;
                  const isOutOfStock = newStock === 0;
                  const isLowStock = newStock > 0 && newStock <= 10;
                  
                  return (
                    <tr key={product._id} className={hasUpdate ? 'bg-blue-50/50' : ''}>
                      <td>
                        <p className="font-medium text-text-primary text-sm">{product.name}</p>
                        <p className="text-xs text-text-secondary">SKU: {product.sku}</p>
                      </td>
                      <td>
                        <span className="font-mono text-gray-500 line-through mr-2 opacity-50">
                          {hasUpdate && product.stock}
                        </span>
                        <span className={`font-medium ${product.stock === 0 ? 'text-discount' : ''}`}>
                          {!hasUpdate && product.stock}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="0"
                            value={newStock}
                            onChange={(e) => handleStockChange(product._id, e.target.value)}
                            className={`w-24 px-3 py-1.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                              hasUpdate ? 'border-primary bg-white shadow-sm' : 'border-gray-200 bg-gray-50'
                            }`}
                          />
                          {hasUpdate && (
                            <button 
                              onClick={() => {
                                const newUpdates = {...stockUpdates};
                                delete newUpdates[product._id];
                                setStockUpdates(newUpdates);
                              }}
                              className="text-xs text-text-secondary hover:text-discount"
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockPage;
