import React, { useState } from 'react';
import { Search, X, Filter, Grid3X3, List } from 'lucide-react';
import FilterPanel from './FilterPanel';

const ProductToolbar = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
      <div className="sticky top-20 z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 pointer-events-none mt-6 mb-8">
        <div className="bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 px-3 sm:px-5 py-1.5 flex items-center justify-between pointer-events-auto w-full">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">

            {/* Categories / Filter Button */}
            <button
              onClick={() => setFilterOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-primary text-white font-bold text-xs tracking-wider transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Filter size={16} />
              <span className="hidden sm:inline">CATEGORIES</span>
            </button>

            {/* Search — always visible on md+, icon-toggle on mobile */}
            {/* Desktop search (always expanded) */}
            <div className="hidden sm:flex items-center h-[42px] sm:h-[48px] bg-gray-100 rounded-full px-3 w-40 sm:w-64 transition-all duration-300">
              <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} className="text-gray-400 hover:text-gray-600 ml-1 flex-shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile search — icon that expands inline */}
            <div className="flex sm:hidden items-center">
              {mobileSearchOpen ? (
                <div className="flex items-center h-[42px] bg-gray-100 rounded-full px-3 w-36 transition-all duration-300">
                  <Search size={15} className="text-gray-400 mr-1.5 flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
                  />
                  <button
                    onClick={() => { onSearchChange(''); setMobileSearchOpen(false); }}
                    className="text-gray-400 hover:text-gray-600 ml-1 flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMobileSearchOpen(true)}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-all"
                >
                  <Search size={18} />
                </button>
              )}
            </div>

          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-full p-1 h-[42px] sm:h-[48px] flex-shrink-0 ml-2">
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 h-full rounded-full text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={14} />
              <span className="hidden sm:inline">LIST</span>
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 h-full rounded-full text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid3X3 size={14} />
              <span className="hidden sm:inline">GRID</span>
            </button>
          </div>
        </div>
      </div>

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(cat) => { onCategoryChange(cat); setFilterOpen(false); }}
        filters={filters}
        onFilterChange={onFilterChange}
      />
    </>
  );
};

export default ProductToolbar;
