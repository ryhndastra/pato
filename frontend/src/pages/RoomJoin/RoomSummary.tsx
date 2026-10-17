import { Receipt } from "@phosphor-icons/react";
import type { RoomDetail } from "./types";
import { safeIDR } from "./money";

interface RoomSummaryProps {
  room: RoomDetail;
}

export function RoomSummary({ room }: RoomSummaryProps) {
  const hasTax = (room.tax_amount ?? 0) > 0;
  const hasService = (room.service_amount ?? 0) > 0;
  const hasDiscount = (room.discount_amount ?? 0) > 0;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100/90 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-2xs">
          <Receipt size={16} weight="bold" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Ringkasan Struk Kasir
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>Subtotal Menu</span>
          <span className="font-mono font-bold text-slate-900">{safeIDR(room.subtotal)}</span>
        </div>

        {hasTax && (
          <div className="flex items-center justify-between">
            <span>Pajak Restoran (PB1)</span>
            <span className="font-mono font-bold text-slate-900">{safeIDR(room.tax_amount)}</span>
          </div>
        )}

        {hasService && (
          <div className="flex items-center justify-between">
            <span>Biaya Layanan (Service)</span>
            <span className="font-mono font-bold text-slate-900">{safeIDR(room.service_amount)}</span>
          </div>
        )}

        {hasDiscount && (
          <div className="flex items-center justify-between text-emerald-600 font-bold">
            <span>Potongan Diskon</span>
            <span className="font-mono">-{safeIDR(room.discount_amount)}</span>
          </div>
        )}

        <div className="mt-1 flex items-baseline justify-between rounded-xl bg-slate-50/90 p-3.5 border border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Grand Total Kasir</span>
            <span className="text-[10px] text-slate-400 font-medium">Total seluruh tagihan meja</span>
          </div>
          <span className="font-mono text-lg font-black text-slate-900 tabular-nums">
            {safeIDR(room.grand_total)}
          </span>
        </div>
      </div>
    </section>
  );
}
