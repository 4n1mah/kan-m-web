"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <section className="relative overflow-hidden min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="blob-float pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full bg-[var(--blush)]/30 blur-3xl" />
      <div className="blob-float-2 pointer-events-none absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-[var(--accent)]/40 blur-3xl" />
      <div className="modal-pop relative text-center max-w-md glass rounded-3xl px-8 py-12">
        <p className="font-script text-3xl text-rose mb-2">algo se rompió</p>
        <h1 className="font-display text-3xl md:text-4xl mb-4">No pudimos cargar esta página</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Ya estamos al tanto. Por favor intenta de nuevo. Si el problema persiste,
          contáctanos por WhatsApp.
        </p>
        {error?.digest && (
          <p className="text-xs text-muted-foreground/70 mb-6 font-mono">
            ID: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-shine inline-flex items-center px-6 py-3 rounded-full text-white font-semibold shadow-soft hover:opacity-90 transition bg-gradient-rose"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-full bg-white border border-[var(--border)] text-foreground hover:border-[var(--rose)]/50 hover:text-[var(--rose)] hover:-translate-y-0.5 transition-all"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
