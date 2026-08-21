import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, User, CreditCard, ChevronRight, AlertCircle, Building2, Shield } from 'lucide-react';
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
  const [activeStep, setActiveStep] = useState(1); // 1: Info, 2: Address, 3: Payment
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    gstin: customer?.gstin || '',
    address: '',
    city: '',
    state: 'Tamil Nadu', // Default
    pincode: '',
    paymentMethod: 'cash',
  });

  const deliveryCharge = settings?.delivery?.deliveryCharge || 0;
  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold || 0;
  const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const grandTotal = subtotal + (isFreeDelivery ? 0 : deliveryCharge);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    } else if (!customer) {
      navigate('/login?redirect=/checkout');
    }
  }, [items, customer, navigate]);

  // Pre-fill last address if customer is known
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

  const handleNextStep = async (step) => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.phone.trim()) {
        return toast.error('Name and Phone are required.');
      }
      if (formData.phone.trim().length < 10) {
        return toast.error('Please enter a valid phone number.');
      }

      try {
        setLoading(true);
        // Identify or create customer silently
        const { data } = await API.post('/customers/identify', {
          name: formData.name,
          phone: formData.phone,
        });
        setCustomer(data.data);
        setActiveStep(2);
      } catch (err) {
        toast.error('Failed to process customer details.');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.pincode.trim()) {
        return toast.error('Please fill all address fields.');
      }
      setActiveStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);

      const orderPayload = {
        customerId: customer._id,
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
        paymentMethod: formData.paymentMethod,
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
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Customer Details */}
          <div className={`card overflow-hidden transition-all ${activeStep !== 1 ? 'opacity-70' : ''}`}>
            <div 
              className={`p-3 flex items-center justify-between cursor-pointer ${activeStep === 1 ? 'bg-primary-lighter/50 border-b border-border' : ''}`}
              onClick={() => setActiveStep(1)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 text-sm rounded-full flex items-center justify-center font-bold ${activeStep === 1 ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'}`}>1</div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2"><User size={18} className="text-primary"/> Personal Info</h2>
              </div>
              {activeStep > 1 && <span className="text-sm font-medium text-success flex items-center">Done <ChevronRight size={16}/></span>}
            </div>

            {activeStep === 1 && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Phone Number *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="10-digit mobile number" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-1">Email (Optional)</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="For order updates" />
                  </div>
                </div>
                <button onClick={() => handleNextStep(1)} disabled={loading} className="btn-primary mt-4 w-full md:w-auto text-sm py-2">Continue to Address</button>
              </div>
            )}
          </div>

          {/* Step 2: Shipping Address & GSTIN */}
          <div className={`card overflow-hidden transition-all ${activeStep !== 2 ? 'opacity-70' : ''}`}>
            <div 
              className={`p-3 flex items-center justify-between cursor-pointer ${activeStep === 2 ? 'bg-primary-lighter/50 border-b border-border' : ''}`}
              onClick={() => activeStep > 1 && setActiveStep(2)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 text-sm rounded-full flex items-center justify-center font-bold ${activeStep === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'}`}>2</div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2"><MapPin size={18} className="text-primary"/> Shipping & GST</h2>
              </div>
              {activeStep > 2 && <span className="text-sm font-medium text-success flex items-center">Done <ChevronRight size={16}/></span>}
            </div>

            {activeStep === 2 && (
              <div className="p-6 space-y-4 bg-gray-50/50">
                
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

                <div className="border-t border-border mt-6 pt-6">
                  <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2"><Building2 size={16} className="text-text-secondary"/> Business Buyer? (Optional)</h3>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">GSTIN Number</label>
                    <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className="input-field uppercase" placeholder="Enter valid GSTIN for B2B Invoice" />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setActiveStep(1)} className="btn-outline flex-1 md:flex-none text-sm py-2">Back</button>
                  <button onClick={() => handleNextStep(2)} className="btn-primary flex-1 md:flex-none text-sm py-2">Continue to Payment</button>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Payment */}
          <div className={`card overflow-hidden transition-all ${activeStep !== 3 ? 'opacity-70' : ''}`}>
             <div 
              className={`p-3 flex items-center justify-between cursor-pointer ${activeStep === 3 ? 'bg-primary-lighter/50 border-b border-border' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 text-sm rounded-full flex items-center justify-center font-bold ${activeStep === 3 ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'}`}>3</div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2"><CreditCard size={18} className="text-primary"/> Payment Method</h2>
              </div>
            </div>

            {activeStep === 3 && (
              <div className="p-6">
                <div className="border border-primary/20 bg-primary-lighter/10 rounded-2xl p-5 mb-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-text-primary text-base sm:text-lg mb-2">Pay via UPI</h3>
                      <p className="text-text-secondary text-xs sm:text-sm mb-4">Please complete your payment using any of the UPI apps below to the following number.</p>
                      
                      <div className="bg-white rounded-xl border border-border p-3 sm:p-4 mb-4 shadow-sm">
                        <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wider font-bold mb-1">Official Payment Number</p>
                        <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-wider mb-3 sm:mb-4">
                          {settings?.business?.phone || settings?.website?.contactInfo?.whatsapp || '+91 00000 00000'}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center min-w-[70px] sm:min-w-[90px] h-10 sm:h-12">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-4 sm:h-5" />
                          </div>
                          <div className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center min-w-[70px] sm:min-w-[90px] h-10 sm:h-12">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-5 sm:h-6" />
                          </div>
                          <div className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center min-w-[70px] sm:min-w-[90px] h-10 sm:h-12">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-3 sm:h-4" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50/80 border border-yellow-200 text-yellow-800 p-3 sm:p-4 rounded-xl text-xs sm:text-sm flex gap-2 sm:gap-3 items-start">
                        <AlertCircle className="shrink-0 mt-0.5 w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                        <div>
                          <p className="font-bold mb-1 text-yellow-900">Action Required!</p>
                          <p>After completing the payment, please share the success screenshot to our WhatsApp number <strong className="font-bold underline">{settings?.website?.contactInfo?.whatsapp || settings?.business?.phone || '+91 00000 00000'}</strong> so we can confirm and process your order immediately.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setActiveStep(2)} className="btn-outline flex-1 md:flex-none">Back</button>
                  <button 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, paymentMethod: 'upi' }));
                      handlePlaceOrder();
                    }} 
                    disabled={loading} 
                    className="btn-success flex-1 md:flex-none flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing...' : `Place Order - ${formatCurrency(grandTotal)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

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
              <Shield size={12}/> Secure encrypted checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
