import React from 'react';
import { Plus, Minus } from 'lucide-react';

const QuantityControl = ({ quantity, onIncrement, onDecrement, maxStock, compact = false }) => {
  const isMaxed = quantity >= maxStock;

  if (quantity === 0) {
    return (
      <button
        onClick={onIncrement}
        disabled={maxStock === 0}
        className={`btn-primary ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} ${
          maxStock === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {maxStock === 0 ? 'Out of Stock' : 'Add'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <button onClick={onDecrement} className={compact ? 'qty-btn w-7 h-7' : 'qty-btn'}>
        <Minus size={compact ? 12 : 14} />
      </button>
      <span className={compact ? 'qty-display w-6 h-7 text-xs' : 'qty-display'}>{quantity}</span>
      <button
        onClick={onIncrement}
        disabled={isMaxed}
        className={`${compact ? 'qty-btn w-7 h-7' : 'qty-btn'} ${isMaxed ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Plus size={compact ? 12 : 14} />
      </button>
    </div>
  );
};

export default QuantityControl;
