import { CheckCircle, LockSimple } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StatusBadgeProps {
  status: RoomStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "LOCKED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm shadow-2xs">
          <LockSimple size={12} weight="bold" />
          <span>Tagihan Dikunci</span>
        </span>
      );

    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm shadow-2xs">
          <CheckCircle size={12} weight="bold" />
          <span>Selesai</span>
        </span>
      );

    case "CLAIMING":
    default:
      return null;
  }
}
