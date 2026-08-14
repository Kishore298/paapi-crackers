import React from 'react';
import { X, ChevronRight, Check } from 'lucide-react';

const FilterPanel = ({
  open,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  filters,
  onFilterChange,
}) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white z-[70] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="bg-primary text-white p-6 relative flex-shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
          <h2 className="text-2xl font-black italic tracking-wider uppercase mb-1">CATEGORIES</h2>
          <p className="text-[10px] font-bold text-white/70 tracking-[0.2em] uppercase">NAVIGATE CATALOGUE</p>
        </div>

        {/* Category List & Filters */}
        <div className="flex-1 overflow-y-auto">
           {/* All Categories Item */}
           <button
             onClick={() => { onCategoryChange(null); onClose(); }}
             className={`w-full text-left px-6 py-5 border-b border-gray-100 flex items-center justify-between transition-colors ${!selectedCategory ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
           >
             <span className={`text-xs font-bold ${!selectedCategory ? 'text-primary' : 'text-gray-700'}`}>ALL PRODUCTS</span>
             <ChevronRight size={16} className={!selectedCategory ? 'text-primary' : 'text-gray-400'} />
           </button>
           
           {/* Map categories */}
           {categories.map((cat) => (
             <button
               key={cat._id}
               onClick={() => { onCategoryChange(cat._id); onClose(); }}
               className={`w-full text-left px-6 py-5 border-b border-gray-100 flex items-center justify-between transition-colors ${selectedCategory === cat._id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
             >
               <span className={`text-xs font-bold uppercase ${selectedCategory === cat._id ? 'text-primary' : 'text-gray-700'}`}>{cat.name}</span>
               <ChevronRight size={16} className={selectedCategory === cat._id ? 'text-primary' : 'text-gray-400'} />
             </button>
           ))}

           {/* Price & Availability Filters */}
           <div className="p-6 bg-gray-50 space-y-6">
             <div>
               <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase tracking-wider">Price Range</h4>
               <div className="space-y-2">
                 {[
                   { label: 'All', value: '' },
                   { label: 'Under ₹100', value: '0-100' },
                   { label: '₹100 - ₹500', value: '100-500' },
                   { label: '₹500 - ₹1000', value: '500-1000' },
                   { label: 'Above ₹1000', value: '1000-' },
                 ].map(range => (
                    <button
                      key={range.value}
                      onClick={() => onFilterChange({ ...filters, priceRange: range.value })}
                      className={`flex items-center gap-2 w-full px-4 py-3 bg-white border rounded-xl text-xs font-medium transition-all ${
                        filters.priceRange === range.value ? 'border-primary text-primary shadow-sm' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {filters.priceRange === range.value && <Check size={14} />} {range.label}
                    </button>
                 ))}
               </div>
             </div>
             
             <div>
               <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase tracking-wider">Availability</h4>
               <div className="space-y-2">
                 {[
                   { label: 'All', value: '' },
                   { label: 'In Stock', value: 'inStock' },
                   { label: 'Out of Stock', value: 'outOfStock' },
                 ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onFilterChange({ ...filters, availability: opt.value })}
                      className={`flex items-center gap-2 w-full px-4 py-3 bg-white border rounded-xl text-xs font-medium transition-all ${
                        filters.availability === opt.value ? 'border-primary text-primary shadow-sm' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {filters.availability === opt.value && <Check size={14} />} {opt.label}
                    </button>
                 ))}
               </div>
             </div>
           </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 text-center bg-white flex-shrink-0">
          <p className="text-[10px] font-bold italic text-gray-400 tracking-wider">CHOOSE A GROUP TO SCROLL</p>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;
