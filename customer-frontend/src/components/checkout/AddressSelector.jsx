import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Check, Home, Briefcase, Map } from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const AddressSelector = ({ customer, setCustomer, onSelect, selectedId }) => {
  const [addresses, setAddresses] = useState(customer?.addresses || []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    label: 'Home',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    isDefault: false
  });

  useEffect(() => {
    if (customer?.addresses) {
      setAddresses(customer.addresses);
      // Auto select default if none selected
      if (!selectedId) {
        const defaultAddr = customer.addresses.find(a => a.isDefault) || customer.addresses[0];
        if (defaultAddr) onSelect(defaultAddr);
      }
    }
  }, [customer, selectedId, onSelect]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      let newAddresses = [...addresses];
      
      // If setting as default, remove default from others
      if (formData.isDefault) {
        newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
      }

      if (editId) {
        newAddresses = newAddresses.map(a => 
          a._id === editId ? { ...formData, _id: editId } : a
        );
      } else {
        newAddresses.push({ ...formData }); // Let Mongoose generate the _id
      }
      
      const { data } = await API.put(`/customers/${customer._id}`, { addresses: newAddresses });
      
      setCustomer(data.data);
      setAddresses(data.data.addresses);
      toast.success(editId ? 'Address updated' : 'Address added');
      
      // Auto select the new/edited address
      const savedAddress = data.data.addresses[data.data.addresses.length - 1];
      if (!editId || formData.isDefault) {
         onSelect(data.data.addresses.find(a => a.isDefault) || savedAddress);
      }

      setShowForm(false);
      setEditId(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDelete = async (e, addressId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this address?')) return;
    
    try {
      const newAddresses = addresses.filter(a => a._id !== addressId);
      const { data } = await API.put(`/customers/${customer._id}`, { addresses: newAddresses });
      setCustomer(data.data);
      setAddresses(data.data.addresses);
      toast.success('Address deleted');
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const openEdit = (e, addr) => {
    e.stopPropagation();
    setFormData({
      label: addr.label || 'Home',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || '',
      isDefault: addr.isDefault || false
    });
    setEditId(addr._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      label: 'Home',
      address: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: '',
      isDefault: false
    });
  };

  const getIcon = (label) => {
    if (label === 'Home') return <Home size={16} />;
    if (label === 'Work') return <Briefcase size={16} />;
    return <Map size={16} />;
  };

  if (showForm) {
    return (
      <div className="bg-gray-50 p-4 rounded-xl border border-border">
        <h3 className="font-bold text-text-primary mb-4">{editId ? 'Edit Address' : 'Add New Address'}</h3>
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="flex gap-4">
            {['Home', 'Work', 'Other'].map(lbl => (
              <label key={lbl} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="label" value={lbl} checked={formData.label === lbl} onChange={handleInputChange} className="text-primary focus:ring-primary" />
                <span className="text-sm text-text-primary">{lbl}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Complete Address *</label>
            <textarea name="address" required value={formData.address} onChange={handleInputChange} rows={3} className="input-field resize-none" placeholder="House/Flat No., Street Name, Area" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">City *</label>
              <input type="text" name="city" required value={formData.city} onChange={handleInputChange} className="input-field" placeholder="City / District" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">State *</label>
              <input type="text" name="state" required value={formData.state} onChange={handleInputChange} className="input-field" placeholder="State" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Pincode *</label>
              <input type="text" name="pincode" required value={formData.pincode} onChange={handleInputChange} className="input-field" placeholder="6-digit pincode" />
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} className="rounded text-primary focus:ring-primary border-gray-300" />
            <span className="text-sm font-medium text-text-primary">Set as Default Address</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }} className="btn-outline text-sm py-2">Cancel</button>
            <button type="submit" className="btn-primary text-sm py-2">Save Address</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
          <MapPin size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-text-secondary mb-4">No saved addresses found.</p>
          <button onClick={() => setShowForm(true)} className="btn-outline mx-auto flex items-center gap-2">
            <Plus size={16} /> Add New Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((addr) => {
            const isSelected = selectedId === addr._id;
            return (
              <div 
                key={addr._id}
                onClick={() => onSelect(addr)}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-primary">
                    <Check size={20} />
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-text-secondary bg-gray-100 px-2 py-1 rounded-md uppercase tracking-wider">
                    {getIcon(addr.label)} {addr.label || 'Home'}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-md uppercase tracking-wider">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-text-primary font-medium text-sm pr-8">{addr.address}</p>
                <p className="text-text-secondary text-sm mt-1">{addr.city}, {addr.state} - {addr.pincode}</p>

                <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={(e) => openEdit(e, addr)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={(e) => handleDelete(e, addr._id)} className="text-xs font-medium text-error hover:underline flex items-center gap-1">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
          
          <button 
            onClick={() => setShowForm(true)}
            className="p-3 py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Plus size={18} /> Add Another Address
          </button>
        </div>
      )}
    </div>
  );
};

export default AddressSelector;
