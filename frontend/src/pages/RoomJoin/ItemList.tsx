import {
  Check,
  ForkKnife,
  Minus,
  Plus,
  UsersThree,
} from "@phosphor-icons/react";
import type { RoomItem, RoomMember, RoomStatus } from "./types";
import { safeIDR } from "./money";

interface ItemListProps {
  items: RoomItem[];
  members: RoomMember[];
  currentMemberId: string | null;
  roomStatus: RoomStatus;
  pendingItemId: string | null;
  onClaim: (itemId: string) => void;
  onUnclaim: (itemId: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ItemList({
  items,
  members,
  currentMemberId,
  roomStatus,
  pendingItemId,
  onClaim,
  onUnclaim,
}: ItemListProps) {
  const claimsLocked = roomStatus === "LOCKED" || roomStatus === "CLOSED";

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-2xs">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <ForkKnife size={22} weight="regular" />
        </span>
        <p className="text-sm font-bold text-ink">Belum ada menu di meja ini</p>
        <p className="max-w-[32ch] text-xs text-slate-500">
          Host belum menambahkan pesanan makanan atau minuman.
        </p>
      </div>
    );
  }

  const membersById = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const qty = Number.isFinite(item.quantity) ? item.quantity : 1;
        const totalItemPrice = item.unit_price * qty;

        const myClaim = item.claims?.find((c) => c.member_id === currentMemberId);
        const myPortions = myClaim
          ? Number(myClaim.portion_quantity)
          : currentMemberId && item.claimed_by_member_ids?.includes(currentMemberId)
            ? 1
            : 0;

        const isFull = !item.is_shared && item.claimed_quantity >= qty;
        const canClaimMore = currentMemberId && !claimsLocked && (item.is_shared || !isFull);
        const isPending = pendingItemId === item.id;
        const remainingQty = Math.max(0, qty - item.claimed_quantity);

        return (
          <div
            key={item.id}
            className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all shadow-2xs ${
              myPortions > 0
                ? "border-blue-300 bg-blue-50/30 ring-1 ring-blue-100"
                : "border-slate-200/90 bg-white hover:border-slate-300"
            }`}
          >
            {/* Top row: Name, price, status badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm sm:text-base font-extrabold text-ink">
                  {item.name}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-mono font-medium">{safeIDR(item.unit_price)}</span>
                  <span>× {qty} porsi</span>
                  <span className="text-slate-300">·</span>

                  {item.is_shared ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      <UsersThree size={12} weight="bold" />
                      Bagi Rata
                    </span>
                  ) : item.claimed_quantity >= qty ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <Check size={11} weight="bold" />
                      Lengkap ({qty}/{qty})
                    </span>
                  ) : item.claimed_quantity > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      Sisa {remainingQty} Porsi
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      Belum Diklaim
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="font-mono text-sm sm:text-base font-black text-ink">
                  {safeIDR(totalItemPrice)}
                </span>
                {myPortions > 0 && (
                  <p className="mt-0.5 font-mono text-[11px] font-bold text-blue-600">
                    Bagianmu: {safeIDR(item.unit_price * myPortions)}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom row: Claimers chips + Stepper buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              {/* Claimers avatars/chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] min-h-7">
                {item.claims && item.claims.length > 0 ? (
                  item.claims.map((claim) => {
                    const m = membersById.get(claim.member_id);
                    const name = m?.display_name ?? "Tamu";
                    const isThisMe = claim.member_id === currentMemberId;
                    const portionText = claim.portion_quantity > 1 ? ` (${claim.portion_quantity}x)` : "";

                    return (
                      <span
                        key={claim.member_id}
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${
                          isThisMe
                            ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 text-[8px] font-bold text-slate-800">
                          {getInitials(name)}
                        </span>
                        <span>
                          {name}
                          {portionText}
                        </span>
                      </span>
                    );
                  })
                ) : item.claimed_by_member_ids && item.claimed_by_member_ids.length > 0 ? (
                  item.claimed_by_member_ids.map((memberId) => {
                    const m = membersById.get(memberId);
                    const name = m?.display_name ?? "Tamu";
                    const isThisMe = memberId === currentMemberId;

                    return (
                      <span
                        key={memberId}
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${
                          isThisMe ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 text-[8px] font-bold text-slate-800">
                          {getInitials(name)}
                        </span>
                        <span>{name}</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Belum ada yang memilih
                  </span>
                )}
              </div>

              {/* Stepper / Claim Control */}
              {currentMemberId && !claimsLocked && (
                <div className="shrink-0">
                  {myPortions > 0 ? (
                    <div className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white p-1 shadow-2xs">
                      {/* Minus button */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onUnclaim(item.id)}
                        title={myPortions > 1 ? "Kurangi 1 porsi" : "Batalkan klaim"}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 active:scale-95 disabled:opacity-50"
                      >
                        <Minus size={13} weight="bold" />
                      </button>

                      {/* Portion text */}
                      <span className="px-1.5 font-mono text-xs font-black text-blue-700">
                        {myPortions} Porsi Kamu
                      </span>

                      {/* Plus button */}
                      {!item.is_shared && qty > 1 && (
                        <button
                          type="button"
                          disabled={!canClaimMore || isPending}
                          onClick={() => onClaim(item.id)}
                          title="Tambah 1 porsi lagi"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          <Plus size={13} weight="bold" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!canClaimMore || isPending}
                      onClick={() => onClaim(item.id)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed ${
                        isFull
                          ? "bg-slate-100 text-slate-400"
                          : "bg-blue-600 text-white shadow-xs hover:bg-blue-700"
                      }`}
                    >
                      {isPending ? (
                        <span>Memproses...</span>
                      ) : isFull ? (
                        <span>Porsi Habis</span>
                      ) : (
                        <>
                          <Plus size={13} weight="bold" />
                          <span>Klaim Porsi</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
