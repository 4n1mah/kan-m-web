"use client";
import { useEffect, useState } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const CONFIG = {
  success: { icon: <Check size={16}/>, bg: "#d1fae5", border: "#6ee7b7", text: "#065f46" },
  error:   { icon: <X size={16}/>,     bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  warning: { icon: <AlertTriangle size={16}/>, bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  info:    { icon: <Info size={16}/>,  bg: "#dbeafe", border: "#93c5fd", text: "#1e3a5f" },
};

export function ToastContainer({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[500] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const cfg = CONFIG[toast.type];

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 3s
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onClose]);

  return (
    <div className="pointer-events-auto transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}>
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg max-w-xs"
        style={{ background: cfg.bg, borderColor: cfg.border }}>
        <span style={{ color: cfg.text }}>{cfg.icon}</span>
        <p className="text-sm font-semibold flex-1" style={{ color: cfg.text }}>{toast.message}</p>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="opacity-60 hover:opacity-100 transition" style={{ color: cfg.text }}>
          <X size={14}/>
        </button>
      </div>
    </div>
  );
}

// Hook to use toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType = "success") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
