import { CheckCircle, LockSimple, PencilSimple } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StatusBadgeProps {
  status: RoomStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "CLAIMING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-100 backdrop-blur-sm shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
          </span>
          <span>Live Klaim</span>
        </span>
      );

    case "LOCKED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-400/20 px-2.5 py-1 text-[11px] font-bold text-amber-100 backdrop-blur-sm shadow-2xs">
          <LockSimple size={12} weight="fill" className="text-amber-300" />
          <span>Tagihan Dikunci</span>
        </span>
      );

    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/20 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur-sm shadow-2xs">
          <CheckCircle size={13} weight="fill" className="text-emerald-300" />
          <span>Selesai</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-blue-100 backdrop-blur-sm shadow-2xs">
          <PencilSimple size={12} weight="bold" className="text-blue-200" />
          <span>Draft Klaim</span>
        </span>
      );
  }
}
