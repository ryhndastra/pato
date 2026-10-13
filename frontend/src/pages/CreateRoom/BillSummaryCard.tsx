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
              <span className="font-mono text-2xl font-black text-blue-600 sm:text-3xl">
                {formatIDR(grandTotal)}
              </span>
            </div>
          </div>
        </div>

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
          className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
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
