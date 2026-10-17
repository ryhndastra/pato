import {
  CircleNotch,
  Receipt,
  ShareNetwork,
  WarningCircle,
} from "@phosphor-icons/react";
import { formatIDR } from "../../lib/format";

interface BillSummaryCardProps {
  subtotal: number;
  taxAmount: string;
  serviceAmount: string;
  discountAmount: string;
  grandTotal: number;
  itemsCount: number;
  canSubmit: boolean;
  submitting: boolean;
  error: string | null;
  roundMode?: "none" | "hundred" | "thousand";
  setRoundMode?: (mode: "none" | "hundred" | "thousand") => void;
}

export function BillSummaryCard({
  subtotal,
  taxAmount,
  serviceAmount,
  discountAmount,
  grandTotal,
  itemsCount,
  canSubmit,
  submitting,
  error,
  roundMode,
  setRoundMode,
}: BillSummaryCardProps) {
  const taxNum = Number(taxAmount || 0);
  const serviceNum = Number(serviceAmount || 0);
  const discountNum = Number(discountAmount || 0);

  return (
    <aside className="space-y-4">
      {/* Financial Summary Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_32px_rgba(37,99,235,0.06)] sm:p-7">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 aspect-square items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Receipt size={20} weight="bold" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Ringkasan Tagihan</h3>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-500">
            {itemsCount} {itemsCount === 1 ? "menu" : "menu"}
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal Menu</span>
            <span className="font-mono font-medium text-slate-900">{formatIDR(subtotal)}</span>
          </div>

          {taxNum > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span>Pajak Resto</span>
              <span className="font-mono font-medium text-slate-900">+{formatIDR(taxNum)}</span>
            </div>
          )}

          {serviceNum > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span>Service Charge</span>
              <span className="font-mono font-medium text-slate-900">+{formatIDR(serviceNum)}</span>
            </div>
          )}

          {discountNum > 0 && (
            <div className="flex items-center justify-between text-emerald-600">
              <span>Diskon / Potongan</span>
              <span className="font-mono font-medium">-{formatIDR(discountNum)}</span>
            </div>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="block text-sm font-bold text-slate-900">Grand Total</span>
                <span className="text-xs text-slate-400">Total seluruh tagihan</span>
              </div>
              <span className="font-mono tabular-nums text-2xl font-black text-slate-900 sm:text-3xl">
                {formatIDR(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Rounding Mode Option */}
        {roundMode && setRoundMode && (
          <div className="mt-4 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">Pembulatan Tagihan</span>
              <span className="text-[10px] text-slate-400 font-medium">Per orang</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "hundred", label: "Ratusan", tip: "Rp14.300" },
                { id: "thousand", label: "Ribuan", tip: "Rp15.000" },
                { id: "none", label: "Pas", tip: "Rp14.285" },
              ].map((m) => {
                const active = roundMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRoundMode(m.id as "none" | "hundred" | "thousand")}
                    className={`rounded-xl py-2 px-1 text-center transition-all duration-150 active:scale-95 ${
                      active
                        ? "bg-blue-600 text-white font-bold shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
                        : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs">{m.label}</div>
                    <div className={`text-[10px] ${active ? "text-blue-100" : "text-slate-400"}`}>
                      {m.tip}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10.5px] text-slate-500 leading-tight">
              {roundMode === "hundred" && "Dibulatkan ke atas ke Rp 100 terdekat agar teman mudah transfer."}
              {roundMode === "thousand" && "Dibulatkan ke atas ke Rp 1.000 terdekat (bisa jadi kas/tip)."}
              {roundMode === "none" && "Nominal dihitung eksak rupiah tanpa pembulatan."}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200">
            <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-sm font-bold text-white shadow-[0_6px_20px_rgba(37,99,235,0.28)] transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
        >
          {submitting ? (
            <>
              <CircleNotch size={18} weight="bold" className="animate-spin" />
              <span>Membuat Room...</span>
            </>
          ) : (
            <>
              <ShareNetwork size={18} weight="bold" />
              <span>Buka Room & Bagikan</span>
            </>
          )}
        </button>

        {!canSubmit && !submitting && (
          <p className="mt-2 text-center text-xs text-slate-400">
            Lengkapi nama acara dan minimal 1 menu
          </p>
        )}
      </div>
    </aside>
  );
}
