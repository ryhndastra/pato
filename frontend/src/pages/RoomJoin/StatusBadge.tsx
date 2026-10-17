import { CheckCircle, LockSimple } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StatusBadgeProps {
  status: RoomStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "LOCKED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-100 backdrop-blur-md shadow-2xs">
          <LockSimple size={12} weight="bold" className="text-amber-300" />
          <span>Tagihan Dikunci</span>
        </span>
      );

    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-100 backdrop-blur-md shadow-2xs">
          <CheckCircle size={12} weight="bold" className="text-emerald-300" />
          <span>Selesai</span>
        </span>
      );

    case "CLAIMING":
    case "DRAFT":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-md shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span>Meja Terbuka</span>
        </span>
      );
  }
}
