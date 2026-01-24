import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LightboxImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function LightboxImage({ src, alt, className }: LightboxImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const minScale = 0.5;
  const maxScale = 4;
  const scaleStep = 0.2;

  const openLightbox = () => {
    setScale(1);
    setIsOpen(true);
  };

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
    setScale(1);
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + scaleStep, maxScale));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - scaleStep, minScale));
  }, []);

  // Handle scroll wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + scaleStep, maxScale));
    } else {
      setScale((prev) => Math.max(prev - scaleStep, minScale));
    }
  }, []);

  // Keyboard and scroll handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeLightbox, zoomIn, zoomOut, handleWheel]);

  // Lightbox modal content - rendered via Portal
  const lightboxContent = isOpen ? (
    <div
      className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center animate-fade-in"
      onClick={closeLightbox}
    >
      {/* Close Button */}
      <button
        onClick={closeLightbox}
        className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2 transition-colors z-[10000]"
        aria-label="Zapri"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-3 py-2 z-[10000]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomOut();
          }}
          className="text-white hover:bg-white/10 rounded-full p-1 transition-colors"
          aria-label="Pomanjšaj"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="text-white text-sm min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomIn();
          }}
          className="text-white hover:bg-white/10 rounded-full p-1 transition-colors"
          aria-label="Povečaj"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>

      {/* Hint text */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm z-[10000]">
        Uporabite scroll za povečavo
      </div>

      {/* Image with zoom */}
      <div
        className="overflow-auto max-w-[90vw] max-h-[85vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150 ease-out"
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Thumbnail Image - 80% width, centered */}
      <img
        src={src}
        alt={alt}
        onClick={openLightbox}
        className={cn(
          "w-[80%] mx-auto rounded-lg border border-border shadow-sm cursor-pointer",
          "hover:opacity-90 hover:shadow-md transition-all mt-4",
          className
        )}
      />

      {/* Render lightbox via Portal to document.body */}
      {lightboxContent && createPortal(lightboxContent, document.body)}
    </>
  );
}
