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
      className="flex w-full items-center justify-between gap-1.5 rounded-xl border border-slate-200/80 bg-white/95 p-1 shadow-2xs backdrop-blur-sm"
    >
      {steps.map((step) => {
        let containerStyle = "text-slate-400 bg-transparent hover:text-slate-600";
        let badgeStyle = "bg-slate-100 text-slate-400";
        let indicator = <span className="font-mono text-[10px] font-bold">{step.id}</span>;

        if (isClosed) {
          containerStyle = "text-emerald-800 bg-emerald-50/70 font-bold";
          badgeStyle = "bg-emerald-600 text-white";
          indicator = <Check size={11} weight="bold" />;
        } else if (step.isCurrent) {
          containerStyle = "text-blue-900 bg-blue-50/80 font-black shadow-2xs ring-1 ring-blue-100";
          badgeStyle = "bg-blue-600 text-white";
          indicator = (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
          );
        } else if (step.isDone) {
          containerStyle = "text-slate-700 font-semibold";
          badgeStyle = "bg-emerald-100 text-emerald-700";
          indicator = <Check size={11} weight="bold" />;
        }

        return (
          <div
            key={step.id}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 transition-all select-none ${containerStyle}`}
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
