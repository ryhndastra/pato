import { useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, DownloadSimple, House, X } from "@phosphor-icons/react";
import confetti from "canvas-confetti";
import { safeIDR } from "./money";
import type { RoomDetail } from "./types";
import patoLogo from "../../assets/pato.png";

interface RoomClosedCelebrationModalProps {
  room: RoomDetail;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt: () => void;
}

export function RoomClosedCelebrationModal({
  room,
  isOpen,
  onClose,
  onOpenReceipt,
}: RoomClosedCelebrationModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    // Respect user's reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!prefersReducedMotion) {
      // 1. Initial burst
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#2563eb", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"],
        });

        // 2. Side cannons burst
        const timer1 = setTimeout(() => {
          confetti({
            particleCount: 45,
            angle: 60,
            spread: 55,
            origin: { x: 0.1, y: 0.65 },
            colors: ["#10b981", "#2563eb", "#f59e0b"],
          });
          confetti({
            particleCount: 45,
            angle: 120,
            spread: 55,
            origin: { x: 0.9, y: 0.65 },
            colors: ["#10b981", "#2563eb", "#f59e0b"],
          });
        }, 220);

        return () => clearTimeout(timer1);
      } catch {
        // Fallback gracefully if canvas is blocked
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const memberCount = room.members?.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-modal-title"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-3xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-900/10 animate-dialog-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup jendela perayaan"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 active:scale-90"
        >
          <X size={16} weight="bold" />
        </button>

        {/* Celebratory Brand Badge */}
        <div className="relative mt-2 mb-3">
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-emerald-400/30 via-blue-400/20 to-amber-300/30 blur-lg" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-100 bg-white p-3.5 shadow-xl ring-4 ring-slate-50">
            <img
              src={patoLogo}
              alt="PaTo"
              className="h-full w-full object-contain drop-shadow-xs"
            />
            <span className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
              <CheckCircle size={18} weight="fill" />
            </span>
          </div>
        </div>

        {/* Pill Badge */}
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
          <CheckCircle size={14} weight="fill" className="text-emerald-600" />
          <span>Meja Resmi Ditutup & Lunas</span>
        </div>

        {/* Title & Description */}
        <h2
          id="celebration-modal-title"
          className="text-xl font-black text-slate-900 leading-tight"
        >
          Patungan Selesai & Lunas
        </h2>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[280px]">
          Semua tagihan di meja <strong className="text-slate-800">{room.title}</strong> telah
          diverifikasi dan lunas tanpa selisih.
        </p>

        {/* Financial Mini Dashboard */}
        <div className="mt-4 grid w-full grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-left border border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Tagihan
            </span>
            <p className="font-mono text-sm font-extrabold text-slate-900">
              {safeIDR(room.grand_total)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Partisipan
            </span>
            <p className="text-sm font-extrabold text-slate-900">
              {memberCount} Orang
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenReceipt();
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>Lihat & Simpan Struk Digital</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <House size={15} weight="bold" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
}

