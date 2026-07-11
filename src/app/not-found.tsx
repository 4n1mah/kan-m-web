import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada (404)",
  description: "La página que buscas no existe o fue movida.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="relative overflow-hidden min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="blob-float pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full bg-[var(--blush)]/30 blur-3xl" />
      <div className="blob-float-2 pointer-events-none absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-[var(--accent)]/40 blur-3xl" />
      <div className="modal-pop relative text-center max-w-md glass rounded-3xl px-8 py-12">
        <p className="font-script text-3xl text-rose mb-2">ups…</p>
        <h1 className="font-display text-5xl md:text-6xl mb-4 text-gradient-animated">404</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Esta página no existe o se mudó. Quizá te interese ver el catálogo o cotizar tu evento.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="btn-shine inline-flex items-center px-6 py-3 rounded-full text-white font-semibold shadow-soft hover:opacity-90 transition bg-gradient-rose"
          >
            Volver al inicio
          </Link>
          <Link
            href="/catalogo"
            className="inline-flex items-center px-6 py-3 rounded-full bg-white border border-[var(--border)] text-foreground hover:border-[var(--rose)]/50 hover:text-[var(--rose)] transition"
          >
            Ver catálogo
          </Link>
          <Link
            href="/cotizar"
            className="inline-flex items-center px-6 py-3 rounded-full bg-white border border-[var(--border)] text-foreground hover:border-[var(--rose)]/50 hover:text-[var(--rose)] transition"
          >
            Cotizar
          </Link>
        </div>
      </div>
    </section>
  );
}
