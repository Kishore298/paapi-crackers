import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import Banner from '../components/home/Banner';
import ProductToolbar from '../components/home/ProductToolbar';
import ProductCard from '../components/home/ProductCard';
import ComboCard from '../components/home/ComboCard';
import FloatingCart from '../components/home/FloatingCart';
import { Store } from 'lucide-react';

const HomePage = ({ settings }) => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({ priceRange: '', availability: '' });

  // Pagination state (for simplicity, loading all in one go or using client side filtering for a smooth feel)
  // Real app might use server side filtering if dataset is huge.
  // Given crackers catalogue is usually < 500 items, we can fetch all active and filter client-side for better UX.

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [bannersRes, categoriesRes, productsRes, combosRes] = await Promise.all([
        API.get('/banners?active=true'),
        API.get('/categories?active=true'),
        API.get('/products?active=true&limit=1000'), // fetch all active
        API.get('/combos?active=true')
      ]);

      setBanners(bannersRes.data.data);
      setCategories(categoriesRes.data.data);
      setProducts(productsRes.data.data);
      setCombos(combosRes.data.data);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
      setError('Failed to load catalogue. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering
  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.category?._id !== selectedCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.sku.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Price range
    const price = p.discountPrice && p.discountPrice < p.sellingPrice ? p.discountPrice : p.sellingPrice;
    if (filters.priceRange === '0-100' && price > 100) return false;
    if (filters.priceRange === '100-500' && (price <= 100 || price > 500)) return false;
    if (filters.priceRange === '500-1000' && (price <= 500 || price > 1000)) return false;
    if (filters.priceRange === '1000-' && price <= 1000) return false;

    // Availability
    if (filters.availability === 'inStock' && p.stock === 0) return false;
    if (filters.availability === 'outOfStock' && p.stock > 0) return false;

    // Hide out of stock if setting says so
    if (!settings?.inventory?.showOutOfStock && p.stock === 0) return false;

    return true;
  });

  const filteredCombos = combos.filter(c => {
    if (selectedCategory) return false; // Combos usually don't have a category, hide them if a category is selected unless we define a 'Combos' category.
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    const price = c.price;
    if (filters.priceRange === '0-100' && price > 100) return false;
    if (filters.priceRange === '100-500' && (price <= 100 || price > 500)) return false;
    if (filters.priceRange === '500-1000' && (price <= 500 || price > 1000)) return false;
    if (filters.priceRange === '1000-' && price <= 1000) return false;

    if (filters.availability === 'inStock' && c.availableStock === 0) return false;
    if (filters.availability === 'outOfStock' && c.availableStock > 0) return false;
    
    if (!settings?.inventory?.showOutOfStock && c.availableStock === 0) return false;

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-discount font-medium">{error}</p>
        <button onClick={fetchData} className="mt-4 btn-primary">Retry</button>
      </div>
    );
  }

  const showCombos = !selectedCategory && filteredCombos.length > 0;

  return (
    <div className="pb-24">
      {/* Banner Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Banner banners={banners} />
      </div>

      {/* Toolbar (Sticky) */}
      <ProductToolbar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        productCount={filteredProducts.length + (showCombos ? filteredCombos.length : 0)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Product List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {filteredProducts.length === 0 && (!showCombos) ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-border">
            <Store className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-text-primary">No products found</h3>
            <p className="text-text-secondary mt-1">Try adjusting your filters or search query.</p>
            {(searchQuery || selectedCategory || filters.priceRange || filters.availability) && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setFilters({ priceRange: '', availability: '' });
                }}
                className="mt-4 text-primary font-medium hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Combos Section (only show when 'All' is selected) */}
            {showCombos && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">Special Offers</h2>
                  <div className="h-px bg-border flex-1"></div>
                </div>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  : "flex flex-col gap-3"
                }>
                  {filteredCombos.map(combo => (
                    <ComboCard key={combo._id} combo={combo} viewMode={viewMode} />
                  ))}
                </div>
              </section>
            )}

            {/* Products by Category */}
            {categories
              .filter(c => !selectedCategory || c._id === selectedCategory)
              .map(category => {
                const categoryProducts = filteredProducts.filter(p => p.category?._id === category._id);
                if (categoryProducts.length === 0) return null;

                return (
                  <section key={category._id} id={`category-${category._id}`} className="scroll-mt-32">
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-2xl font-bold text-text-primary">{category.name}</h2>
                      <div className="h-px bg-border flex-1"></div>
                    </div>
                    <div className={viewMode === 'grid' 
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
                      : "flex flex-col gap-3"
                    }>
                      {categoryProducts.map(product => (
                        <ProductCard key={product._id} product={product} viewMode={viewMode} />
                      ))}
                    </div>
                  </section>
                );
            })}
          </div>
        )}
      </div>

      <FloatingCart />
    </div>
  );
};

export default HomePage;
