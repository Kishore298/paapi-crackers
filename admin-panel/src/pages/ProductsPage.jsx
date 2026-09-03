import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Image as ImageIcon, X, Barcode, Printer, Upload, GripVertical } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { formatCurrency } from '../utils/format';
import ConfirmModal from '../components/common/ConfirmModal';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drag and Drop State
  const [draggedProductId, setDraggedProductId] = useState(null);
  const [dragOverProductId, setDragOverProductId] = useState(null);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Barcode Modal State
  const [barcodeModalProduct, setBarcodeModalProduct] = useState(null);
  const barcodeRef = useRef(null);
  const excelRef = useRef(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    mrp: '',
    pcs: '',
    youtubeVideoId: '',
    hsnCode: '',
    stock: '0',
    active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (barcodeModalProduct && barcodeRef.current) {
      JsBarcode(barcodeRef.current, barcodeModalProduct.sku, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: true,
        textMargin: 4,
        fontSize: 16,
        margin: 10
      });
    }
  }, [barcodeModalProduct]);

  const handlePrintBarcode = () => {
    if (!barcodeRef.current) return;
    const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${barcodeModalProduct.sku}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
            .print-area { text-align: center; border: 1px dashed #ccc; padding: 20px; border-radius: 8px; }
            .name { font-size: 14px; font-weight: bold; margin-bottom: 10px; max-width: 250px; }
            @media print {
              body { justify-content: flex-start; height: auto; }
              .print-area { border: none; padding: 0; }
              @page { size: auto; margin: 0mm; }
            }
          </style>
        </head>
        <body>
          <div class="print-area">
            <div class="name">${barcodeModalProduct.name}</div>
            ${svgData}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        API.get('/products?limit=1000'),
        API.get('/categories')
      ]);
      setProducts(prodRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    try {
      setUploadingExcel(true);
      const res = await API.post('/products/bulk-upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { summary, errors: rowErrors } = res.data;
      
      // Build a descriptive toast message
      if (summary) {
        const parts = [];
        if (summary.added > 0) parts.push(`${summary.added} added`);
        if (summary.updated > 0) parts.push(`${summary.updated} updated`);
        if (summary.skipped > 0) parts.push(`${summary.skipped} skipped`);
        toast.success(`Upload complete: ${parts.join(', ')} (${summary.total} rows processed)`);
      } else {
        toast.success(res.data.message || 'Bulk upload successful');
      }
      
      // Show errors if any rows were skipped
      if (rowErrors && rowErrors.length > 0) {
        const errorMessages = rowErrors.slice(0, 5).map(e => 
          `Row ${e.row}${e.name ? ` (${e.name})` : ''}: ${e.reason}`
        ).join('\n');
        const suffix = rowErrors.length > 5 ? `\n...and ${rowErrors.length - 5} more` : '';
        toast.error(`Some rows had issues:\n${errorMessages}${suffix}`, { duration: 8000, style: { whiteSpace: 'pre-line' } });
      }
      
      fetchData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk upload failed');
    } finally {
      setUploadingExcel(false);
      if (excelRef.current) excelRef.current.value = '';
    }
  };

  const handleDragStart = (e, product) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedProductId(product._id);
  };

  const handleDragOver = (e, product) => {
    e.preventDefault();
    if (draggedProductId === product._id) return;
    setDragOverProductId(product._id);
  };

  const handleDragLeave = () => {
    setDragOverProductId(null);
  };

  const handleDrop = async (e, targetProduct) => {
    e.preventDefault();
    setDragOverProductId(null);
    if (!draggedProductId || draggedProductId === targetProduct._id) return;

    const items = [...products];
    const fromIndex = items.findIndex(p => p._id === draggedProductId);
    const toIndex = items.findIndex(p => p._id === targetProduct._id);
    
    if (fromIndex === -1 || toIndex === -1) return;

    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);

    // Re-assign globalOrders based on their new visual position
    // Since items contains all products sorted currently, we can just assign 0...N
    const reordered = items.map((item, index) => ({
      ...item,
      globalOrder: index
    }));

    setProducts(reordered);
    setDraggedProductId(null);

    try {
      const orderData = reordered.map(item => ({
        id: item._id,
        globalOrder: item.globalOrder
      }));
      await API.put('/products/reorder', { products: orderData });
      toast.success('Products reordered');
    } catch (error) {
      toast.error('Failed to save product order');
      fetchData(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? p.category?._id === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category?._id || '',
        mrp: product.mrp,
        pcs: product.pcs || '',
        youtubeVideoId: product.youtubeVideoId || '',
        hsnCode: product.hsnCode || '',
        stock: product.stock.toString(),
        active: product.active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', description: '', category: '', mrp: '', pcs: '',
        youtubeVideoId: '', hsnCode: '', stock: '0', active: true
      });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });
      if (imageFile) data.append('image', imageFile);

      if (editingProduct) {
        // Stock updates happen via separate endpoint, don't send stock here
        data.delete('stock');
        await API.put(`/products/${editingProduct._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Update stock if changed
        if (formData.stock !== editingProduct.stock.toString()) {
          await API.put(`/products/${editingProduct._id}/stock`, {
            action: 'set',
            quantity: formData.stock,
            notes: 'Stock updated from product edit form'
          });
        }
        
        toast.success('Product updated successfully');
      } else {
        await API.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Product created successfully');
      }
      
      setIsModalOpen(false);
      fetchData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    try {
      await API.delete(`/products/${confirmModal.id}`);
      toast.success('Product deleted');
      fetchData(false);
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Products</h1>
          <p className="text-sm text-text-secondary">Manage your catalogue and pricing</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={excelRef} onChange={handleBulkUpload} accept=".xlsx,.xls,.csv" className="hidden" />
          <button onClick={() => excelRef.current?.click()} disabled={uploadingExcel} className="btn-secondary flex items-center gap-2">
            <Upload size={18} /> {uploadingExcel ? 'Uploading...' : 'Excel Upload'}
          </button>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field sm:w-64"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr 
                    key={product._id}
                    draggable={!search && !categoryFilter}
                    onDragStart={(e) => handleDragStart(e, product)}
                    onDragOver={(e) => handleDragOver(e, product)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, product)}
                    onDragEnd={() => { setDraggedProductId(null); setDragOverProductId(null); }}
                    className={`
                      ${draggedProductId === product._id ? 'opacity-50' : ''}
                      ${dragOverProductId === product._id ? 'bg-primary-lighter/50' : ''}
                      ${!search && !categoryFilter ? 'cursor-move' : ''}
                      transition-colors
                    `}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        {!search && !categoryFilter && (
                          <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
                        )}
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.image?.url ? (
                            <img src={product.image.url} alt="" className="w-full h-full object-cover"/>
                          ) : (
                            <ImageIcon className="w-5 h-5 m-2.5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{product.name}</p>
                          <p className="text-xs text-text-secondary">{product.pcs || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{product.sku}</td>
                    <td>{product.category?.name || '-'}</td>
                    <td>
                      <div className="font-bold text-gray-900">
                        {formatCurrency(product.mrp)}
                      </div>
                    </td>
                    <td>
                      <span className={`font-medium ${product.stock === 0 ? 'text-discount' : product.stock <= 10 ? 'text-yellow-600' : 'text-success'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.active ? 'badge-success' : 'badge-danger'}`}>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setBarcodeModalProduct(product)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Print Barcode">
                          <Barcode size={16} />
                        </button>
                        <button onClick={() => openModal(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-8 text-text-secondary">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-text-primary">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" required />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Category *</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field" required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">MRP*</label>
                      <input type="number" min="0" step="0.01" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">PCS/Pack</label>
                      <input type="text" value={formData.pcs} onChange={e => setFormData({...formData, pcs: e.target.value})} className="input-field" placeholder="e.g. 10pcs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">{editingProduct ? 'Current Stock' : 'Opening Stock'}</label>
                      <input type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="input-field" />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Product Image</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                      <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-lighter file:text-primary hover:file:bg-primary-lighter/80" />
                      {editingProduct?.image?.url && !imageFile && (
                        <p className="text-xs text-text-secondary mt-2">Current image will be kept if no new file is selected.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field resize-none"></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">HSN Code</label>
                      <input type="text" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">YouTube URL</label>
                      <input type="text" value={formData.youtubeVideoId} onChange={e => setFormData({...formData, youtubeVideoId: e.target.value})} className="input-field" placeholder="Video Link" />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer mt-4">
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4 text-primary rounded" />
                    <span className="font-medium text-sm text-text-primary">Product is Active (Visible on website)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary min-w-[120px]">
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      {barcodeModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center flex flex-col items-center">
            <h3 className="text-lg font-bold text-text-primary mb-1">Product Barcode</h3>
            <p className="text-sm text-text-secondary mb-6 line-clamp-1">{barcodeModalProduct.name}</p>
            
            <div className="bg-white p-4 border border-border rounded-xl mb-6 shadow-sm inline-block">
              <svg ref={barcodeRef}></svg>
            </div>
            
            <div className="flex gap-3 w-full">
              <button onClick={() => setBarcodeModalProduct(null)} className="btn-secondary flex-1">Close</button>
              <button onClick={handlePrintBarcode} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Printer size={18} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This will break past orders referencing it. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default ProductsPage;
