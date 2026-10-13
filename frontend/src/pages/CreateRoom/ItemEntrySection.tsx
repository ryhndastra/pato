import { useState } from "react";
import {
  ForkKnife,
  Minus,
  Plus,
  Receipt,
  Trash,
} from "@phosphor-icons/react";
import { digitsOnly, formatIDR } from "../../lib/format";
import type { DraftItem } from "./types";

interface ItemEntrySectionProps {
  items: DraftItem[];
  onAddItem: (item: Omit<DraftItem, "id">) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

const QUICK_ITEM_SUGGESTIONS = [
  { name: "Es Teh Manis", price: 8000 },
  { name: "Air Mineral", price: 6000 },
  { name: "Nasi Putih", price: 8000 },
  { name: "Kentang Goreng", price: 25000 },
];

export function ItemEntrySection({
  items,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
}: ItemEntrySectionProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);

  const canAdd = name.trim().length > 0 && Number(price) > 0;

  function handleAdd() {
    if (!canAdd) return;
    onAddItem({ name: name.trim(), unitPrice: Number(price), quantity });
    setName("");
    setPrice("");
    setQuantity(1);
  }

  function handleQuickAdd(suggestion: { name: string; price: number }) {
    onAddItem({ name: suggestion.name, unitPrice: suggestion.price, quantity: 1 });
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_32px_rgba(37,99,235,0.06)] sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 aspect-square items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <ForkKnife size={22} weight="bold" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Daftar Menu & Pesanan
          </h2>
          <p className="text-xs text-slate-500">
            Tambahkan setiap menu dari struk agar teman bisa memilih bagian masing-masing
          </p>
        </div>
      </div>

      {/* Input Form Box */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4">
          {/* Item Name */}
          <div className="sm:col-span-6">
            <label htmlFor="new-item-name" className="mb-1.5 block text-xs font-bold text-slate-700">
              Nama Menu
            </label>
            <input
              id="new-item-name"
              type="text"
              placeholder="Contoh: Salmon Sashimi / Es Kopi Susu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
            />
          </div>

          {/* Unit Price */}
          <div className="sm:col-span-4">
            <label htmlFor="new-item-price" className="mb-1.5 block text-xs font-bold text-slate-700">
              Harga Satuan
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                id="new-item-price"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={price ? Number(price).toLocaleString("id-ID") : ""}
                onChange={(e) => setPrice(digitsOnly(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canAdd) {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pr-4 pl-11 font-mono text-sm font-medium text-slate-900 placeholder:font-sans placeholder:text-slate-400 transition-all focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
              />
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Jumlah</span>
            <div className="flex h-12 items-center justify-between rounded-2xl border border-slate-200 bg-white px-2">
              <button
                type="button"
                aria-label="Kurangi porsi"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95"
              >
                <Minus size={14} weight="bold" />
              </button>
              <span className="w-6 text-center font-mono text-sm font-bold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Tambah porsi"
                onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95"
              >
                <Plus size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips (Swipeable track on mobile) */}
        <div className="mt-3.5">
          <span className="mb-2 block text-xs font-semibold text-slate-500">
            Pilihan Cepat Menu
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 sm:flex-wrap no-scrollbar">
            {QUICK_ITEM_SUGGESTIONS.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleQuickAdd(item)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
              >
                <Plus size={12} weight="bold" className="shrink-0 text-blue-600" />
                <span className="whitespace-nowrap">{item.name}</span>
                <span className="font-mono text-slate-400 whitespace-nowrap">({formatIDR(item.price)})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <Plus size={18} weight="bold" />
          <span>Tambah Menu ke Daftar</span>
        </button>
      </div>

      {/* Items List */}
      <div className="mt-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center">
            <div className="flex h-12 w-12 shrink-0 aspect-square items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Receipt size={28} weight="bold" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">Belum ada menu yang ditambahkan</p>
            <p className="mt-1 text-xs text-slate-500">
              Masukkan menu dari struk di atas agar teman bisa memilih pesanannya
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500">
              <span>Menu Pesanan ({items.length})</span>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-2xs">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 transition-colors hover:bg-slate-50/40"
                >
                  {/* Top Tier: Menu title & delete button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
                        {item.name}
                      </h4>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        {formatIDR(item.unitPrice)} / porsi
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label={`Hapus ${item.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                    >
                      <Trash size={18} weight="regular" />
                    </button>
                  </div>

                  {/* Bottom Tier: Quantity stepper & Subtotal */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-3">
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                      <button
                        type="button"
                        aria-label="Kurangi porsi"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-white active:scale-90 transition-transform"
                      >
                        <Minus size={13} weight="bold" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Tambah porsi"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-white active:scale-90 transition-transform"
                      >
                        <Plus size={13} weight="bold" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Subtotal
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900 sm:text-base">
                        {formatIDR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
