import { useState } from "react";
import {
  CheckCircle,
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
    <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Crown size={15} weight="fill" className="text-amber-500" />
          <span className="text-xs font-bold text-slate-800">
            Pusat Kontrol Host
          </span>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
          Host Admin
        </span>
      </div>

      {unclaimedPortions > 0 ? (
        <div className="flex items-center justify-between gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/60 p-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <WarningCircle size={16} weight="fill" className="shrink-0 text-amber-600" />
            <p className="text-[11px] text-amber-900 leading-tight">
              Ada <strong className="font-extrabold text-amber-950">{unclaimedPortions} porsi</strong> belum diklaim teman.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSplitUnclaimed}
            disabled={splitting}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-amber-700 active:scale-95 disabled:opacity-60"
          >
            <MagicWand size={13} weight="bold" />
            <span>{splitting ? "Membagi..." : "Bagi Rata"}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/50 p-2 text-[11px] text-emerald-800 border border-emerald-100">
          <CheckCircle size={15} weight="fill" className="text-emerald-600 shrink-0" />
          <span>Semua menu telah lengkap terbagi ke peserta meja.</span>
        </div>
      )}

      {splitError && (
        <p className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 border border-rose-100">
          {splitError}
        </p>
      )}

      {lockError && (
        <p className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 border border-rose-100">
          {lockError}
        </p>
      )}

      <button
        type="button"
        onClick={onLock}
        disabled={locking}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-xs font-bold text-white shadow-xs transition-all hover:bg-black active:scale-[0.98] disabled:opacity-60"
      >
        <LockSimple size={15} weight="bold" />
        <span>{locking ? "Mengunci Meja..." : "Kunci Tagihan & Buka Pembayaran"}</span>
      </button>
    </div>
  );
}
