import { useState } from "react";
import {
  Crown,
  LockSimple,
  MagicWand,
  WarningCircle,
} from "@phosphor-icons/react";
import type { RoomDetail } from "./types";

interface HostGodModeCardProps {
  room: RoomDetail;
  onLock: () => Promise<void>;
  onSplitUnclaimed: () => Promise<void>;
  locking: boolean;
  lockError: string | null;
}

export function HostGodModeCard({
  room,
  onLock,
  onSplitUnclaimed,
  locking,
  lockError,
}: HostGodModeCardProps) {
  const [splitting, setSplitting] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);

  const items = room.items ?? [];
  const unclaimedPortions = items.reduce((acc, item) => {
    if (item.is_shared) return acc;
    const remaining = Math.max(0, item.quantity - item.claimed_quantity);
    return acc + remaining;
  }, 0);

  async function handleSplitUnclaimed() {
    setSplitting(true);
    setSplitError(null);
    try {
      await onSplitUnclaimed();
    } catch (err: unknown) {
      setSplitError(err instanceof Error ? err.message : "Gagal membagi rata item.");
    } finally {
      setSplitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Crown size={15} weight="fill" className="text-amber-500" />
          <span className="text-xs font-bold text-slate-800">
            Kontrol Host Meja
          </span>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
          Live Klaim
        </span>
      </div>

      {unclaimedPortions > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <WarningCircle size={15} weight="fill" className="shrink-0 text-amber-600" />
            <span className="text-xs text-amber-900">
              Ada <strong className="font-bold">{unclaimedPortions} porsi</strong> belum diklaim teman.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSplitUnclaimed}
            disabled={splitting}
            className="inline-flex h-7.5 shrink-0 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 text-xs font-bold text-amber-900 shadow-2xs transition-all hover:bg-amber-100 active:scale-95 disabled:opacity-60"
          >
            <MagicWand size={12} weight="bold" className="text-amber-600" />
            <span>{splitting ? "Membagi..." : "Bagi Rata"}</span>
          </button>
        </div>
      )}

      {splitError && (
        <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
          {splitError}
        </p>
      )}

      {lockError && (
        <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
          {lockError}
        </p>
      )}

      <button
        type="button"
        onClick={onLock}
        disabled={locking}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-2xs transition-all hover:bg-blue-700 active:scale-98 disabled:opacity-60"
      >
        <LockSimple size={15} weight="bold" />
        <span>{locking ? "Mengunci Meja..." : "Kunci Tagihan & Buka Pembayaran"}</span>
      </button>
    </div>
  );
}
