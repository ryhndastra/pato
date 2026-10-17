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
      className="flex w-full items-center justify-between gap-1 rounded-xl bg-slate-100/90 p-1"
    >
      {steps.map((step) => {
        let containerStyle = "text-slate-400";
        let badgeStyle = "bg-slate-200/70 text-slate-500";
        let indicator = <span className="font-mono text-[9px] font-bold">{step.id}</span>;

        if (isClosed) {
          containerStyle = "text-emerald-800 bg-white shadow-2xs font-bold";
          badgeStyle = "bg-emerald-600 text-white shadow-2xs";
          indicator = <Check size={10} weight="bold" />;
        } else if (step.isCurrent) {
          containerStyle = "text-slate-900 bg-white shadow-2xs font-extrabold";
          badgeStyle = "bg-blue-600 text-white shadow-xs";
          indicator = (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          );
        } else if (step.isDone) {
          containerStyle = "text-emerald-700 font-semibold";
          badgeStyle = "bg-emerald-100 text-emerald-800";
          indicator = <Check size={10} weight="bold" />;
        }

        return (
          <div
            key={step.id}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 px-1.5 transition-all select-none ${containerStyle}`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${badgeStyle}`}
            >
              {indicator}
            </span>
            <span className="text-[10px] sm:text-[11px] truncate tracking-tight">{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
