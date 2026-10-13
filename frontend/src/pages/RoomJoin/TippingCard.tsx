import { useState } from "react";
import { Coffee, Heart, Sparkle, X } from "@phosphor-icons/react";
import { safeIDR } from "./money";

const TIP_OPTIONS = [2000, 5000, 10000, 20000];

export function TippingCard() {
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  function handleSelectTip(amount: number) {
    setSelectedTip(amount);
    setShowQrModal(true);
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-hairline bg-linear-to-b from-slate-50 to-white p-4 sm:p-5 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Coffee size={18} weight="bold" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-ink sm:text-sm">Traktir Kopi Developer PaTo</h3>
            <p className="text-[11px] text-ink-muted">Aplikasi gratis tanpa iklan. Dukung kami agar server tetap jalan!</p>
          </div>
        </div>

        <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:inline-flex">
          <Heart size={11} weight="fill" className="text-rose-500" />
          20% Donasi Bencana
        </span>
      </div>

      <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-3 py-1.5 text-[11px] text-emerald-800 sm:hidden">
        <Heart size={12} weight="fill" className="shrink-0 text-rose-500" />
        <span>20% dari tip disalurkan untuk bantuan bencana alam</span>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-1">
        {TIP_OPTIONS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handleSelectTip(amount)}
            className="flex h-9 items-center justify-center rounded-xl border border-hairline bg-white font-mono text-xs font-bold text-ink transition-all hover:border-brand hover:bg-blue-50/50 hover:text-brand active:scale-[0.97]"
          >
            {safeIDR(amount)}
          </button>
        ))}
      </div>

      {showQrModal && selectedTip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-bold text-ink">
                <Sparkle size={14} weight="bold" className="text-brand" />
                Terima Kasih Banyak!
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-xs font-bold text-ink-muted hover:text-ink"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <p className="text-xs text-ink-soft">
              Kamu memilih traktir <span className="font-bold text-ink">{safeIDR(selectedTip)}</span>.
              20% ({safeIDR(Math.round(selectedTip * 0.2))}) otomatis disisihkan ke yayasan tanggap bencana alam.
            </p>

            <div className="flex flex-col items-center gap-2 rounded-xl border border-hairline bg-slate-50 p-4">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://saweria.co/patoapp"
                alt="QRIS Tip Developer"
                className="h-44 w-44 rounded-lg object-contain"
              />
              <span className="font-mono text-[11px] font-bold text-ink-muted">Scan QRIS (GoPay / Shopee / BCA)</span>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="mt-1 flex h-10 w-full items-center justify-center rounded-xl bg-brand text-xs font-bold text-white shadow-sm hover:bg-brand/95"
            >
              Selesai Traktir
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

