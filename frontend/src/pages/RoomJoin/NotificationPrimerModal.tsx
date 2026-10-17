import { useState } from "react";
import {
  BellRinging,
  CheckCircle,
  ChatCircleDots,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import { requestBrowserNotificationPermission } from "../../lib/notifications";
import { soundFX } from "../../lib/soundFx";
import { haptic } from "../../lib/haptic";

interface NotificationPrimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export function NotificationPrimerModal({
  isOpen,
  onClose,
  onPermissionGranted,
}: NotificationPrimerModalProps) {
  const [requesting, setRequesting] = useState(false);

  if (!isOpen) return null;

  async function handleEnable() {
    setRequesting(true);
    haptic.medium();
    soundFX.playTap();

    try {
      const granted = await requestBrowserNotificationPermission();
      if (granted) {
        haptic.success();
        soundFX.playNotification();
        onPermissionGranted?.();
      } else {
        haptic.warning();
      }
    } finally {
      setRequesting(false);
      onClose();
    }
  }

  function handleDismiss() {
    haptic.light();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-backdrop-fade"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-dialog-pop flex flex-col gap-5 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 active:scale-90 transition-all"
          aria-label="Tutup"
        >
          <X size={16} weight="bold" />
        </button>

        {/* Hero Icon with Animated Pulse */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-100">
            <span className="absolute -inset-1 rounded-2xl bg-blue-500/20 animate-ping" />
            <BellRinging size={32} weight="fill" className="relative z-10" />
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 mb-1">
            <ShieldCheck size={13} weight="bold" />
            <span>Pemberitahuan Real-time</span>
          </span>

          <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
            Aktifkan Notifikasi Meja?
          </h3>

          <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[280px]">
            Biar kamu langsung tahu kalau tagihan siap dibayar atau bukti transfermu sudah di-acc sama Host, walau lagi buka aplikasi lain.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle size={14} weight="bold" />
            </span>
            <span className="font-medium">
              Konfirmasi otomatis saat bukti bayarmu <strong>Lunas</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <BellRinging size={14} weight="bold" />
            </span>
            <span className="font-medium">
              Tahu seketika saat Host <strong>mengunci meja</strong> untuk bayar
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <ChatCircleDots size={14} weight="bold" />
            </span>
            <span className="font-medium">
              Pesan dan instruksi pembayaran penting di meja
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={handleEnable}
            disabled={requesting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70"
          >
            <BellRinging size={16} weight="bold" />
            <span>{requesting ? "Memproses..." : "Izinkan Notifikasi"}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-10 w-full items-center justify-center rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}

