import React from 'react';
import { Plus, Minus } from 'lucide-react';

const QuantityControl = ({ quantity, onIncrement, onDecrement, maxStock, compact = false, onSetQuantity, disabled = false }) => {
  const isMaxed = quantity >= maxStock;

  const handleInputChange = (e) => {
    if (disabled) return;
    let val = parseInt(e.target.value) || 0;
    if (val < 0) val = 0;
    if (val > maxStock) val = maxStock;
    if (onSetQuantity) {
      onSetQuantity(val);
    }
  };

  return (
    <div className={`flex items-center gap-0.5 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <button 
        onClick={onDecrement} 
        className={compact ? 'qty-btn w-7 h-7' : 'qty-btn'} 
        disabled={quantity <= 0 || disabled}
      >
        <Minus size={compact ? 12 : 14} />
      </button>
      <input 
        type="number"
        min="0"
        max={maxStock}
        value={quantity || ''}
        onChange={handleInputChange}
        placeholder="0"
        disabled={disabled}
        className={compact ? 'qty-display w-10 h-7 text-xs text-center border-none p-0 outline-none bg-transparent focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none' : 'qty-display w-12 text-center border-none p-0 outline-none bg-transparent focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none'}
      />
      <button
        onClick={onIncrement}
        disabled={isMaxed || maxStock === 0 || disabled}
        className={`${compact ? 'qty-btn w-7 h-7' : 'qty-btn'} ${isMaxed || maxStock === 0 || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Plus size={compact ? 12 : 14} />
      </button>
    </div>
  );
};

export default QuantityControl;
