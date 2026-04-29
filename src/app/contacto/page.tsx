"use client";
import DeliveryButtons from "@/components/DeliveryButtons";
import { useState } from "react";
import { Phone, Mail, Instagram, ArrowRight } from "lucide-react";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Tu nombre es requerido").max(100),
  message: z.string().trim().min(5, "Cuéntanos un poco más").max(1000),
});

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = schema.safeParse({ name, message });
    if (!res.success) {
      setError(res.error.issues[0]?.message || "Datos inválidos");
      return;
    }
    setError(null);
    window.open(waLink(WA_MESSAGES.contact(res.data.name, res.data.message)), "_blank");
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="font-script text-2xl text-rose">conversemos</p>
        <h1 className="font-display text-4xl md:text-5xl mt-1">Contáctanos</h1>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Cuéntanos sobre tu evento y te respondemos por WhatsApp en minutos.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <form onSubmit={onSubmit} className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card p-8 space-y-5">
          <div>
            <label className="block text-sm mb-2">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Mensaje</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={5}
              className="w-full rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm"
              placeholder="Cuéntanos qué necesitas…"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-rose text-white shadow-soft hover:opacity-90 transition"
          >
            Enviar por WhatsApp <ArrowRight size={18} />
          </button>
        </form>

        <div className="space-y-5">
          <div className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-rose text-white flex items-center justify-center"><Phone size={18} /></div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Teléfono</div>
              <div className="font-display text-lg">829-610-7064</div>
            </div>
          </div>
          <a href="mailto:kanmreposteriaycatering@gmail.com" className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card p-6 flex items-center gap-4 hover:shadow-soft transition-shadow">
            <div className="w-10 h-10 rounded-full bg-gradient-rose text-white flex items-center justify-center"><Mail size={18} /></div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Email</div>
              <div className="font-display text-lg">kanmreposteriaycatering@gmail.com</div>
            </div>
          </a>
          <a href="https://www.instagram.com/kanm.reposteriacafe/" target="_blank" rel="noopener noreferrer" className="bg-card rounded-3xl border border-[var(--border)]/60 shadow-card p-6 flex items-center gap-4 hover:shadow-soft transition-shadow">
            <div className="w-10 h-10 rounded-full bg-gradient-rose text-white flex items-center justify-center"><Instagram size={18} /></div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Instagram</div>
              <div className="font-display text-lg">@kanm.reposteriacafe</div>
            </div>
          </a>

          {/* Delivery platforms */}
          <div className="pt-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Pide a domicilio</p>
            <div className="flex flex-col gap-3">
              <DeliveryButtons variant="card" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
