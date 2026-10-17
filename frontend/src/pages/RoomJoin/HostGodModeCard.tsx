import { useState } from "react";
import {
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
  onSplitUnclaimed,
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

  if (splitError || lockError) {
    return (
      <div className="flex flex-col gap-1.5">
        {splitError && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 border border-rose-100">
            {splitError}
          </p>
        )}
        {lockError && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 border border-rose-100">
            {lockError}
          </p>
        )}
      </div>
    );
  }

  // If unclaimed portions exist: show compact amber action banner
  if (unclaimedPortions > 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-amber-50/90 p-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100/90 text-amber-600 shadow-2xs">
            <WarningCircle size={16} weight="fill" />
          </div>
          <p className="text-xs text-amber-950">
            Ada <strong className="font-extrabold text-amber-900">{unclaimedPortions} porsi</strong> belum diklaim teman.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSplitUnclaimed}
          disabled={splitting}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-[0_2px_10px_rgba(217,119,6,0.25)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
        >
          <MagicWand size={13} weight="bold" />
          <span>{splitting ? "Membagi..." : "Bagi Rata"}</span>
        </button>
      </div>
    );
  }

  return null;
}
