import { CheckCircle, CircleDashed, LockSimple } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StatusConfig {
  label: string;
  className: string;
  icon?: React.ReactNode;
}

export function StatusBadge({ status }: { status: RoomStatus }) {
  let config: StatusConfig;

  switch (status) {
    case "CLAIMING":
      config = {
        label: "Live Klaim",
        className: "bg-emerald-500 text-white border-emerald-400 shadow-xs",
        icon: (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
        ),
      };
      break;
    case "LOCKED":
      config = {
        label: "Tagihan Dikunci",
        className: "bg-amber-400 text-slate-900 border-amber-300 shadow-xs font-black",
        icon: <LockSimple size={12} weight="bold" />,
      };
      break;
    case "CLOSED":
      config = {
        label: "Selesai",
        className: "bg-white/20 text-white border-white/30 backdrop-blur-sm",
        icon: <CheckCircle size={12} weight="fill" className="text-emerald-300" />,
      };
      break;
    default:
      config = {
        label: "Draft",
        className: "bg-white/20 text-white border-white/30 backdrop-blur-sm",
        icon: <CircleDashed size={12} weight="bold" />,
      };
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-extrabold tracking-tight ${config.className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
