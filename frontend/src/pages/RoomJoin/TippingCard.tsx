import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowSquareOut, Coffee, Heart, Sparkle, X } from "@phosphor-icons/react";

export function TippingCard() {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-amber-50/40 via-white to-white p-4 sm:p-5 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-2xs">
            <Coffee size={20} weight="bold" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Traktir Kopi Developer PaTo
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-1">
              Aplikasi gratis tanpa iklan. Dukung kami agar server tetap jalan!
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0 border border-emerald-200/60">
          <Heart size={11} weight="fill" className="text-rose-500" />
          20% Donasi Bencana
        </span>
      </div>

      <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-3 py-1.5 text-[11px] text-emerald-800 sm:hidden">
        <Heart size={12} weight="fill" className="shrink-0 text-rose-500" />
        <span>20% dari tip disalurkan untuk bantuan bencana alam</span>
      </div>

      {/* 1 Clean Primary Action Button */}
      <button
        type="button"
        onClick={() => setShowQrModal(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-[0.98] transition-all"
      >
        <Coffee size={16} weight="bold" />
        <span>Traktir Kopi via Tako ↗</span>
      </button>

      {/* Fullscreen Modal Teleported to Document Body */}
      {showQrModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-backdrop-fade"
            role="dialog"
            aria-modal="true"
            aria-label="Modal Traktir Kopi Developer"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="relative flex w-full max-w-sm flex-col items-center gap-3.5 rounded-3xl bg-white p-6 text-center shadow-2xl animate-dialog-pop"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Sparkle size={15} weight="fill" className="text-amber-500" />
                  Dukungan untuk PaTo
                </span>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  aria-label="Tutup modal"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-90 transition-all"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">
                  Traktir Kopi Developer ☕
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[280px]">
                  Terima kasih banyak atas apresiasimu! 20% dari tip disalurkan ke yayasan tanggap bencana alam.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50 p-4 w-full">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent("https://tako.id/ryhndastra")}`}
                  alt="QR Tako Developer PaTo"
                  className="h-44 w-44 rounded-xl object-contain bg-white p-2 shadow-2xs border border-slate-200"
                />
                <span className="text-[11px] font-semibold text-slate-500">
                  Scan via Kamera / QRIS M-Banking & E-Wallet
                </span>
              </div>

              {/* Direct Open Button for Mobile Users */}
              <a
                href="https://tako.id/ryhndastra"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all"
              >
                <span>Buka Halaman Donasi Tako ↗</span>
                <ArrowSquareOut size={16} weight="bold" />
              </a>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}

