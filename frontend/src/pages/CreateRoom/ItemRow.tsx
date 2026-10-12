import { Trash } from "@phosphor-icons/react";
import { formatIDR } from "../../lib/format";
import type { DraftItem } from "./types";

interface ItemRowProps {
  item: DraftItem;
  onRemove: (id: string) => void;
}

export function ItemRow({ item, onRemove }: ItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-ink">
          {item.name}
          <span className="ml-1.5 font-mono text-[13px] font-normal text-ink-muted">
            x{item.quantity}
          </span>
        </p>
        <p className="font-mono text-[13px] text-ink-soft">
          {formatIDR(item.unitPrice)} / porsi
        </p>
      </div>
      <p className="shrink-0 font-mono text-[14px] font-bold text-ink">
        {formatIDR(item.unitPrice * item.quantity)}
      </p>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label={`Hapus ${item.name}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted active:bg-danger-bg active:text-danger"
      >
        <Trash size={16} weight="regular" />
      </button>
    </div>
  );
}
