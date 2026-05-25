'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from '@carbon/icons-react';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
}

export default function ImageCarousel({ images, alt = 'Contribution image' }: ImageCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        No images submitted
      </div>
    );
  }

  const scrollTo = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    const child = el.children[clamped] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
      setActiveIndex(clamped);
    }
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const idx = Math.round(el.scrollLeft / width);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory rounded-lg bg-gray-100 scroll-smooth no-scrollbar"
      >
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="relative w-full h-64 shrink-0 snap-center">
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 640px"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow disabled:opacity-30"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => scrollTo(activeIndex + 1)}
            disabled={activeIndex === images.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow disabled:opacity-30"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded-full">
            {activeIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
