"use client";
import { useEffect } from "react";
import Link from "next/link";

const PINK = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

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
    <section className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="text-center max-w-md">
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
            className="inline-flex items-center px-6 py-3 rounded-full text-white font-semibold shadow-soft hover:opacity-90 transition"
            style={{ background: PINK }}
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-full bg-white border border-[var(--border)] text-foreground hover:border-[var(--rose)]/50 hover:text-[var(--rose)] transition"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
