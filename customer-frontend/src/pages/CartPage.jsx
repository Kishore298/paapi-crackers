import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Trash2, ArrowLeft, X } from 'lucide-react';
import useCartStore from '../store/cartStore';
import QuantityControl from '../components/common/QuantityControl';
import ConfirmModal from '../components/common/ConfirmModal';
import { formatCurrency } from '../utils/formatCurrency';

const CartPage = ({ settings }) => {
  const navigate = useNavigate();
  const { items, clearCart, removeItem, incrementItem, decrementItem, setItemQuantity } = useCartStore();
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const globalDiscount = Number(settings?.pricing?.globalDiscount) || 0;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const deliveryCharge = settings?.delivery?.deliveryCharge || 0;
  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold || 0;
  const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const minOrderAmount = settings?.orders?.minOrderAmount || 0;
  const maxOrderAmount = settings?.orders?.maxOrderAmount || 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleClearCart = () => {
    setShowClearConfirm(true);
  };

  const executeClearCart = () => {
    setIsClearing(true);
    setTimeout(() => {
      clearCart();
      setIsClearing(false);
    }, 300);
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
    navigate('/checkout');
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

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => {
              const originalMrp = (globalDiscount > 0 && globalDiscount < 100 && !item.isCombo)
                ? Math.round(item.price / (1 - (globalDiscount / 100)))
                : item.mrp;
              
              return (
              <div key={item.isCombo ? item.comboId : item.productId} className="card p-2 sm:p-3 flex gap-3 items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-semibold text-sm sm:text-base text-text-primary truncate pr-2">{item.name}</h3>
                    <button
                      onClick={() => removeItem(item.isCombo ? item.comboId : item.productId, item.isCombo)}
                      className="text-text-secondary hover:text-discount p-1 -mt-1 -mr-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="price-green font-bold text-sm sm:text-base">{formatCurrency(item.price)}</span>

                      {!item.isCombo && originalMrp > item.price && (
                        <span className="text-text-secondary line-through text-[11px]">{formatCurrency(originalMrp)}</span>
                      )}
                      
                      {item.isCombo ? (
                        <span className="badge bg-primary-lighter text-primary text-[10px] py-0.5 px-1.5">COMBO</span>
                      ) : (
                        <span className="text-xs text-text-secondary">{item.packQuantity || '1'} pcs</span>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <QuantityControl
                        quantity={item.quantity}
                        onIncrement={() => incrementItem(item.isCombo ? item.comboId : item.productId, item.isCombo)}
                        onDecrement={() => decrementItem(item.isCombo ? item.comboId : item.productId, item.isCombo)}
                        onSetQuantity={(val) => setItemQuantity(item.isCombo ? item.comboId : item.productId, val, item.isCombo)}
                        maxStock={item.maxStock}
                        compact
                      />
                    </div>
                  </div>
                  
                  {item.quantity >= item.maxStock && (
                    <p className="text-[10px] text-discount text-right mt-0.5">Max stock</p>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Order Summary — Sticky on mobile and desktop */}
        <div className="lg:col-span-1 sticky bottom-0 z-20 lg:static lg:z-auto -mx-4 sm:mx-0 lg:mx-0">
          <div className="lg:sticky lg:top-24">
            <div
              className="card p-4 lg:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:shadow-sm border-t border-primary/20 lg:border lg:border-border rounded-t-2xl lg:rounded-2xl bg-white"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <h2 className="text-lg lg:text-xl font-bold text-text-primary mb-4 lg:mb-6">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {globalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{globalDiscount}% Discount Applied</span>
                    <span>-{formatCurrency(items.reduce((sum, item) => !item.isCombo ? sum + (item.mrp - item.price) * item.quantity : sum, 0))}</span>
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

                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between items-center mb-4">
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

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={executeClearCart}
        title="Clear Cart"
        message="Are you sure you want to clear your cart? All items will be removed."
        confirmText="Clear Cart"
      />
    </div>
  );
};

export default CartPage;
