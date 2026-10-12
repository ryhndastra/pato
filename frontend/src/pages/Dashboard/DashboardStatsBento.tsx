import {
  Coins,
  Lightning,
  CaretRight,
} from "@phosphor-icons/react";
import { formatIDR } from "../../lib/format";
import type { RoomStatus } from "./roomStatus";

interface DashboardStatsBentoProps {
  spentThisMonth: number;
  activeCount: number;
  totalRooms: number;
  onFilterActive: (status: RoomStatus) => void;
}

export function DashboardStatsBento({
  spentThisMonth,
  activeCount,
  totalRooms,
  onFilterActive,
}: DashboardStatsBentoProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {/* Financial summary */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs sm:p-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-ink-muted uppercase tracking-wider sm:text-xs">
            <Coins size={16} weight="bold" className="text-blue-600" />
            <span>Pengeluaran Bulan Ini</span>
          </span>
        </div>

        <p className="mt-2.5 font-mono text-xl font-extrabold tracking-tight text-ink sm:mt-3 sm:text-3xl">
          {formatIDR(spentThisMonth)}
        </p>

        <p className="mt-2 text-[11px] text-ink-muted sm:text-xs">
          Pajak resto & diskon dibagi proporsional.
        </p>
      </div>

      {/* Room status */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs sm:p-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-ink-muted uppercase tracking-wider sm:text-xs">
            <Lightning size={16} weight="bold" className="text-amber-500" />
            <span>Room Aktif</span>
          </span>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              activeCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
            }`}
          />
        </div>

        <div className="mt-2.5 flex items-baseline gap-2 sm:mt-3">
          <span className="font-mono text-xl font-extrabold text-ink sm:text-3xl">
            {activeCount}
          </span>
          <span className="text-xs font-semibold text-ink-muted">
            dari {totalRooms} total meja
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-ink-soft sm:text-xs">
            {activeCount > 0 ? "Klaim & bayar live" : "Semua selesai"}
          </span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterActive("CLAIMING")}
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 sm:text-xs"
            >
              <span>Filter</span>
              <CaretRight size={12} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
