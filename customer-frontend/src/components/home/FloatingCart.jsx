import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import { formatCurrency } from '../../utils/formatCurrency';

const FloatingCart = () => {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (itemCount === 0) return null;

  // Get up to 4 unique product images (item.image is stored as a plain URL string)
  const productImages = items
    .filter((item) => item.image)
    .slice(0, 4)
    .map((item) => item.image);

  return (
    <div className="fixed bottom-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <button
        onClick={() => navigate('/cart')}
        className="pointer-events-auto flex items-center gap-2 pl-2 pr-4 py-2 rounded-2xl shadow-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          boxShadow: '0 8px 32px rgba(124, 58, 237, 0.45), 0 2px 8px rgba(0,0,0,0.18)',
        }}
      >
        {/* Stacked product images */}
        <div className="relative flex items-center flex-shrink-0" style={{ width: productImages.length > 0 ? 28 + (productImages.length - 1) * 20 : 40, height: 44 }}>
          {productImages.length > 0 ? (
            productImages.map((url, i) => (
              <div
                key={i}
                className="absolute rounded-xl border-2 border-white overflow-hidden bg-white"
                style={{
                  width: 40,
                  height: 40,
                  left: i * 20,
                  zIndex: productImages.length - i,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  top: 2,
                }}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div
              className="rounded-xl border-2 border-white bg-purple-400 flex items-center justify-center"
              style={{ width: 40, height: 40 }}
            >
              <ShoppingBag size={20} className="text-white" />
            </div>
          )}
        </div>

        {/* Spacer after stacked images */}
        <div style={{ width: productImages.length > 1 ? (productImages.length - 1) * 20 : 4 }} />

        {/* Center: item count */}
        <div className="text-left pr-2">
          <p className="text-white text-[10px] opacity-75 leading-tight">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
          <p className="text-white font-bold text-sm leading-tight">
            {formatCurrency(subtotal)}
          </p>
        </div>
      </button>
    </div>
  );
};

export default FloatingCart;
