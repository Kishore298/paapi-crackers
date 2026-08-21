import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import ConfirmModal from '../components/common/ConfirmModal';

const BannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', link: '', active: true, order: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/banners');
      setBanners(data.data);
    } catch (error) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({ title: '', link: '', active: true, order: banners.length });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return toast.error('Banner image is required');

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('link', formData.link);
      data.append('active', formData.active);
      data.append('order', formData.order);
      data.append('image', imageFile);

      await API.post('/banners', data, { headers: { 'Content-Type': 'multipart/form-data' }});
      toast.success('Banner created');
      setIsModalOpen(false);
      fetchBanners();
    } catch (error) {
      toast.error('Failed to upload banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    try {
      await API.delete(`/banners/${confirmModal.id}`);
      toast.success('Banner deleted');
      fetchBanners();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (banner) => {
    try {
       await API.put(`/banners/${banner._id}`, { active: !banner.active });
       fetchBanners();
       toast.success('Banner updated');
    } catch (error) {
       toast.error('Failed to update banner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Banners</h1>
          <p className="text-sm text-text-secondary">Manage homepage promotional banners</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Upload Banner
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
        <div className="shrink-0 mt-0.5">ℹ️</div>
        <div>
          <p className="font-semibold mb-1">Banner Design Guidelines</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Single Image Approach:</strong> Upload one high-quality image of size <strong>1440 × 480 px</strong>.</li>
            <li><strong>Safe Zone:</strong> Keep important text and logos in the <strong>center 60%</strong> of the image. The edges will be automatically cropped on smaller devices like mobiles.</li>
            <li><strong>Format:</strong> Use WebP or compressed JPG (under 500 KB) for fast loading times.</li>
          </ul>
        </div>
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <div className="space-y-4">
            {banners.length === 0 ? (
               <div className="text-center py-10 text-text-secondary border-2 border-dashed border-border rounded-xl">
                 No banners uploaded yet.
               </div>
            ) : (
              banners.map(banner => (
                <div key={banner._id} className="flex items-center gap-4 p-4 border border-border rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical size={20} />
                  </div>
                  
                  <div className="w-48 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-border">
                    <img src={banner.image.url} alt={banner.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary">{banner.title || 'Untitled Banner'}</p>
                    <p className="text-xs text-text-secondary truncate">{banner.link || 'No link provided'}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium text-text-secondary">Active</span>
                      <div className={`w-10 h-5 rounded-full transition-colors relative ${banner.active ? 'bg-success' : 'bg-gray-300'}`}>
                        <input type="checkbox" checked={banner.active} onChange={() => toggleActive(banner)} className="sr-only" />
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${banner.active ? 'left-5' : 'left-1'}`}></div>
                      </div>
                    </label>
                    <div className="h-6 w-px bg-border"></div>
                    <button onClick={() => handleDelete(banner._id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">Upload New Banner</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Banner Image *</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-gray-50">
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-lighter file:text-primary hover:file:bg-primary-lighter/80" required />
                  <p className="text-xs text-text-secondary mt-2">Recommended: 1440 × 480 px (Center safe zone)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title (Optional overlay text)</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field" placeholder="e.g. Diwali Mega Sale" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Target Link (Optional)</label>
                <input type="text" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="input-field" placeholder="e.g. /category/sparklers" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Uploading...' : 'Upload Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default BannersPage;
