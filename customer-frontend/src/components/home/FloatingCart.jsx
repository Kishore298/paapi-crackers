import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import { formatCurrency } from '../../utils/formatCurrency';

const FloatingCart = () => {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto floating-cart">
      <button
        onClick={() => navigate('/cart')}
        className="w-full flex items-center justify-between bg-primary text-white px-5 py-3.5 rounded-2xl shadow-float hover:bg-primary-dark transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart size={22} />
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <span className="font-medium text-sm">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{formatCurrency(subtotal)}</span>
          <ArrowRight size={18} />
        </div>
      </button>
    </div>
  );
};

export default FloatingCart;
