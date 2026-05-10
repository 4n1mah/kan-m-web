export default function Loading() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span
          className="inline-block w-5 h-5 rounded-full border-2 border-[#f07097]/30 border-t-[#f07097] animate-spin"
          aria-hidden
        />
        <span className="text-sm">Cargando…</span>
      </div>
    </section>
  );
}
