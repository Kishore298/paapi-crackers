import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import useCartStore from '../../store/cartStore';
import QuantityControl from '../common/QuantityControl';
import ImageLightbox from './ImageLightbox';

// Inline YouTube icon
const YoutubeIcon = ({ size = 16, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M23.5 6.2a3.01 3.01 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3.01 3.01 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3.01 3.01 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3.01 3.01 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.5v-7l6.5 3.5-6.5 3.5z"/>
  </svg>
);


const ProductCard = ({ product, viewMode = 'grid', globalDiscount = 0 }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { addItem, incrementItem, decrementItem, getItemQuantity, setItemQuantity } = useCartStore();

  const quantity = getItemQuantity(product._id);
  const discountVal = Number(globalDiscount) || 0;
  const hasDiscount = discountVal > 0;
  
  // Calculate original striked down price based on discount
  const strikedPrice = hasDiscount && discountVal < 100
    ? Math.round(product.mrp / (1 - (discountVal / 100)))
    : 0;

  const displayPrice = product.mrp;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const itemTotal = quantity > 0 ? quantity * product.mrp : 0;

  // ──────────────── LIST VIEW ────────────────
  if (viewMode === 'list') {
    return (
      <>
        <div className="card p-3 flex gap-3 items-center hover:shadow-card-hover transition-shadow">
          {/* Image */}
          <div
            className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 cursor-pointer relative"
            onClick={() => product.image?.url && setLightboxOpen(true)}
          >
            {product.image?.url ? (
              <img src={product.image.url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">No Image</div>
            )}
            {hasDiscount && (
              <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-full z-10 leading-none">
                {Math.round(discountVal)}%
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-text-primary leading-snug">{product.name}</h3>
            <div className="flex items-end gap-1.5">
              <span className="text-sm font-bold text-success">₹{product.mrp}</span>
              {hasDiscount && (
                <span className="text-[10px] text-text-secondary line-through mb-[2px]">₹{strikedPrice}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {product.pcs && <span className="text-[10px] text-text-secondary uppercase">{product.pcs}</span>}
              {product.youtubeVideoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${product.youtubeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-[10px] font-bold uppercase"
                >
                  <YoutubeIcon size={12} /> WATCH
                </a>
              )}
            </div>
            {isOutOfStock && <span className="text-[10px] text-discount font-semibold">Out of Stock</span>}
            {isLowStock && <span className="text-[10px] text-yellow-600 font-semibold">Few Left</span>}
          </div>

          {/* Quantity */}
          <div className="flex-shrink-0">
            <QuantityControl
              quantity={quantity}
              onIncrement={() => quantity === 0 ? addItem({ ...product, displayPrice }) : incrementItem(product._id)}
              onDecrement={() => decrementItem(product._id)}
              onSetQuantity={(qty) => setItemQuantity(product._id, qty, false, { ...product, displayPrice })}
              maxStock={product.stock}
              disabled={isOutOfStock}
              compact
            />
          </div>

          {/* Total */}
          <div className="flex-shrink-0 text-right min-w-[60px]">
            <span className="text-lg font-bold text-success">{formatCurrency(itemTotal)}</span>
          </div>
        </div>

        {lightboxOpen && (
          <ImageLightbox imageUrl={product.image.url} alt={product.name} onClose={() => setLightboxOpen(false)} />
        )}
      </>
    );
  }

  // ──────────────── GRID VIEW ────────────────
  return (
    <>
      <div className="card overflow-hidden hover:shadow-card-hover transition-all duration-200 flex flex-col">
        {/* Image */}
        <div
          className="h-36 sm:h-44 bg-gray-50 overflow-hidden cursor-pointer relative"
          onClick={() => product.image?.url && setLightboxOpen(true)}
        >
          {product.image?.url ? (
            <img src={product.image.url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">No Image</div>
          )}
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-red-600 shadow-md text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
              {Math.round(discountVal)}% OFF
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-discount font-semibold text-xs px-3 py-1.5 rounded-lg">Out of Stock</span>
            </div>
          )}
          {product.youtubeVideoId && (
            <a
              href={`https://www.youtube.com/watch?v=${product.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 bg-black/70 hover:bg-black/85 text-white text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg backdrop-blur-sm transition-colors"
            >
              <YoutubeIcon size={14} className="text-red-500" /> WATCH VIDEO
            </a>
          )}
        </div>

        {/* Details */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-w-0">
          {/* Name + Price row */}
          <div className="flex items-start gap-1 mb-1">
            <h3 className="font-bold text-sm text-text-primary leading-snug flex-1 min-w-0">{product.name}</h3>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-base font-bold text-success leading-none pt-0.5">₹{product.mrp}</span>
              {hasDiscount && (
                <span className="text-[10px] text-text-secondary line-through mt-0.5">₹{strikedPrice}</span>
              )}
            </div>
          </div>

          {/* Pcs info */}
          <div className="flex items-center gap-2 mb-1">
            {product.pcs && <span className="text-[10px] text-text-secondary uppercase">{product.pcs}</span>}
          </div>

          {isLowStock && (
            <span className="text-[10px] text-yellow-600 font-semibold mb-1">Few Left!</span>
          )}

          {/* Quantity + Total */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="flex-shrink-0">
              <QuantityControl
                quantity={quantity}
                onIncrement={() => quantity === 0 ? addItem({ ...product, displayPrice }) : incrementItem(product._id)}
                onDecrement={() => decrementItem(product._id)}
                onSetQuantity={(qty) => setItemQuantity(product._id, qty, false, { ...product, displayPrice })}
                maxStock={product.stock}
                disabled={isOutOfStock}
                compact
              />
            </div>
            {quantity > 0 && (
              <div className="text-right">
                <span className="text-[9px] text-text-secondary uppercase block leading-tight">Total</span>
                <span className="text-sm font-bold text-text-primary">{formatCurrency(itemTotal)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <ImageLightbox imageUrl={product.image.url} alt={product.name} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
};

export default ProductCard;
