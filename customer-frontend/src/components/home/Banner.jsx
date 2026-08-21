import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const getOptimizedUrl = (url, width = 1200) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  try {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/c_scale,w_${width},q_auto,f_auto/${parts[1]}`;
    }
  } catch (e) {}
  return url;
};

const Banner = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100">
      <div className="relative w-full">
        {/* Invisible placeholder to establish responsive height perfectly matched to the image */}
        <img 
          src={getOptimizedUrl(banners[0].image?.url, 1200)} 
          alt="placeholder" 
          className="w-full h-auto invisible block" 
        />
        
        {banners.map((banner, index) => (
          <div
            key={banner._id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <picture>
              <source media="(max-width: 640px)" srcSet={getOptimizedUrl(banner.image?.url, 640)} />
              <source media="(max-width: 1024px)" srcSet={getOptimizedUrl(banner.image?.url, 1024)} />
              <img
                src={getOptimizedUrl(banner.image?.url, 1600)}
                alt={banner.title || 'Banner'}
                className="w-full h-full object-contain"
              />
            </picture>
            {banner.title && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end">
                <p className="text-white font-bold text-lg sm:text-xl p-4 sm:p-6">{banner.title}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md transition-all"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Banner;
