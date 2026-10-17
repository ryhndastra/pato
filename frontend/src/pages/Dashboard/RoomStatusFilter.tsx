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
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
              isActive
                ? "bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)]"
                : "bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-900 shadow-2xs"
            }`}
          >
            <span>{filter.label}</span>
            {count !== null && count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
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
