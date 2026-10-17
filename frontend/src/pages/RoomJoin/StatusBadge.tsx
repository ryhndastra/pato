import { CheckCircle, LockSimple } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StatusBadgeProps {
  status: RoomStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "LOCKED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 shadow-2xs">
          <LockSimple size={12} weight="bold" className="text-amber-600" />
          <span>Tagihan Dikunci</span>
        </span>
      );

    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
          <CheckCircle size={12} weight="bold" className="text-emerald-600" />
          <span>Selesai</span>
        </span>
      );

    case "CLAIMING":
    case "DRAFT":
    default:
      return null;
  }
}
