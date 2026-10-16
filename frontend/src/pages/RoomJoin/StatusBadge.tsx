import { CheckCircle, LockSimple, PencilSimple } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StatusBadgeProps {
  status: RoomStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "CLAIMING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Live Klaim</span>
        </span>
      );

    case "LOCKED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1 text-[11px] font-bold text-amber-800 shadow-2xs">
          <LockSimple size={12} weight="fill" className="text-amber-600" />
          <span>Tagihan Dikunci</span>
        </span>
      );

    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-2.5 py-1 text-[11px] font-black text-white shadow-2xs">
          <CheckCircle size={13} weight="fill" className="text-emerald-400" />
          <span>Selesai</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-2xs">
          <PencilSimple size={12} weight="bold" className="text-slate-400" />
          <span>Draft Klaim</span>
        </span>
      );
  }
}
