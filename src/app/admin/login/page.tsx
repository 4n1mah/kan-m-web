"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) router.push("/admin/dashboard");
    else setError((await res.json()).error || "Error de inicio de sesión");
    setLoading(false);
  }

  return (
    <section className="max-w-md mx-auto px-6 py-24">
      <h1 className="font-display text-3xl text-center">Acceso Admin</h1>
      <form onSubmit={onSubmit} className="mt-8 bg-card rounded-3xl border border-[var(--border)]/60 shadow-card p-8 space-y-5">
        <div>
          <label className="block text-sm mb-2">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm mb-2">Contraseña</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-[var(--input)] bg-background px-3 py-2 text-sm" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={loading} className="w-full px-6 py-3 rounded-full bg-gradient-rose text-white shadow-soft hover:opacity-90 transition disabled:opacity-50">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </section>
  );
}
