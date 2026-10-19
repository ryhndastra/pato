import { memo } from "react";
import {
  Check,
  CheckCircle,
  Crown,
  Minus,
  Plus,
  Trash,
  UsersThree,
} from "@phosphor-icons/react";
import type { RoomItem, RoomMember } from "./types";
import { safeIDR } from "./money";

interface ItemCardProps {
  item: RoomItem;
  membersById: Map<string, RoomMember>;
  currentMemberId: string | null;
  claimsLocked: boolean;
  isPending: boolean;
  onClaim: (itemId: string) => void;
  onUnclaim: (itemId: string) => void;
  onJoinPrompt?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const ItemCard = memo(function ItemCard({
  item,
  membersById,
  currentMemberId,
  claimsLocked,
  isPending,
  onClaim,
  onUnclaim,
  onJoinPrompt,
}: ItemCardProps) {
  const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
  const totalItemPrice = item.unit_price * qty;

  const myClaim = item.claims?.find((c) => c.member_id === currentMemberId);
  const myPortions = myClaim
    ? Number(myClaim.portion_quantity)
    : currentMemberId && item.claimed_by_member_ids?.includes(currentMemberId)
      ? 1
      : 0;

  const totalClaimers = Math.max(1, item.claims?.length ?? item.claimed_by_member_ids?.length ?? 1);

  // Proportional price for shared dishes
  const mySharePrice = item.is_shared
    ? Math.round(totalItemPrice / totalClaimers)
    : item.unit_price * myPortions;

  const isFull = !item.is_shared && item.claimed_quantity >= qty;
  const canClaimMore = currentMemberId && !claimsLocked && (item.is_shared || !isFull);
  const remainingQty = Math.max(0, qty - item.claimed_quantity);
  const allClaims = item.claims ?? [];

  return (
    <div
      className={`flex flex-col gap-3.5 rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        myPortions > 0
          ? "border-blue-500/80 bg-blue-50/30 ring-1 ring-blue-400/50 shadow-[0_4px_16px_rgba(37,99,235,0.06)]"
          : isFull
            ? "border-slate-200/60 bg-slate-50/60 opacity-85"
            : "border-slate-200/90 bg-white shadow-2xs hover:border-slate-300"
      }`}
    >
      {/* Top Row: Food Name & Pricing */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] sm:text-base font-bold text-slate-900 leading-snug">
            {item.name}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-mono font-bold text-slate-700 tabular-nums">
              {safeIDR(item.unit_price)}
            </span>
            <span className="text-slate-400 text-[11px]">/ porsi</span>
            <span className="text-slate-300">·</span>

            {item.is_shared ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/70">
                <UsersThree size={12} weight="bold" />
                <span>Makan Bareng</span>
              </span>
            ) : isFull ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/70">
                <CheckCircle size={12} weight="fill" />
                <span>Lengkap ({qty}/{qty})</span>
              </span>
            ) : item.claimed_quantity > 0 ? (
              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/70">
                Sisa {remainingQty} Porsi
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                Tersedia {qty} porsi
              </span>
            )}
          </div>
        </div>

        {/* Right: Total Price */}
        <div className="shrink-0 text-right">
          <span className="font-mono text-base sm:text-lg font-black text-slate-900 tabular-nums whitespace-nowrap">
            {safeIDR(totalItemPrice)}
          </span>
        </div>
      </div>

      {/* Middle Row: Active Claim Summary Banner */}
      {myPortions > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-blue-100/70 border border-blue-200 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
            <Check size={14} weight="bold" className="text-blue-600" />
            <span>
              Kamu ambil: {myPortions} porsi {item.is_shared && `(÷ ${totalClaimers} orang)`}
            </span>
          </div>
          <span className="font-mono text-xs font-black text-blue-800 tabular-nums">
            {safeIDR(mySharePrice)}
          </span>
        </div>
      )}

      {/* Bottom Row: Social Claimers (Left) + Thumb-Friendly Big Stepper (Right) */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        {/* Left: Who ordered this */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto text-[11px] no-scrollbar py-0.5">
          {allClaims.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">
                Dimakan oleh:
              </span>
              {allClaims.map((claim) => {
                const m = membersById.get(claim.member_id);
                const name = m?.display_name ?? "Tamu";
                const isThisMe = claim.member_id === currentMemberId;
                const isHost = m?.is_host ?? false;
                const initials = getInitials(name);

                return (
                  <span
                    key={claim.member_id}
                    title={`${name}${isHost ? " (Host)" : ""}`}
                    className={`inline-flex items-center gap-1.5 rounded-full pl-1 pr-2 py-0.5 text-[11px] font-semibold whitespace-nowrap border shadow-2xs transition-all ${
                      isThisMe
                        ? "border-blue-300 bg-blue-50 text-blue-900 font-bold"
                        : "border-slate-200/90 bg-white text-slate-700"
                    }`}
                  >
                    {/* User profile picture or fallback monogram initial */}
                    {m?.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt=""
                        className="h-4.5 w-4.5 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                      />
                    ) : (
                      <span
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold font-mono ${
                          isThisMe ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {initials}
                      </span>
                    )}

                    <span className="truncate max-w-[80px]">
                      {isThisMe ? "Kamu" : name}
                    </span>

                    {/* Host Badge */}
                    {isHost && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.2 text-[8px] font-black text-amber-800">
                        <Crown size={9} weight="fill" className="text-amber-600" />
                        Host
                      </span>
                    )}

                    {/* Quantity taken if more than 1 */}
                    {claim.portion_quantity > 1 && (
                      <span className="rounded-full bg-slate-100 px-1 font-mono text-[9px] font-extrabold text-slate-600">
                        {claim.portion_quantity}x
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">
              Belum ada yang memilih
            </span>
          )}
        </div>

        {/* Right: Big-Finger Friendly Stepper (min 44x44px touch targets) */}
        <div className="shrink-0">
          {!currentMemberId ? (
            <button
              type="button"
              onClick={onJoinPrompt}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition-all"
            >
              <Plus size={15} weight="bold" />
              <span>Gabung untuk Klaim</span>
            </button>
          ) : claimsLocked ? (
            <span className="inline-flex h-10 items-center rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-400">
              Terkunci
            </span>
          ) : myPortions > 0 ? (
            /* Active Stepper with 44px buttons */
            <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs">
              {/* Minus or Trash button (44x44px touch target) */}
              <button
                type="button"
                disabled={isPending}
                onClick={() => onUnclaim(item.id)}
                aria-label="Kurangi porsi"
                title={myPortions === 1 ? "Batalkan pilihan" : "Kurangi 1 porsi"}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all disabled:opacity-50"
              >
                {myPortions === 1 ? (
                  <Trash size={18} weight="bold" className="text-rose-600" />
                ) : (
                  <Minus size={18} weight="bold" />
                )}
              </button>

              {/* Portion counter with spring bump */}
              <span
                key={myPortions}
                className="font-mono text-sm font-black text-slate-900 px-2 min-w-8 text-center tabular-nums inline-block animate-number-bump"
              >
                {myPortions}
              </span>

              {/* Plus button (44x44px touch target) */}
              {!item.is_shared && (
                <button
                  type="button"
                  disabled={!canClaimMore || isPending}
                  onClick={() => onClaim(item.id)}
                  aria-label="Tambah 1 porsi"
                  title="Tambah 1 porsi lagi"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-90 transition-all disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed shadow-2xs"
                >
                  <Plus size={18} weight="bold" />
                </button>
              )}
            </div>
          ) : (
            /* Initial Claim Button (44px height, big touch target) */
            <button
              type="button"
              disabled={!canClaimMore || isPending}
              onClick={() => onClaim(item.id)}
              className={`inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-xs font-bold transition-all shadow-xs active:scale-95 disabled:cursor-not-allowed ${
                isFull
                  ? "bg-slate-100 text-slate-400 border border-slate-200"
                  : item.is_shared
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_2px_8px_rgba(79,70,229,0.25)]"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
              }`}
            >
              {isPending ? (
                <span>Menyimpan...</span>
              ) : isFull ? (
                <span>Habis</span>
              ) : (
                <>
                  <Plus size={15} weight="bold" />
                  <span>{item.is_shared ? "Ikut Patungan" : "Ambil"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
