export default function Loading() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="flex items-center gap-3">
        <span
          className="inline-block w-6 h-6 rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 15%, #f8b3c5 40%, #f07097 70%, #e85d82 100%)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
          }}
          aria-hidden
        />
        <span className="text-sm font-medium text-gradient-rose">Cargando…</span>
      </div>
    </section>
  );
}
