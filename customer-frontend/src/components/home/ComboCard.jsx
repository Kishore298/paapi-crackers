import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import useCartStore from '../../store/cartStore';
import QuantityControl from '../common/QuantityControl';
import ImageLightbox from './ImageLightbox';

const ComboCard = ({ combo, viewMode = 'grid' }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { addItem, incrementItem, decrementItem, getItemQuantity } = useCartStore();

  const quantity = getItemQuantity(combo._id, true);
  const isOutOfStock = combo.availableStock === 0;

  if (viewMode === 'list') {
    return (
      <>
        <div className="card p-3 flex gap-3 items-center border-l-4 border-l-primary hover:shadow-card-hover transition-shadow">
          <div
            className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 cursor-pointer"
            onClick={() => combo.image?.url && setLightboxOpen(true)}
          >
            {combo.image?.url ? (
              <img src={combo.image.url} alt={combo.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">Combo</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-text-primary truncate">{combo.name}</h3>
              <span className="badge bg-primary-lighter text-primary text-[10px]">COMBO</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="price-green text-sm">{formatCurrency(combo.price)}</span>
              {combo.savings > 0 && (
                <span className="text-xs text-discount font-medium">Save {formatCurrency(combo.savings)}</span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5 truncate">
              {combo.products?.map((cp) => `${cp.product?.name || 'Product'} x${cp.quantity}`).join(', ')}
            </p>
          </div>

          <QuantityControl
            quantity={quantity}
            onIncrement={() => quantity === 0 ? addItem(combo, true) : incrementItem(combo._id, true)}
            onDecrement={() => decrementItem(combo._id, true)}
            maxStock={combo.availableStock}
            compact
          />
        </div>

        {lightboxOpen && (
          <ImageLightbox imageUrl={combo.image.url} alt={combo.name} onClose={() => setLightboxOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="card overflow-hidden hover:shadow-card-hover transition-all duration-200 flex flex-col border-t-4 border-t-primary">
        <div
          className="aspect-square bg-gray-50 overflow-hidden cursor-pointer relative"
          onClick={() => combo.image?.url && setLightboxOpen(true)}
        >
          {combo.image?.url ? (
            <img src={combo.image.url} alt={combo.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary">Combo</div>
          )}
          <span className="absolute top-2 left-2 badge bg-primary text-white text-[10px]">COMBO</span>
          {combo.savings > 0 && (
            <span className="absolute top-2 right-2 bg-discount text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
              Save {formatCurrency(combo.savings)}
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-discount font-semibold text-xs px-3 py-1.5 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-semibold text-sm text-text-primary line-clamp-2 mb-1">{combo.name}</h3>
          
          {/* Included products */}
          <div className="text-[11px] text-text-secondary space-y-0.5 mb-2">
            {combo.products?.slice(0, 3).map((cp, i) => (
              <p key={i}>• {cp.product?.name || 'Product'} × {cp.quantity}</p>
            ))}
            {combo.products?.length > 3 && (
              <p className="text-primary">+{combo.products.length - 3} more</p>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3 mt-auto">
            <span className="price-green text-base">{formatCurrency(combo.price)}</span>
          </div>

          <QuantityControl
            quantity={quantity}
            onIncrement={() => quantity === 0 ? addItem(combo, true) : incrementItem(combo._id, true)}
            onDecrement={() => decrementItem(combo._id, true)}
            maxStock={combo.availableStock}
          />
        </div>
      </div>

      {lightboxOpen && (
        <ImageLightbox imageUrl={combo.image.url} alt={combo.name} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
};

export default ComboCard;
