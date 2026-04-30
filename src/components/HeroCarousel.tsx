"use client";
import { useEffect, useState } from "react";

interface Props {
  images: string[];
  children: React.ReactNode;
}

export default function HeroCarousel({ images, children }: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % images.length);
    }, 4000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background images — crossfade */}
      {images.map((src, i) => (
        <div
          key={src + i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
          {/* Gradient overlay: dark at top/bottom, lighter in centre */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Foto ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-6" : "bg-white/50 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
