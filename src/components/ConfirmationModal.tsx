"use client";
import { useState } from "react";
import { X, AlertTriangle, Trash2, Check } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  icon?: "delete" | "save" | "warning" | "confirm";
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
  icon = "confirm",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const getIcon = () => {
    switch (icon) {
      case "delete":
        return <Trash2 size={32} className="text-red-500" />;
      case "save":
        return <Check size={32} className="text-green-500" />;
      case "warning":
        return <AlertTriangle size={32} className="text-amber-500" />;
      default:
        return <AlertTriangle size={32} style={{ color: "#f07097" }} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="modal-pop bg-white rounded-3xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0e8e0]">
          <h3 className="font-display text-lg text-gray-900">{title}</h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50">
            {getIcon()}
          </div>
          <p className="text-[var(--muted-foreground)] text-sm leading-relaxed text-center">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#f0e8e0] bg-gray-50 rounded-b-3xl">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg text-[#f07097] font-semibold text-sm transition border border-[#f07097] hover:bg-[#fef7f9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`btn-shine flex-1 py-2.5 rounded-lg text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isDestructive ? "bg-red-500 hover:bg-red-600" : "bg-gradient-rose"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Hook reutilizable: devuelve { confirm, modal }.
// `confirm()` es async y resuelve a boolean según la elección del usuario.
// Renderizar `modal` en el JSX padre para que la confirmación funcione.
// ──────────────────────────────────────────────────────────────
type Icon = "delete" | "save" | "warning" | "confirm" | "danger";

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean; title: string; message: string; confirmText: string;
    isDestructive: boolean; icon: "delete" | "save" | "warning" | "confirm";
    resolve: (v: boolean) => void;
  }>({ open: false, title: "", message: "", confirmText: "Confirmar", isDestructive: false, icon: "confirm", resolve: () => {} });

  const confirm = (opts: {
    title: string; message: string; confirmText?: string;
    isDestructive?: boolean; icon?: Icon;
  }) => new Promise<boolean>(resolve => {
    // "danger" es alias de delete + isDestructive
    const isDanger = opts.icon === "danger";
    setState({
      open: true,
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText ?? "Confirmar",
      isDestructive: opts.isDestructive ?? isDanger,
      icon: isDanger ? "delete" : (opts.icon ?? "confirm") as "delete" | "save" | "warning" | "confirm",
      resolve,
    });
  });

  const modal = (
    <ConfirmationModal
      isOpen={state.open}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText="Cancelar"
      isDestructive={state.isDestructive}
      icon={state.icon}
      onConfirm={() => { state.resolve(true); setState(s => ({ ...s, open: false })); }}
      onCancel={() => { state.resolve(false); setState(s => ({ ...s, open: false })); }}
    />
  );
  return { confirm, modal };
}
