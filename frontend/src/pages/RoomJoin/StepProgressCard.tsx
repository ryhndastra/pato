import { CaretRight, CheckCircle, CircleDashed } from "@phosphor-icons/react";
import type { RoomStatus } from "./types";

interface StepProgressCardProps {
  status: RoomStatus;
  isHost?: boolean;
}

export function StepProgressCard({ status }: StepProgressCardProps) {
  const isClaiming = status === "DRAFT" || status === "CLAIMING";
  const isLocked = status === "LOCKED";
  const isClosed = status === "CLOSED";

  const stages = [
    {
      id: 1,
      name: "1. Klaim Menu",
      done: isLocked || isClosed,
      current: isClaiming,
    },
    {
      id: 2,
      name: "2. Pelunasan",
      done: isClosed,
      current: isLocked,
    },
    {
      id: 3,
      name: "3. Selesai",
      done: isClosed,
      current: isClosed,
    },
  ];

  return (
    <nav
      aria-label="Progress Tahapan Meja"
      className="flex w-full items-center justify-between gap-1 rounded-2xl bg-white/90 p-1.5 shadow-2xs border border-slate-200/70 backdrop-blur-sm"
    >
      {stages.map((stage, idx) => {
        let pillClass = "bg-slate-100/80 text-slate-400";
        let icon: React.ReactNode = (
          <CircleDashed size={12} weight="bold" className="shrink-0 text-slate-300" />
        );

        if (isClosed) {
          // When all is done, all steps celebrate completion
          pillClass =
            stage.id === 3
              ? "bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-500"
              : "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100";
          icon = (
            <CheckCircle
              size={13}
              weight="fill"
              className={stage.id === 3 ? "text-white shrink-0" : "text-emerald-600 shrink-0"}
            />
          );
        } else if (stage.current) {
          pillClass = "bg-blue-600 text-white font-extrabold shadow-xs ring-1 ring-blue-500";
          icon = <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse shrink-0" />;
        } else if (stage.done) {
          pillClass = "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100";
          icon = <CheckCircle size={13} weight="fill" className="text-emerald-600 shrink-0" />;
        }

        return (
          <div key={stage.id} className="flex flex-1 items-center gap-1">
            <div
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 px-2 text-[11px] transition-all select-none ${pillClass}`}
            >
              {icon}
              <span className="truncate">{stage.name}</span>
            </div>

            {idx < stages.length - 1 && (
              <CaretRight
                size={12}
                weight="bold"
                className="text-slate-300 shrink-0 select-none"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
