import { Check } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StepProgressCardProps {
  status: RoomStatus;
}

export function StepProgressCard({ status }: StepProgressCardProps) {
  const isClaiming = status === "DRAFT" || status === "CLAIMING";
  const isLocked = status === "LOCKED";
  const isClosed = status === "CLOSED";

  const steps = [
    {
      id: 1,
      label: "Klaim Menu",
      isCurrent: isClaiming,
      isDone: isLocked || isClosed,
    },
    {
      id: 2,
      label: "Pelunasan",
      isCurrent: isLocked,
      isDone: isClosed,
    },
    {
      id: 3,
      label: "Selesai",
      isCurrent: isClosed,
      isDone: isClosed,
    },
  ];

  return (
    <nav
      aria-label="Tahapan Meja"
      className="flex w-full items-center justify-between gap-1.5 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-xs backdrop-blur-md"
    >
      {steps.map((step) => {
        let containerStyle = "text-slate-400 bg-transparent border-transparent";
        let badgeStyle = "bg-slate-100 text-slate-400";
        let indicator = <span className="font-mono text-[10px] font-bold">{step.id}</span>;

        if (isClosed) {
          containerStyle = "text-emerald-900 bg-emerald-50/70 border-emerald-200/60 font-bold shadow-2xs";
          badgeStyle = "bg-emerald-600 text-white shadow-2xs";
          indicator = <Check size={11} weight="bold" />;
        } else if (step.isCurrent) {
          containerStyle = "text-blue-900 bg-blue-50/70 border-blue-200/60 font-bold shadow-2xs";
          badgeStyle = "bg-blue-600 text-white shadow-xs";
          indicator = (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          );
        } else if (step.isDone) {
          containerStyle = "text-emerald-800 bg-emerald-50/40 border-emerald-200/40 font-semibold";
          badgeStyle = "bg-emerald-600 text-white shadow-2xs";
          indicator = <Check size={11} weight="bold" />;
        }

        return (
          <div
            key={step.id}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-1.5 px-2 transition-all select-none ${containerStyle}`}
          >
            <span
              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full transition-colors ${badgeStyle}`}
            >
              {indicator}
            </span>
            <span className="text-[11px] truncate tracking-tight">{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
