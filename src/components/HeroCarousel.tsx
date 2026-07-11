"use client";
import { useEffect, useState } from "react";

interface Props {
  images: string[];
  children: React.ReactNode;
  autoplayMs?: number;
  minHeight?: string;
  /** Si true, la primera imagen se carga eagerly con fetchpriority=high (mejora LCP en home). */
  priorityFirst?: boolean;
}

export default function HeroCarousel({
  images,
  children,
  autoplayMs = 4000,
  minHeight = "92vh",
  priorityFirst = false,
}: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % images.length), autoplayMs);
    return () => clearInterval(id);
  }, [images.length, autoplayMs]);

  return (
    <section className="relative flex items-center overflow-hidden" style={{ minHeight }}>
      {images.map((src, i) => {
        const isFirst = i === 0;
        return (
          <div key={src + i} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === current ? 1 : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className={`w-full h-full object-cover ${i === current ? "kenburns" : ""}`}
              loading={isFirst ? "eager" : "lazy"}
              {...(priorityFirst && isFirst
                ? { fetchPriority: "high" as const }
                : {})}
              decoding={isFirst ? "sync" : "async"}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60" />
          </div>
        );
      })}
      <div className="relative z-10 w-full">{children}</div>
      {images.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 px-3 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/25">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} aria-label={`Foto ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-white w-6" : "bg-white/50 w-2 hover:bg-white/80"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
