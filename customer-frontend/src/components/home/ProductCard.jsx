import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import useCartStore from '../../store/cartStore';
import QuantityControl from '../common/QuantityControl';
import ImageLightbox from './ImageLightbox';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { addItem, incrementItem, decrementItem, getItemQuantity } = useCartStore();

  const quantity = getItemQuantity(product._id);
  const hasDiscount = product.discountPrice && product.discountPrice < product.sellingPrice;
  const displayPrice = hasDiscount ? product.discountPrice : product.sellingPrice;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  if (viewMode === 'list') {
    return (
      <>
        <div className="card p-3 flex gap-3 items-center hover:shadow-card-hover transition-shadow">
          <div
            className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 cursor-pointer"
            onClick={() => product.image?.url && setLightboxOpen(true)}
          >
            {product.image?.url ? (
              <img src={product.image.url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">No Image</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-text-primary truncate">{product.name}</h3>
            <p className="text-xs text-text-secondary">{product.sku} · Pack: {product.packQuantity}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="price-green text-sm">{formatCurrency(displayPrice)}</span>
              {hasDiscount && (
                <span className="text-xs text-text-secondary line-through">{formatCurrency(product.sellingPrice)}</span>
              )}
            </div>
            {isOutOfStock && <span className="text-xs text-discount font-medium">Out of Stock</span>}
            {isLowStock && <span className="text-xs text-yellow-600 font-medium">Few Left</span>}
          </div>

          <div className="flex-shrink-0">
            <QuantityControl
              quantity={quantity}
              onIncrement={() => quantity === 0 ? addItem(product) : incrementItem(product._id)}
              onDecrement={() => decrementItem(product._id)}
              maxStock={product.stock}
              compact
            />
          </div>
        </div>

        {lightboxOpen && (
          <ImageLightbox imageUrl={product.image.url} alt={product.name} onClose={() => setLightboxOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="card overflow-hidden hover:shadow-card-hover transition-all duration-200 flex flex-col">
        {/* Image */}
        <div
          className="aspect-square bg-gray-50 overflow-hidden cursor-pointer relative"
          onClick={() => product.image?.url && setLightboxOpen(true)}
        >
          {product.image?.url ? (
            <img src={product.image.url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">No Image</div>
          )}
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-discount text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
              {Math.round(((product.sellingPrice - product.discountPrice) / product.sellingPrice) * 100)}% OFF
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-discount font-semibold text-xs px-3 py-1.5 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-semibold text-sm text-text-primary line-clamp-2 mb-1">{product.name}</h3>
          <p className="text-[11px] text-text-secondary mb-1">{product.sku} · Pack: {product.packQuantity}</p>

          {isLowStock && (
            <span className="text-[11px] text-yellow-600 font-medium mb-1">Few Left!</span>
          )}

          <div className="flex items-center gap-2 mb-3 mt-auto">
            <span className="price-green text-base">{formatCurrency(displayPrice)}</span>
            {hasDiscount && (
              <span className="text-xs text-text-secondary line-through">{formatCurrency(product.sellingPrice)}</span>
            )}
          </div>

          <QuantityControl
            quantity={quantity}
            onIncrement={() => quantity === 0 ? addItem(product) : incrementItem(product._id)}
            onDecrement={() => decrementItem(product._id)}
            maxStock={product.stock}
          />
        </div>
      </div>

      {lightboxOpen && (
        <ImageLightbox imageUrl={product.image.url} alt={product.name} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
};

export default ProductCard;
