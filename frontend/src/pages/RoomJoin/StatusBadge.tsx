import { CheckCircle, LockSimple, PencilSimple } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StatusBadgeProps {
  status: RoomStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "CLAIMING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-100 backdrop-blur-sm shadow-2xs">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
          </span>
          <span>Live Klaim</span>
        </span>
      );

    case "LOCKED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-100 backdrop-blur-sm shadow-2xs">
          <LockSimple size={11} weight="fill" className="text-amber-300" />
          <span>Tagihan Dikunci</span>
        </span>
      );

    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-white backdrop-blur-sm shadow-2xs">
          <CheckCircle size={12} weight="fill" className="text-emerald-300" />
          <span>Selesai</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-2.5 py-0.5 text-[10px] font-bold text-blue-100 backdrop-blur-sm shadow-2xs">
          <PencilSimple size={11} weight="bold" className="text-blue-200" />
          <span>Draft Klaim</span>
        </span>
      );
  }
}
