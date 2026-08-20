import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Trash2, ArrowLeft, X } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import QuantityControl from '../components/common/QuantityControl';
import { formatCurrency } from '../utils/formatCurrency';

const CartPage = ({ settings }) => {
  const navigate = useNavigate();
  const { customer } = useAuthStore();
  const { items, clearCart, removeItem, incrementItem, decrementItem } = useCartStore();
  const [isClearing, setIsClearing] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = items.reduce((sum, item) => {
    if (!item.isCombo && item.discountPrice && item.discountPrice < item.mrp) {
      return sum + (item.mrp - item.discountPrice) * item.quantity;
    }
    return sum;
  }, 0);

  const deliveryCharge = settings?.delivery?.deliveryCharge || 0;
  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold || 0;
  const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const minOrderAmount = settings?.orders?.minOrderAmount || 0;
  const maxOrderAmount = settings?.orders?.maxOrderAmount || 0;

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setIsClearing(true);
      setTimeout(() => {
        clearCart();
        setIsClearing(false);
      }, 300); // small delay for animation
    }
  };

  const handleCheckout = () => {
    if (minOrderAmount > 0 && subtotal < minOrderAmount) {
      alert(`Minimum order amount is ${formatCurrency(minOrderAmount)}`);
      return;
    }
    if (maxOrderAmount > 0 && subtotal > maxOrderAmount) {
      alert(`Maximum order amount is ${formatCurrency(maxOrderAmount)}`);
      return;
    }
    
    if (!customer) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-primary-lighter rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={40} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Your cart is empty</h2>
        <p className="text-text-secondary mb-8">Looks like you haven't added any crackers yet.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Your Cart</h1>
        <button
          onClick={handleClearCart}
          disabled={isClearing}
          className="flex items-center gap-2 text-sm font-medium text-discount hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
        >
          <Trash2 size={16} />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.isCombo ? item.comboId : item.productId} className="card p-4 flex gap-4 items-center">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                    No Image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-text-primary truncate pr-4">{item.name}</h3>
                  <button
                    onClick={() => removeItem(item.isCombo ? item.comboId : item.productId, item.isCombo)}
                    className="text-text-secondary hover:text-discount p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {item.isCombo ? (
                  <span className="badge bg-primary-lighter text-primary text-[10px] mb-2">COMBO</span>
                ) : (
                  <p className="text-xs text-text-secondary mb-2">{item.sku}</p>
                )}

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="price-green font-bold text-lg">{formatCurrency(item.price)}</span>
                    {!item.isCombo && item.discountPrice && item.discountPrice < item.mrp && (
                      <span className="text-xs text-text-secondary line-through">
                        {formatCurrency(item.mrp)}
                      </span>
                    )}
                  </div>
                  <QuantityControl
                    quantity={item.quantity}
                    onIncrement={() => incrementItem(item.isCombo ? item.comboId : item.productId, item.isCombo)}
                    onDecrement={() => decrementItem(item.isCombo ? item.comboId : item.productId, item.isCombo)}
                    maxStock={item.maxStock}
                    compact
                  />
                </div>
                
                {item.quantity >= item.maxStock && (
                  <p className="text-[10px] text-discount text-right mt-1">Maximum stock reached</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-xl font-bold text-text-primary mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Product Discount</span>
                  <span>-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-text-secondary">
                <span>Delivery Charge</span>
                {isFreeDelivery ? (
                  <span className="text-success font-medium">Free</span>
                ) : (
                  <span>{formatCurrency(deliveryCharge)}</span>
                )}
              </div>
              
              {freeDeliveryThreshold > 0 && !isFreeDelivery && (
                <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-xl flex items-center justify-between">
                  <span>Add {formatCurrency(freeDeliveryThreshold - subtotal)} more for free delivery!</span>
                </div>
              )}

              <div className="border-t border-border pt-4 mt-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold text-text-primary">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(subtotal + (isFreeDelivery ? 0 : deliveryCharge))}
                  </span>
                </div>

                {minOrderAmount > 0 && subtotal < minOrderAmount && (
                  <p className="text-discount text-xs text-center mb-4 font-medium">
                    Minimum order amount is {formatCurrency(minOrderAmount)}. Add more items to checkout.
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={minOrderAmount > 0 && subtotal < minOrderAmount}
                  className={`btn-primary w-full flex items-center justify-center gap-2 ${
                    minOrderAmount > 0 && subtotal < minOrderAmount ? 'opacity-50 cursor-not-allowed hover:bg-primary hover:shadow-none' : ''
                  }`}
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
