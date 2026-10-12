import { STATUS_FILTERS, type RoomStatus } from "./roomStatus";

interface RoomStatusFilterProps {
  value: "ALL" | RoomStatus;
  onChange: (value: "ALL" | RoomStatus) => void;
  counts?: Record<string, number>;
}

export function RoomStatusFilter({ value, onChange, counts }: RoomStatusFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {STATUS_FILTERS.map((filter) => {
        const isActive = value === filter.id;
        const count = counts ? counts[filter.id] ?? 0 : null;

        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-[0.98] ${
              isActive
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100/90 text-ink-soft hover:bg-slate-200/80 hover:text-ink ring-1 ring-black/5"
            }`}
          >
            <span>{filter.label}</span>
            {count !== null && count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  isActive ? "bg-white/20 text-white" : "bg-white text-ink-muted ring-1 ring-black/5"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
