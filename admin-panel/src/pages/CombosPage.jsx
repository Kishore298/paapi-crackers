import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency } from '../utils/format';

const CombosPage = () => {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    active: true,
  });
  const [comboProducts, setComboProducts] = useState([]); // [{product: id, quantity: num}]
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [comboRes, prodRes] = await Promise.all([
        API.get('/combos'),
        API.get('/products?active=true&limit=1000') // Only active products for combo creation
      ]);
      setCombos(comboRes.data.data);
      setProducts(prodRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (combo = null) => {
    if (combo) {
      setEditingCombo(combo);
      setFormData({
        name: combo.name,
        description: combo.description || '',
        price: combo.price,
        active: combo.active,
      });
      setComboProducts(combo.products.map(p => ({
        product: p.product?._id || p.product, // Handle populated or raw ID
        quantity: p.quantity
      })));
    } else {
      setEditingCombo(null);
      setFormData({ name: '', description: '', price: '', active: true });
      setComboProducts([]);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleAddProductToCombo = (productId) => {
    if (!productId) return;
    if (comboProducts.find(p => p.product === productId)) {
      toast.error('Product already in combo');
      return;
    }
    setComboProducts([...comboProducts, { product: productId, quantity: 1 }]);
  };

  const handleUpdateProductQuantity = (index, qty) => {
    const newProds = [...comboProducts];
    newProds[index].quantity = Math.max(1, qty);
    setComboProducts(newProds);
  };

  const handleRemoveProductFromCombo = (index) => {
    const newProds = [...comboProducts];
    newProds.splice(index, 1);
    setComboProducts(newProds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comboProducts.length === 0) return toast.error('Combo must have at least one product');

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name);
      if(formData.description) data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('active', formData.active);
      data.append('products', JSON.stringify(comboProducts));
      if (imageFile) data.append('image', imageFile);

      if (editingCombo) {
        await API.put(`/combos/${editingCombo._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' }});
        toast.success('Combo updated');
      } else {
        await API.post('/combos', data, { headers: { 'Content-Type': 'multipart/form-data' }});
        toast.success('Combo created');
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save combo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this combo?')) {
      try {
        await API.delete(`/combos/${id}`);
        toast.success('Combo deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete combo');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gift Boxes & Combos</h1>
          <p className="text-sm text-text-secondary">Create product bundles with special pricing</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Combo
        </button>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Combo</th>
                  <th>Price</th>
                  <th>Savings</th>
                  <th>Products Included</th>
                  <th>Max Availability</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {combos.map(combo => (
                  <tr key={combo._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {combo.image?.url ? (
                            <img src={combo.image.url} alt="" className="w-full h-full object-cover"/>
                          ) : (
                            <ImageIcon className="w-5 h-5 m-2.5 text-gray-400" />
                          )}
                        </div>
                        <span className="font-medium text-text-primary">{combo.name}</span>
                      </div>
                    </td>
                    <td className="font-bold text-primary">{formatCurrency(combo.price)}</td>
                    <td>
                      {combo.savings > 0 ? (
                        <span className="text-success text-xs font-semibold bg-green-50 px-2 py-1 rounded">Save {formatCurrency(combo.savings)}</span>
                      ) : '-'}
                    </td>
                    <td>{combo.products.length} items</td>
                    <td>
                      <span className={`font-medium ${combo.availableStock === 0 ? 'text-discount' : 'text-text-primary'}`}>
                        {combo.availableStock}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${combo.active ? 'badge-success' : 'badge-danger'}`}>
                        {combo.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(combo)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(combo._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {combos.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-8 text-text-secondary">No combos found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border bg-white z-10">
              <h2 className="text-xl font-bold text-text-primary">{editingCombo ? 'Edit Combo' : 'Create Combo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Combo Details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-text-secondary border-b border-border pb-2">Combo Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Combo Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Combo Price (₹) *</label>
                    <input type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="input-field" required />
                    <p className="text-xs text-text-secondary mt-1">Total value of selected products: {formatCurrency(comboProducts.reduce((sum, cp) => {
                      const p = products.find(p => p._id === cp.product);
                      return sum + (p ? (p.discountPrice || p.sellingPrice) * cp.quantity : 0);
                    }, 0))}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Image</label>
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-sm border-2 border-dashed border-border rounded-xl p-4 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                    <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field resize-none"></textarea>
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4 text-primary rounded" />
                    <span className="font-medium text-sm text-text-primary">Combo is Active</span>
                  </label>
                </div>

                {/* Right: Products Selection */}
                <div className="space-y-4 flex flex-col h-full">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-text-secondary border-b border-border pb-2">Included Products</h3>
                  
                  <div className="flex gap-2">
                    <select id="productSelect" className="input-field flex-1" defaultValue="">
                      <option value="" disabled>Select a product to add...</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name} - {formatCurrency(p.discountPrice || p.sellingPrice)}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => {
                      const select = document.getElementById('productSelect');
                      handleAddProductToCombo(select.value);
                      select.value = "";
                    }} className="btn-secondary whitespace-nowrap">Add</button>
                  </div>

                  <div className="flex-1 min-h-[200px] border border-border rounded-xl bg-gray-50 p-2 overflow-y-auto space-y-2">
                    {comboProducts.length === 0 ? (
                      <p className="text-center text-sm text-text-secondary py-10">No products added yet.</p>
                    ) : (
                      comboProducts.map((cp, idx) => {
                        const product = products.find(p => p._id === cp.product);
                        if (!product) return null;
                        return (
                          <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-border flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-text-secondary">{formatCurrency(product.discountPrice || product.sellingPrice)} each</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                min="1" 
                                value={cp.quantity} 
                                onChange={e => handleUpdateProductQuantity(idx, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 border border-border rounded text-center text-sm"
                              />
                              <button type="button" onClick={() => handleRemoveProductFromCombo(idx)} className="p-1 text-discount hover:bg-red-50 rounded">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary min-w-[150px]">
                  {submitting ? 'Saving...' : 'Save Combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombosPage;
