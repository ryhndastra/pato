import { useState } from "react";
import { Minus, Plus } from "@phosphor-icons/react";
import { digitsOnly } from "../../lib/format";
import type { DraftItem } from "./types";

interface ItemFormProps {
  onAdd: (item: Omit<DraftItem, "id">) => void;
}

export function ItemForm({ onAdd }: ItemFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);

  const canAdd = name.trim().length > 0 && Number(price) > 0;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({ name: name.trim(), unitPrice: Number(price), quantity });
    setName("");
    setPrice("");
    setQuantity(1);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-hairline p-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-name" className="pl-0.5 text-[13px] font-semibold text-ink-soft">
          Nama Menu
        </label>
        <input
          id="item-name"
          type="text"
          placeholder="Contoh: Salmon Sashimi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-[48px] rounded-xl border border-hairline bg-shell px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="item-price" className="pl-0.5 text-[13px] font-semibold text-ink-soft">
            Harga Satuan
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[15px] text-ink-muted">
              Rp
            </span>
            <input
              id="item-price"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={price ? Number(price).toLocaleString("id-ID") : ""}
              onChange={(e) => setPrice(digitsOnly(e.target.value))}
              className="h-[48px] w-full rounded-xl border border-hairline bg-shell py-0 pr-4 pl-10 font-mono text-[15px] text-ink placeholder:font-sans placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="pl-0.5 text-[13px] font-semibold text-ink-soft">Jumlah</span>
          <div className="flex h-[48px] items-center gap-1 rounded-xl border border-hairline px-1">
            <button
              type="button"
              aria-label="Kurangi jumlah"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink active:bg-haze"
            >
              <Minus size={16} weight="bold" />
            </button>
            <span className="w-6 text-center font-mono text-[15px] text-ink">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Tambah jumlah"
              onClick={() => setQuantity((q) => Math.min(999, q + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink active:bg-haze"
            >
              <Plus size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className="flex h-[48px] items-center justify-center gap-2 rounded-xl bg-haze text-[15px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={18} weight="bold" />
        Tambah Item
      </button>
    </div>
  );
}
