import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const ImageLightbox = ({ imageUrl, alt, onClose }) => {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Push a history state so browser back closes lightbox
    window.history.pushState({ lightbox: true }, '');
    
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center lightbox-overlay"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
      >
        <X size={24} />
      </button>

      <div
        className="relative max-w-[90vw] max-h-[85vh] lightbox-image"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ImageLightbox;
