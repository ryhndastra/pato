import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleNotch, Trash, Warning, X } from "@phosphor-icons/react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  isDestructive = true,
  isLoading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 animate-backdrop-fade"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 animate-modal-spring">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Tutup"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          <X size={16} weight="bold" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon Badge */}
          <div
            className={`flex h-13 w-13 items-center justify-center rounded-2xl mb-4 ${
              isDestructive
                ? "bg-rose-50 text-rose-600 ring-8 ring-rose-50/50"
                : "bg-amber-50 text-amber-600 ring-8 ring-amber-50/50"
            }`}
          >
            {isDestructive ? (
              <Trash size={26} weight="bold" />
            ) : (
              <Warning size={26} weight="bold" />
            )}
          </div>

          <h3
            id="confirm-modal-title"
            className="text-lg font-black tracking-tight text-slate-900"
          >
            {title}
          </h3>

          <div className="mt-2 text-xs leading-relaxed text-slate-500">
            {description}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex w-full gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-11 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-2xl text-xs font-bold text-white shadow-md active:scale-98 transition-all disabled:opacity-60 ${
                isDestructive
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
              }`}
            >
              {isLoading && <CircleNotch size={14} weight="bold" className="animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

