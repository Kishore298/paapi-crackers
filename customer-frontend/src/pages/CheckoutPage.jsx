import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, User, Building2, Shield } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import API from '../api/axios';
import { formatCurrency } from '../utils/formatCurrency';
import AddressSelector from '../components/checkout/AddressSelector';

const CheckoutPage = ({ settings }) => {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { customer, setCustomer } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    gstin: customer?.gstin || '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
  });

  const deliveryCharge = settings?.delivery?.deliveryCharge || 0;
  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold || 0;
  const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const grandTotal = subtotal + (isFreeDelivery ? 0 : deliveryCharge);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Pre-fill from customer data if logged in
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (customer?._id) {
        try {
          const { data } = await API.get(`/customers/${customer._id}`);
          if (data.data.addresses?.length > 0) {
            const defaultAddress = data.data.addresses.find(a => a.isDefault) || data.data.addresses[0];
            setSelectedAddressId(defaultAddress._id);
            setFormData(prev => ({
              ...prev,
              name: data.data.name || prev.name,
              phone: data.data.phone || prev.phone,
              address: defaultAddress.address || '',
              city: defaultAddress.city || '',
              state: defaultAddress.state || 'Tamil Nadu',
              pincode: defaultAddress.pincode || '',
              gstin: data.data.gstin || prev.gstin,
              email: data.data.email || prev.email,
            }));
          }
        } catch (error) {
          console.error("Could not fetch customer details", error);
        }
      }
    };
    fetchCustomerData();
  }, [customer?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    // Validate required fields
    if (!formData.name.trim() || !formData.phone.trim()) {
      return toast.error('Name and Phone are required.');
    }
    if (formData.phone.trim().length < 10) {
      return toast.error('Please enter a valid 10-digit phone number.');
    }
    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.pincode.trim()) {
      return toast.error('Please fill all address fields.');
    }

    try {
      setLoading(true);

      // If not logged in, identify/create customer first
      let currentCustomer = customer;
      if (!currentCustomer) {
        const { data: identifyData } = await API.post('/customers/identify', {
          name: formData.name,
          phone: formData.phone,
        });
        currentCustomer = identifyData.data;
        setCustomer(currentCustomer);
      }

      const orderPayload = {
        customerId: currentCustomer._id,
        customerDetails: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        },
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        items: items.map(item => ({
          productId: !item.isCombo ? item.productId : undefined,
          comboId: item.isCombo ? item.comboId : undefined,
          isCombo: item.isCombo,
          quantity: item.quantity
        })),
        gstin: formData.gstin,
        paymentMethod: 'upi',
      };

      const { data } = await API.post('/orders', orderPayload);

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${data.data.orderNumber}`);

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Single Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Personal Details */}
          <div className="card overflow-hidden">
            <div className="p-3 bg-primary-lighter/50 border-b border-border">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <User size={18} className="text-primary" /> Personal Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="John Doe"
                    disabled={!!customer}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="10-digit mobile number"
                    disabled={!!customer}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-1">Email (Optional)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="For order updates" />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address & GSTIN */}
          <div className="card overflow-hidden">
            <div className="p-3 bg-primary-lighter/50 border-b border-border">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <MapPin size={18} className="text-primary" /> Shipping Address
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {customer ? (
                <AddressSelector
                  customer={customer}
                  setCustomer={setCustomer}
                  selectedId={selectedAddressId}
                  onSelect={(addr) => {
                    setSelectedAddressId(addr._id);
                    setFormData(prev => ({
                      ...prev,
                      address: addr.address || '',
                      city: addr.city || '',
                      state: addr.state || 'Tamil Nadu',
                      pincode: addr.pincode || ''
                    }));
                  }}
                />
              ) : (
                /* New user — inline address form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Complete Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="input-field resize-none"
                      placeholder="House/Flat No., Street Name, Area"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">City *</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" placeholder="City / District" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">State *</label>
                      <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-field" placeholder="State" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Pincode *</label>
                      <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="input-field" placeholder="6-digit pincode" />
                    </div>
                  </div>
                </div>
              )}

              {/* GSTIN */}
              <div className="border-t border-border mt-4 pt-4">
                <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Building2 size={16} className="text-text-secondary" /> Business Buyer? (Optional)
                </h3>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">GSTIN Number</label>
                  <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className="input-field uppercase" placeholder="Enter valid GSTIN for B2B Invoice" />
                </div>
              </div>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="btn-success w-full flex items-center justify-center gap-2 text-base py-3"
          >
            {loading ? 'Processing...' : `Place Order — ${formatCurrency(grandTotal)}`}
          </button>
        </div>

        {/* Right Column: Order Summary (Sticky) */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h3 className="font-bold text-lg text-text-primary mb-4 border-b border-border pb-3">Order Summary</h3>

            <div className="max-h-60 overflow-y-auto pr-2 mb-4 space-y-3 scrollbar-hide">
              {items.map(item => (
                <div key={item.isCombo ? item.comboId : item.productId} className="flex justify-between text-sm">
                  <span className="text-text-secondary line-clamp-1 pr-2 flex-1">{item.name} <span className="text-xs">x{item.quantity}</span></span>
                  <span className="font-medium text-text-primary">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 space-y-2 text-sm mb-4">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Delivery Charge</span>
                {isFreeDelivery ? (
                  <span className="text-success font-medium">Free</span>
                ) : (
                  <span>{formatCurrency(deliveryCharge)}</span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
              <span className="font-bold text-text-primary">Total to Pay</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
            </div>

            <p className="text-[10px] text-text-secondary text-center mt-3 flex items-center justify-center gap-1">
              <Shield size={12} /> Secure encrypted checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
