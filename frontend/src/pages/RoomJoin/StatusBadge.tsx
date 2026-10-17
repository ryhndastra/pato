import { CheckCircle, LockSimple } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StatusBadgeProps {
  status: RoomStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "LOCKED":
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 shadow-2xs">
          <LockSimple size={11} weight="bold" className="text-amber-700 shrink-0" />
          <span>Dikunci</span>
        </span>
      );

    case "CLOSED":
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900 shadow-2xs">
          <CheckCircle size={11} weight="fill" className="text-emerald-600 shrink-0" />
          <span>Selesai</span>
        </span>
      );

    case "CLAIMING":
    case "DRAFT":
    default:
      return null;
  }
}
