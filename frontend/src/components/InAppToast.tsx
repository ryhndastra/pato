import { useEffect } from "react";
import {
  BellRinging,
  CheckCircle,
  LockKey,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

export type ToastType = "info" | "success" | "warning" | "lock";

export interface InAppToastPayload {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
}

interface InAppToastProps {
  toast: InAppToastPayload | null;
  onDismiss: () => void;
}

export function InAppToast({ toast, onDismiss }: InAppToastProps) {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.durationMs || 4500;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  function renderIcon() {
    switch (toast!.type) {
      case "success":
        return <CheckCircle size={20} weight="fill" className="text-emerald-400 shrink-0" />;
      case "lock":
        return <LockKey size={20} weight="fill" className="text-amber-400 shrink-0" />;
      case "warning":
        return <WarningCircle size={20} weight="fill" className="text-rose-400 shrink-0" />;
      case "info":
      default:
        return <BellRinging size={20} weight="fill" className="text-blue-400 shrink-0" />;
    }
  }

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm animate-slide-down"
      role="alert"
    >
      <div className="flex items-start gap-3 rounded-2xl bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-xl border border-white/10 ring-1 ring-black/10">
        <div className="mt-0.5">{renderIcon()}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white leading-tight">{toast.title}</p>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
          aria-label="Tutup notifikasi"
        >
          <X size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}
