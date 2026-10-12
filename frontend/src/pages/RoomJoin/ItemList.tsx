import { Receipt } from "@phosphor-icons/react";
import type { RoomItem } from "./types";
import { safeIDR } from "./money";

interface ItemListProps {
  items: RoomItem[];
}

export function ItemList({ items }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-hairline px-5 py-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-haze text-ink-muted">
          <Receipt size={20} weight="regular" />
        </span>
        <p className="text-[13px] font-bold text-ink">Belum ada item di meja ini</p>
        <p className="max-w-[26ch] text-[12px] text-ink-soft">
          Host belum menambahkan menu. Coba muat ulang sebentar lagi.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline px-4">
      {items.map((item) => {
        const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
        return (
          <li key={item.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{item.name}</p>
              <p className="text-[12px] text-ink-muted">
                {safeIDR(item.unit_price)} x {qty}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[14px] font-bold text-ink">
              {safeIDR(item.unit_price * qty)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
