import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import API from '../api/axios';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, setCustomer } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  // Get the redirect path from URL params or default to checkout
  const redirect = new URLSearchParams(location.search).get('redirect') || '/checkout';

  useEffect(() => {
    // If already logged in, redirect immediately
    if (customer) {
      navigate(redirect);
    }
  }, [customer, navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Please enter both name and phone number');
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await API.post('/customers/identify', formData);
      setCustomer(data.data);
      toast.success('Welcome!');
      navigate(redirect);
    } catch (error) {
      toast.error('Failed to log in. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card p-8">
        <div className="w-16 h-16 bg-primary-lighter rounded-full flex items-center justify-center mx-auto mb-6">
          <User size={30} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary text-center mb-2">Login / Register</h2>
        <p className="text-text-secondary text-sm text-center mb-8">Enter your details to proceed to checkout or view orders.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field" 
              placeholder="e.g. John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field" 
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit phone number"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full flex justify-center items-center gap-2 mt-6"
          >
            {loading ? 'Processing...' : 'Continue'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
