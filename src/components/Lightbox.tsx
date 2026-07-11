"use client";
import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  startIndex?: number;
  onClose: () => void;
}

export default function Lightbox({ images, startIndex = 0, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.82)" }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/25 hover:scale-105 transition-all z-10"
        aria-label="Cerrar"
      >
        <X size={20} />
      </button>

      {/* Image */}
      <div
        className="relative max-w-5xl w-full mx-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx]}
          alt=""
          className="modal-pop max-h-[85vh] max-w-full w-auto rounded-2xl object-contain shadow-2xl"
          style={{ userSelect: "none" }}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 w-11 h-11 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 hover:scale-105 transition-all"
              aria-label="Anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 w-11 h-11 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 hover:scale-105 transition-all"
              aria-label="Siguiente"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-6" : "bg-white/40 w-1.5"}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {idx + 1} / {images.length}
      </div>
    </div>
  );
}
