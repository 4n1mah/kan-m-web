"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

const PINK = "var(--gradient-rose)"; // gradiente de marca definido en globals.css

// Formulario de acceso al panel. Vive en un componente reutilizable porque
// la página que lo renderiza está en una URL secreta (src/app/acceso/[key]),
// no en una ruta fija adivinable. Ver .env.example → ADMIN_LOGIN_SLUG.
export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) router.push("/admin/dashboard");
      else setError((await res.json()).error || "Error de inicio de sesión");
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "#faf6f1" }}>
      {/* Decoración de fondo: blobs rosados suaves */}
      <div className="blob-float absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #f9c4d4 0%, transparent 70%)" }} />
      <div className="blob-float-2 absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #f07097 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-md">
        {/* Header con logo */}
        <div className="text-center mb-7">
          <div className="float-y inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-2xl font-display font-bold mb-4 shadow-glow"
            style={{ background: PINK }}>
            K
          </div>
          <h1 className="font-display text-3xl text-gray-900">Bienvenida de vuelta</h1>
          <p className="text-sm text-gray-500 mt-1.5">Panel de Kan M Repostería y Catering</p>
        </div>

        {/* Card */}
        <form onSubmit={onSubmit}
          className="modal-pop glass-strong rounded-3xl shadow-xl p-7 sm:p-8 space-y-5">

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Correo
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#f07097] focus:bg-white transition" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#f07097] focus:bg-white transition" />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#f07097] transition">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-shine w-full py-3 rounded-xl text-white font-semibold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: PINK }}>
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>

          <p className="text-[11px] text-gray-400 text-center pt-1">
            ¿Olvidaste tu contraseña? Contacta al dueño del panel para que la restablezca.
          </p>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © Kan M Repostería y Catering · Acceso solo para personal autorizado
        </p>
      </div>
    </div>
  );
}
