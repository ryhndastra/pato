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
    <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-fade-up stagger-2">
      {/* Financial summary card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_25px_rgba(37,99,235,0.06)] sm:p-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider sm:text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Coins size={14} weight="bold" />
            </span>
            <span>Pengeluaran Bulan Ini</span>
          </span>
        </div>

        <p className="mt-2.5 font-mono text-xl font-black tracking-tight text-slate-900 sm:mt-3 sm:text-3xl">
          {formatIDR(spentThisMonth)}
        </p>

        <p className="mt-2 text-[11px] text-slate-400 sm:text-xs">
          Pajak resto & diskon proporsional.
        </p>
      </div>

      {/* Room status card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_25px_rgba(37,99,235,0.06)] sm:p-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider sm:text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <Lightning size={14} weight="bold" />
            </span>
            <span>Room Aktif</span>
          </span>
          <span className="relative flex h-2.5 w-2.5">
            {activeCount > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                activeCount > 0 ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
          </span>
        </div>

        <div className="mt-2.5 flex items-baseline gap-2 sm:mt-3">
          <span className="font-mono text-xl font-black text-slate-900 sm:text-3xl">
            {activeCount}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            dari {totalRooms} total meja
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 sm:text-xs">
            {activeCount > 0 ? "Klaim & bayar live" : "Semua selesai"}
          </span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterActive("CLAIMING")}
              className="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 active:scale-95 transition-all sm:text-xs"
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
