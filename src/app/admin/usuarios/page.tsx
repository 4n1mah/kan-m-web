"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, KeyRound, X, Check,
  Shield, ChefHat, User as UserIcon, AlertCircle, LockOpen, Lock,
} from "lucide-react";
import { ToastContainer, useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmationModal";

const PINK = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

type Role = "OWNER" | "BAKER" | "ASSISTANT";
type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
};

function isLocked(u: User): boolean {
  if (!u.lockedUntil) return false;
  return new Date(u.lockedUntil) > new Date();
}

const ROLE_META: Record<Role, { label: string; icon: React.ReactNode; bg: string; color: string; description: string }> = {
  OWNER: {
    label: "Dueña",
    icon: <Shield size={13}/>,
    bg: "#fef7f9",
    color: "#e85d82",
    description: "Acceso completo: pedidos, catálogo, usuarios y configuración.",
  },
  BAKER: {
    label: "Repostera",
    icon: <ChefHat size={13}/>,
    bg: "#f0fdf4",
    color: "#16a34a",
    description: "Gestiona pedidos y catálogo. No administra usuarios.",
  },
  ASSISTANT: {
    label: "Asistente",
    icon: <UserIcon size={13}/>,
    bg: "#eff6ff",
    color: "#2563eb",
    description: "Lee pedidos. Útil para empleados de apoyo.",
  },
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const { confirm, modal: confirmModal } = useConfirm();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/users");
    if (r.status === 403) { setForbidden(true); setLoading(false); return; }
    if (r.status === 401) { router.push("/admin/login"); return; }
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function patchUser(id: string, payload: Record<string, unknown>) {
    const r = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      addToast(err.error || "Error al guardar", "error");
      return false;
    }
    addToast("Cambios guardados", "success");
    await loadUsers();
    return true;
  }

  async function deactivateUser(u: User) {
    const ok = await confirm({
      title: "Desactivar usuario",
      message: `¿Desactivar a ${u.name}? No podrá iniciar sesión, pero su historial se conserva.`,
      confirmText: "Desactivar",
      icon: "danger",
    });
    if (!ok) return;
    const r = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (r.ok) { addToast(`${u.name} desactivado`, "info"); loadUsers(); }
    else addToast("Error al desactivar", "error");
  }

  async function reactivateUser(u: User) {
    await patchUser(u.id, { active: true });
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background:"#f7f4f0" }}>
        <div className="bg-white border border-[#ede8e0] rounded-3xl shadow-md p-10 max-w-md text-center">
          <AlertCircle size={36} className="mx-auto text-amber-500 mb-3"/>
          <h2 className="font-display text-xl text-gray-800">Acceso restringido</h2>
          <p className="text-sm text-gray-500 mt-2">Solo el dueño del panel puede gestionar usuarios.</p>
          <Link href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: PINK }}>
            <ArrowLeft size={14}/> Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background:"#f7f4f0" }}>
      <ToastContainer toasts={toasts} removeToast={removeToast}/>
      {confirmModal}

      <header className="sticky top-0 z-40 border-b border-white/20 shadow-sm" style={{ background: PINK }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-4" style={{ height:"3.75rem" }}>
          <Link href="/admin/dashboard"
            className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/15">
            <ArrowLeft size={15}/> Volver
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-white"/>
            <span className="font-semibold text-sm text-white">Gestión de usuarios</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-gray-900">Usuarios del panel</h1>
            <p className="text-sm text-gray-500 mt-0.5">Quién tiene acceso a Kan M Admin y con qué permisos.</p>
          </div>
          <button onClick={()=>setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-95 transition"
            style={{ background: PINK }}>
            <Plus size={15}/> Nueva usuaria
          </button>
        </div>

        {/* Roles legend */}
        <div className="grid sm:grid-cols-3 gap-3">
          {(["OWNER","BAKER","ASSISTANT"] as Role[]).map(r => {
            const m = ROLE_META[r];
            return (
              <div key={r} className="bg-white border border-[#ede8e0] rounded-2xl p-3.5 shadow-sm">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: m.bg, color: m.color }}>
                  {m.icon} {m.label}
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{m.description}</p>
              </div>
            );
          })}
        </div>

        {/* User list */}
        {loading ? (
          <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm p-12 text-center text-gray-400 text-sm">
            Cargando usuarios…
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm p-12 text-center text-gray-400 text-sm">
            Aún no hay usuarios.
          </div>
        ) : (
          <div className="bg-white border border-[#ede8e0] rounded-2xl shadow-sm divide-y divide-[#f0e8e0] overflow-hidden">
            {users.map(u => {
              const m = ROLE_META[u.role];
              return (
                <div key={u.id} className={`flex items-center gap-4 p-4 ${!u.active ? "opacity-60 bg-gray-50/50" : ""}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: PINK }}>
                    {u.name.split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800 truncate">{u.name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                        style={{ background: m.bg, color: m.color }}>
                        {m.icon} {m.label}
                      </span>
                      {!u.active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-200 text-gray-500">
                          Desactivada
                        </span>
                      )}
                      {isLocked(u) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600">
                          <Lock size={9}/> Bloqueada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {u.lastLoginAt ? `Último ingreso: ${new Date(u.lastLoginAt).toLocaleDateString("es-DO", { day:"numeric", month:"short", year:"numeric" })}` : "Nunca ha iniciado sesión"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <select value={u.role}
                      onChange={e=>patchUser(u.id, { role: e.target.value as Role })}
                      className="text-xs px-2 py-1.5 rounded-lg border border-[#ede8e0] bg-[#faf8f5] text-gray-600 focus:outline-none focus:border-[#f07097] cursor-pointer">
                      <option value="OWNER">Dueña</option>
                      <option value="BAKER">Repostera</option>
                      <option value="ASSISTANT">Asistente</option>
                    </select>
                    <button onClick={()=>setResetUser(u)}
                      title="Restablecer contraseña"
                      className="p-2 rounded-lg text-gray-400 hover:text-[#f07097] hover:bg-[#fef7f9] transition">
                      <KeyRound size={14}/>
                    </button>
                    {isLocked(u) && (
                      <button
                        onClick={()=>patchUser(u.id, { unlock: true })}
                        title="Desbloquear cuenta"
                        className="p-2 rounded-lg text-red-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                        <LockOpen size={14}/>
                      </button>
                    )}
                    {u.active ? (
                      <button onClick={()=>deactivateUser(u)}
                        title="Desactivar"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                        <Trash2 size={14}/>
                      </button>
                    ) : (
                      <button onClick={()=>reactivateUser(u)}
                        title="Reactivar"
                        className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                        <Check size={14}/>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pt-2">
          Las usuarias desactivadas conservan su historial de cambios pero no pueden iniciar sesión.
        </p>
      </div>

      {createOpen && <CreateUserModal onClose={()=>setCreateOpen(false)} onCreated={()=>{ setCreateOpen(false); loadUsers(); addToast("Usuario creado","success"); }}/>}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={()=>setResetUser(null)} onDone={()=>{ setResetUser(null); addToast("Contraseña actualizada","success"); }}/>}
    </div>
  );
}

// ── Modal: crear usuario ─────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "BAKER" as Role });
  const [error, setError] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) { onCreated(); return; }
    const err = await r.json().catch(() => ({}));
    setError(err.error || "Error al crear");
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-[fadeIn_.15s_ease-out]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <form onSubmit={submit} className="relative bg-white w-full max-w-md rounded-3xl shadow-xl border border-[#ede8e0] p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Nueva usuaria</h2>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X size={15}/>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Nombre</label>
          <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required
            className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#f07097] focus:bg-white transition"
            placeholder="Nombre completo"/>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Correo</label>
          <input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required
            autoComplete="off"
            className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#f07097] focus:bg-white transition"
            placeholder="usuaria@correo.com"/>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Contraseña inicial</label>
          <input type="text" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#f07097] focus:bg-white transition font-mono"
            placeholder="Mínimo 8 caracteres"/>
          <p className="text-[10px] text-gray-400 mt-1">Compártesela en privado. La usuaria puede cambiarla después.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Rol</label>
          <select value={form.role} onChange={e=>setForm({...form, role: e.target.value as Role})}
            className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#f07097] cursor-pointer">
            <option value="BAKER">Repostera (recomendado)</option>
            <option value="ASSISTANT">Asistente</option>
            <option value="OWNER">Dueña</option>
          </select>
          <p className="text-[10px] text-gray-400 mt-1">{ROLE_META[form.role].description}</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}

        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition disabled:opacity-50"
          style={{ background: PINK }}>
          {submitting ? "Creando…" : "Crear usuaria"}
        </button>
      </form>
    </div>
  );
}

// ── Modal: restablecer contraseña ────────────────────────────────
function ResetPasswordModal({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: () => void }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const r = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: pwd }),
    });
    if (r.ok) { onDone(); return; }
    const err = await r.json().catch(() => ({}));
    setError(err.error || "Error al restablecer");
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-[fadeIn_.15s_ease-out]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <form onSubmit={submit} className="relative bg-white w-full max-w-md rounded-3xl shadow-xl border border-[#ede8e0] p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Restablecer contraseña</h2>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X size={15}/>
          </button>
        </div>
        <p className="text-sm text-gray-600">Para <span className="font-semibold">{user.name}</span> ({user.email}).</p>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Nueva contraseña</label>
          <input type="text" value={pwd} onChange={e=>setPwd(e.target.value)} required minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#f07097] focus:bg-white transition font-mono"
            placeholder="Mínimo 8 caracteres"/>
          <p className="text-[10px] text-gray-400 mt-1">Compártesela en privado por WhatsApp o presencialmente.</p>
        </div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg hover:opacity-95 transition disabled:opacity-50"
          style={{ background: PINK }}>
          {submitting ? "Guardando…" : "Restablecer"}
        </button>
      </form>
    </div>
  );
}
