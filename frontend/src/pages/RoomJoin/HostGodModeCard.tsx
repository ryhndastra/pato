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
      <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3.5 py-2 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <WarningCircle size={16} weight="fill" className="shrink-0 text-amber-600" />
          <p className="text-xs text-amber-950">
            Ada <strong className="font-extrabold text-amber-900">{unclaimedPortions} porsi</strong> belum diklaim teman.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSplitUnclaimed}
          disabled={splitting}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-amber-700 active:scale-95 disabled:opacity-60"
        >
          <MagicWand size={13} weight="bold" />
          <span>{splitting ? "Membagi..." : "Bagi Rata"}</span>
        </button>
      </div>
    );
  }

  return null;
}
