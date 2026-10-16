import { useMemo, useState } from "react";
import {
  CheckCircle,
  ForkKnife,
  MagnifyingGlass,
  Minus,
  Plus,
  Sparkle,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import type { RoomItem, RoomMember, RoomStatus } from "./types";
import { safeIDR } from "./money";
import { soundFX } from "../../lib/soundFx";

interface ItemListProps {
  items: RoomItem[];
  members: RoomMember[];
  currentMemberId: string | null;
  roomStatus: RoomStatus;
  pendingItemId: string | null;
  onClaim: (itemId: string) => void;
  onUnclaim: (itemId: string) => void;
  onJoinPrompt?: () => void;
  selectedMemberId?: string | null;
  onClearMemberFilter?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_BG_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-purple-100 text-purple-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-indigo-100 text-indigo-800",
];

function getAvatarColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_BG_COLORS[sum % AVATAR_BG_COLORS.length];
}

export function ItemList({
  items,
  members,
  currentMemberId,
  roomStatus,
  pendingItemId,
  onClaim,
  onUnclaim,
  onJoinPrompt,
  selectedMemberId,
  onClearMemberFilter,
}: ItemListProps) {
  const [tabFilter, setTabFilter] = useState<"all" | "mine">("all");
  const [subFilter, setSubFilter] = useState<"all" | "unclaimed" | "shared">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const claimsLocked = roomStatus === "LOCKED" || roomStatus === "CLOSED";
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const selectedMember = selectedMemberId ? membersById.get(selectedMemberId) : null;

  // Filter items claimed by current user
  const myClaimedItems = useMemo(() => {
    if (!currentMemberId) return [];
    return items.filter((item) => {
      const myClaim = item.claims?.find((c) => c.member_id === currentMemberId);
      const myPortions = myClaim
        ? Number(myClaim.portion_quantity)
        : item.claimed_by_member_ids?.includes(currentMemberId)
          ? 1
          : 0;
      return myPortions > 0;
    });
  }, [items, currentMemberId]);

  // Personal subtotal summary for the "Pesanan Saya" tab
  const mySummary = useMemo(() => {
    let totalPortions = 0;
    let totalSubtotal = 0;

    for (const item of myClaimedItems) {
      const myClaim = item.claims?.find((c) => c.member_id === currentMemberId);
      const portions = myClaim
        ? Number(myClaim.portion_quantity)
        : item.claimed_by_member_ids?.includes(currentMemberId!)
          ? 1
          : 0;

      totalPortions += portions;

      if (item.is_shared) {
        const totalClaimers = Math.max(1, item.claims?.length ?? item.claimed_by_member_ids?.length ?? 1);
        const totalItemPrice = item.unit_price * (item.quantity || 1);
        totalSubtotal += totalItemPrice / totalClaimers;
      } else {
        totalSubtotal += item.unit_price * portions;
      }
    }

    return { totalPortions, totalSubtotal: Math.round(totalSubtotal) };
  }, [myClaimedItems, currentMemberId]);

  // Counts for filter pills
  const unclaimedCount = useMemo(() => {
    return items.filter((i) => !i.is_shared && i.claimed_quantity < i.quantity).length;
  }, [items]);

  const sharedCount = useMemo(() => {
    return items.filter((i) => i.is_shared).length;
  }, [items]);

  // Filtered items based on active tab, friend selection, sub-filter, and search query
  const displayedItems = useMemo(() => {
    let result = items;

    // 1. Friend filter if tapped from MemberList
    if (selectedMemberId) {
      result = result.filter((item) => {
        const hasClaim = item.claims?.some((c) => c.member_id === selectedMemberId);
        const inList = item.claimed_by_member_ids?.includes(selectedMemberId);
        return hasClaim || inList;
      });
      return result;
    }

    // 2. Tab filter: All vs Mine
    if (tabFilter === "mine") {
      result = myClaimedItems;
    } else {
      // 3. Sub filter (only on "all" tab)
      if (subFilter === "unclaimed") {
        result = result.filter((i) => !i.is_shared && i.claimed_quantity < i.quantity);
      } else if (subFilter === "shared") {
        result = result.filter((i) => i.is_shared);
      }
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }

    return result;
  }, [items, selectedMemberId, tabFilter, myClaimedItems, subFilter, searchQuery]);

  function handleClaimWithSound(itemId: string) {
    soundFX.playClaim();
    onClaim(itemId);
  }

  function handleUnclaimWithSound(itemId: string) {
    soundFX.playUnclaim();
    onUnclaim(itemId);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-xs">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
          <ForkKnife size={26} weight="regular" />
        </span>
        <h3 className="text-sm font-black text-slate-900">Belum ada menu di meja ini</h3>
        <p className="max-w-[32ch] text-xs text-slate-500 leading-relaxed">
          Host belum menambahkan pesanan makanan atau minuman. Scan struk kasir atau input menu manual untuk mulai.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 1. FILTER & SEGMENTED CONTROL HEADER */}
      {selectedMember ? (
        /* Filtered by Friend Banner */
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-blue-200 bg-blue-50/90 px-3.5 py-2.5 text-xs shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${getAvatarColor(
                selectedMember.display_name,
              )}`}
            >
              {getInitials(selectedMember.display_name)}
            </span>
            <span className="font-bold text-blue-950">
              Pesanan <span className="underline decoration-blue-400">{selectedMember.display_name}</span> ({displayedItems.length} menu)
            </span>
          </div>

          <button
            type="button"
            onClick={onClearMemberFilter}
            className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700 shadow-2xs hover:bg-blue-100/70 active:scale-95"
          >
            <X size={12} weight="bold" />
            <span>Semua Menu</span>
          </button>
        </div>
      ) : (
        /* Native Segmented Control: Semua Menu vs Pesanan Saya */
        <div className="flex flex-col gap-2">
          {currentMemberId && (
            <div className="grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setTabFilter("all")}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-black transition-all ${
                  tabFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs scale-[0.99]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Semua Menu</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                    tabFilter === "all" ? "bg-slate-100 text-slate-800" : "bg-slate-300/60 text-slate-600"
                  }`}
                >
                  {items.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTabFilter("mine")}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-black transition-all ${
                  tabFilter === "mine"
                    ? "bg-blue-600 text-white shadow-xs scale-[0.99]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Pesanan Saya</span>
                {myClaimedItems.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                      tabFilter === "mine" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {myClaimedItems.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Search & Sub-filter pills (Shown when on "all" tab) */}
          {tabFilter === "all" && (
            <div className="flex flex-col gap-2">
              {/* Compact search input if items > 4 */}
              {items.length > 4 && (
                <div className="relative flex items-center">
                  <MagnifyingGlass
                    size={15}
                    weight="bold"
                    className="absolute left-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari menu makanan / minuman..."
                    className="h-9 w-full rounded-xl border border-slate-200/90 bg-white pl-8.5 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-700"
                    >
                      <X size={11} weight="bold" />
                    </button>
                  )}
                </div>
              )}

              {/* Sub-filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSubFilter("all")}
                  className={`shrink-0 rounded-full px-3 py-1 font-bold text-[11px] transition-all ${
                    subFilter === "all"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Semua ({items.length})
                </button>

                {unclaimedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSubFilter("unclaimed")}
                    className={`shrink-0 rounded-full px-3 py-1 font-bold text-[11px] transition-all ${
                      subFilter === "unclaimed"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100/60"
                    }`}
                  >
                    Belum Lengkap ({unclaimedCount})
                  </button>
                )}

                {sharedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSubFilter("shared")}
                    className={`shrink-0 rounded-full px-3 py-1 font-bold text-[11px] transition-all ${
                      subFilter === "shared"
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100/60"
                    }`}
                  >
                    Makan Bareng ({sharedCount})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PESANAN SAYA SUMMARY BANNER */}
      {tabFilter === "mine" && myClaimedItems.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
              <Sparkle size={18} weight="fill" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-blue-900 leading-tight">
                Ringkasan Pilihanmu
              </p>
              <p className="text-xs font-black text-slate-900">
                {mySummary.totalPortions} Porsi dari {myClaimedItems.length} Menu
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Subtotal Kamu
            </span>
            <p className="font-mono text-sm font-black text-blue-700">
              {safeIDR(mySummary.totalSubtotal)}
            </p>
          </div>
        </div>
      )}

      {/* 3. EMPTY STATE IN TAB OR SEARCH */}
      {displayedItems.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          {tabFilter === "mine" ? (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <ForkKnife size={20} weight="bold" />
              </span>
              <p className="text-xs font-black text-slate-900">Kamu belum memilih menu apa pun</p>
              <p className="max-w-[32ch] text-[11px] text-slate-500 leading-relaxed">
                Pilih porsi makanan atau minuman yang kamu makan di tab &quot;Semua Menu&quot;.
              </p>
              <button
                type="button"
                onClick={() => setTabFilter("all")}
                className="mt-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
              >
                Buka Semua Menu
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-slate-700">
                Tidak ada menu yang cocok dengan &quot;{searchQuery}&quot;
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSubFilter("all");
                }}
                className="mt-1 text-xs font-bold text-blue-600 hover:underline"
              >
                Reset Filter Pencarian
              </button>
            </>
          )}
        </div>
      )}

      {/* 4. LIST OF ITEM CARDS */}
      <div className="flex flex-col gap-2.5">
        {displayedItems.map((item) => {
          const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
          const totalItemPrice = item.unit_price * qty;

          const myClaim = item.claims?.find((c) => c.member_id === currentMemberId);
          const myPortions = myClaim
            ? Number(myClaim.portion_quantity)
            : currentMemberId && item.claimed_by_member_ids?.includes(currentMemberId)
              ? 1
              : 0;

          const totalClaimers = Math.max(1, item.claims?.length ?? item.claimed_by_member_ids?.length ?? 1);

          // Correct proportional calculation for shared dishes
          const mySharePrice = item.is_shared
            ? Math.round(totalItemPrice / totalClaimers)
            : item.unit_price * myPortions;

          const isFull = !item.is_shared && item.claimed_quantity >= qty;
          const canClaimMore = currentMemberId && !claimsLocked && (item.is_shared || !isFull);
          const isPending = pendingItemId === item.id;
          const remainingQty = Math.max(0, qty - item.claimed_quantity);

          return (
            <div
              key={item.id}
              className={`relative flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-150 ${
                myPortions > 0
                  ? "border-blue-400 bg-gradient-to-r from-blue-50/60 to-white ring-1 ring-blue-300 shadow-xs"
                  : isFull
                    ? "border-slate-200/70 bg-slate-50/70 opacity-95"
                    : "border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs"
              }`}
            >
              {/* Left visual accent indicator for items I claimed */}
              {myPortions > 0 && (
                <div className="absolute left-0 top-3 bottom-3 w-1.2 rounded-r-full bg-blue-600" />
              )}

              {/* Top Row: Food Name & Pricing Breakdown */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pl-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug break-words">
                    {item.name}
                  </h3>

                  {/* Badges: unit price, portion, availability */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-600">{safeIDR(item.unit_price)}</span>
                    <span className="text-slate-400">× {qty} porsi</span>
                    <span className="text-slate-300">·</span>

                    {item.is_shared ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-200/60">
                        <UsersThree size={12} weight="bold" />
                        <span>Makan Bareng (Bagi Rata)</span>
                      </span>
                    ) : isFull ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/60">
                        <CheckCircle size={12} weight="fill" />
                        <span>Lengkap ({qty}/{qty})</span>
                      </span>
                    ) : item.claimed_quantity > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200/60">
                        Sisa {remainingQty} Porsi
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        Tersedia {qty} Porsi
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Total Price & My Share */}
                <div className="shrink-0 text-right">
                  <span className="font-mono text-sm sm:text-base font-black text-slate-900">
                    {safeIDR(totalItemPrice)}
                  </span>
                  {myPortions > 0 && (
                    <div className="mt-0.5">
                      <span className="font-mono text-xs font-black text-blue-700 block">
                        Bagianmu: {safeIDR(mySharePrice)}
                      </span>
                      {item.is_shared && totalClaimers > 1 && (
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          (÷ {totalClaimers} orang)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Who Claimed + Touch-Friendly Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100/90 pt-3 pl-1">
                {/* Claimer Friends Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] min-h-8">
                  {item.claims && item.claims.length > 0 ? (
                    item.claims.map((claim) => {
                      const m = membersById.get(claim.member_id);
                      const name = m?.display_name ?? "Tamu";
                      const isThisMe = claim.member_id === currentMemberId;
                      const portionText = claim.portion_quantity > 1 ? ` (${claim.portion_quantity}x)` : "";

                      return (
                        <span
                          key={claim.member_id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.8 text-[11px] font-bold transition-all ${
                            isThisMe
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-700 border border-slate-200/60"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black ${
                              isThisMe ? "bg-white text-blue-700" : "bg-slate-300 text-slate-800"
                            }`}
                          >
                            {getInitials(name)}
                          </span>
                          <span>
                            {isThisMe ? "Kamu" : name}
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
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.8 text-[11px] font-bold ${
                            isThisMe
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-700 border border-slate-200/60"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black ${
                              isThisMe ? "bg-white text-blue-700" : "bg-slate-300 text-slate-800"
                            }`}
                          >
                            {getInitials(name)}
                          </span>
                          <span>{isThisMe ? "Kamu" : name}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Belum ada yang memilih
                    </span>
                  )}
                </div>

                {/* Touch-Friendly Action Area (Min 40-44px touch targets!) */}
                <div className="shrink-0 ml-auto">
                  {!currentMemberId ? (
                    /* Guest hasn't joined yet prompt */
                    <button
                      type="button"
                      onClick={onJoinPrompt}
                      className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 text-xs font-bold text-blue-700 hover:bg-blue-100 active:scale-95 transition-all shadow-2xs"
                    >
                      <Plus size={14} weight="bold" />
                      <span>Gabung untuk Klaim</span>
                    </button>
                  ) : claimsLocked ? (
                    /* Claims are locked */
                    <span className="inline-flex h-8 items-center rounded-lg bg-slate-100 px-2.5 text-xs font-bold text-slate-500">
                      Klaim Dikunci
                    </span>
                  ) : myPortions > 0 ? (
                    /* Already claimed: Stepper or Unclaim */
                    item.quantity > 1 && !item.is_shared ? (
                      /* Multi-portion stepper */
                      <div className="inline-flex items-center gap-1 rounded-2xl border border-blue-300 bg-white p-1 shadow-2xs">
                        {/* Minus button */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleUnclaimWithSound(item.id)}
                          aria-label={myPortions > 1 ? "Kurangi 1 porsi" : "Batalkan pilihan"}
                          title={myPortions > 1 ? "Kurangi 1 porsi" : "Batalkan pilihan"}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-90 disabled:opacity-50"
                        >
                          <Minus size={15} weight="bold" />
                        </button>

                        {/* Portion text */}
                        <div className="flex flex-col items-center px-2">
                          <span className="font-mono text-xs font-black text-blue-700 leading-none">
                            {myPortions} Porsi
                          </span>
                          <span className="text-[9px] font-bold text-blue-500 leading-none mt-0.5">
                            Pilihanmu
                          </span>
                        </div>

                        {/* Plus button */}
                        <button
                          type="button"
                          disabled={!canClaimMore || isPending}
                          onClick={() => handleClaimWithSound(item.id)}
                          aria-label="Tambah 1 porsi lagi"
                          title="Tambah 1 porsi lagi"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 active:scale-90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          <Plus size={15} weight="bold" />
                        </button>
                      </div>
                    ) : (
                      /* Single portion or shared: Toggle button with checkmark & unclaim */
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleUnclaimWithSound(item.id)}
                          className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-50 active:scale-95 transition-all"
                        >
                          <X size={14} weight="bold" />
                          <span>Batalkan</span>
                        </button>
                      </div>
                    )
                  ) : (
                    /* Not claimed yet: Claim Button */
                    <button
                      type="button"
                      disabled={!canClaimMore || isPending}
                      onClick={() => handleClaimWithSound(item.id)}
                      className={`inline-flex h-9.5 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all shadow-xs active:scale-95 disabled:cursor-not-allowed ${
                        isFull
                          ? "bg-slate-100 text-slate-400 border border-slate-200"
                          : item.is_shared
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isPending ? (
                        <span>Menyimpan...</span>
                      ) : isFull ? (
                        <span>Porsi Habis</span>
                      ) : item.is_shared ? (
                        <>
                          <UsersThree size={15} weight="bold" />
                          <span>Ikut Makan Bareng</span>
                        </>
                      ) : (
                        <>
                          <Plus size={15} weight="bold" />
                          <span>Klaim Porsi</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
