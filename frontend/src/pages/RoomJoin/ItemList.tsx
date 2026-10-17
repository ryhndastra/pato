import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle,
  ForkKnife,
  MagnifyingGlass,
  Minus,
  Plus,
  Receipt,
  Trash,
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
  const [filterMode, setFilterMode] = useState<"all" | "unclaimed" | "shared" | "mine">("all");
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

  // Filtered items based on active filter, friend selection, and search query
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

    // 2. Filter mode
    if (filterMode === "mine") {
      result = myClaimedItems;
    } else if (filterMode === "unclaimed") {
      result = result.filter((i) => !i.is_shared && i.claimed_quantity < i.quantity);
    } else if (filterMode === "shared") {
      result = result.filter((i) => i.is_shared);
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }

    return result;
  }, [items, selectedMemberId, filterMode, myClaimedItems, searchQuery]);

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
      <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-2xs">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
          <ForkKnife size={24} weight="regular" />
        </span>
        <h3 className="text-sm font-bold text-slate-900">Belum ada menu di meja ini</h3>
        <p className="max-w-[32ch] text-xs text-slate-500 leading-relaxed">
          Host belum menambahkan pesanan makanan atau minuman. Scan struk kasir atau input menu manual untuk mulai.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 1. FILTER & SEGMENTED TABS */}
      {selectedMember ? (
        /* Filtered by Friend Banner */
        <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white font-mono text-[9px] font-bold">
              {getInitials(selectedMember.display_name)}
            </span>
            <span className="font-bold text-blue-950 truncate">
              Pesanan {selectedMember.display_name} ({displayedItems.length} menu)
            </span>
          </div>

          <button
            type="button"
            onClick={onClearMemberFilter}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700 shadow-2xs hover:bg-blue-100 active:scale-95"
          >
            <X size={11} weight="bold" />
            <span>Semua Menu</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.length > 5 && (
            <div className="relative flex items-center">
              <MagnifyingGlass
                size={14}
                weight="bold"
                className="absolute left-3 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari makanan / minuman..."
                className="h-8.5 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-100 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X size={11} weight="bold" />
                </button>
              )}
            </div>
          )}

          {/* Native Mobile Horizontal Pill Filter Carousel (No 2-line wrapping) */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-bold whitespace-nowrap transition-all active:scale-95 ${
                filterMode === "all"
                  ? "bg-slate-900 text-white shadow-xs font-extrabold"
                  : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 shadow-2xs"
              }`}
            >
              <span>Semua</span>
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  filterMode === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {items.length}
              </span>
            </button>

            {unclaimedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode("unclaimed")}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-bold whitespace-nowrap transition-all active:scale-95 ${
                  filterMode === "unclaimed"
                    ? "bg-amber-500 text-white shadow-xs font-extrabold"
                    : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                <span>Belum Lengkap</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    filterMode === "unclaimed" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {unclaimedCount}
                </span>
              </button>
            )}

            {sharedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode("shared")}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-bold whitespace-nowrap transition-all active:scale-95 ${
                  filterMode === "shared"
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                    : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                <span>Makan Bareng</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    filterMode === "shared" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"
                  }`}
                >
                  {sharedCount}
                </span>
              </button>
            )}

            {currentMemberId && (
              <button
                type="button"
                onClick={() => setFilterMode("mine")}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-bold whitespace-nowrap transition-all active:scale-95 ${
                  filterMode === "mine"
                    ? "bg-blue-600 text-white shadow-xs font-extrabold"
                    : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                <span>Pesanan Saya</span>
                {myClaimedItems.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                      filterMode === "mine" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {myClaimedItems.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. PESANAN SAYA SUMMARY BANNER */}
      {filterMode === "mine" && myClaimedItems.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
              <Receipt size={16} weight="bold" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Total Pilihanmu
              </p>
              <p className="text-xs font-black text-slate-900">
                {mySummary.totalPortions} Porsi ({myClaimedItems.length} Menu)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Subtotal</span>
            <p className="font-mono text-sm font-black text-blue-700 tabular-nums">
              {safeIDR(mySummary.totalSubtotal)}
            </p>
          </div>
        </div>
      )}

      {/* 3. EMPTY STATE */}
      {displayedItems.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-2xs">
          {filterMode === "mine" ? (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <ForkKnife size={18} weight="bold" />
              </span>
              <p className="text-xs font-bold text-slate-800">Kamu belum memilih menu apa pun</p>
              <p className="max-w-[28ch] text-[11px] text-slate-500">
                Pilih menu yang kamu makan pada filter &quot;Semua&quot;.
              </p>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="mt-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
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
                  setFilterMode("all");
                }}
                className="mt-1 text-xs font-bold text-blue-600 hover:underline"
              >
                Reset Filter Pencarian
              </button>
            </>
          )}
        </div>
      )}

      {/* 4. MODERN MOBILE ITEM CARDS (GoFood / GrabFood Ergonomics) */}
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

          // Friends who claimed (excluding "me" if needed, or including all with clear tags)
          const allClaims = item.claims ?? [];

          return (
            <div
              key={item.id}
              className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                myPortions > 0
                  ? "border-blue-500/80 bg-blue-50/25 ring-1 ring-blue-400/50 shadow-[0_4px_16px_rgba(37,99,235,0.06)]"
                  : isFull
                    ? "border-slate-200/60 bg-slate-50/60 opacity-85"
                    : "border-slate-200/80 bg-white shadow-2xs hover:border-slate-300"
              }`}
            >
              {/* Top Row: Food Name & Pricing */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-bold text-slate-900 leading-snug">
                    {item.name}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-mono font-bold text-slate-600 tabular-nums">
                      {safeIDR(item.unit_price)}
                    </span>
                    <span className="text-slate-400 text-[11px]">/ porsi</span>
                    <span className="text-slate-300">·</span>

                    {item.is_shared ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/70">
                        <UsersThree size={11} weight="bold" />
                        <span>Makan Bareng</span>
                      </span>
                    ) : isFull ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/70">
                        <CheckCircle size={11} weight="fill" />
                        <span>Lengkap ({qty}/{qty})</span>
                      </span>
                    ) : item.claimed_quantity > 0 ? (
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/70">
                        Sisa {remainingQty} Porsi
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        Tersedia {qty} porsi
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Total Price */}
                <div className="shrink-0 text-right">
                  <span className="font-mono text-base font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                    {safeIDR(totalItemPrice)}
                  </span>
                </div>
              </div>

              {/* Middle Row: My Active Claim Summary Banner */}
              {myPortions > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-blue-50/90 border border-blue-200/60 px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                    <Check size={13} weight="bold" className="text-blue-600" />
                    <span>
                      Kamu ambil: {myPortions} porsi {item.is_shared && `(÷ ${totalClaimers} orang)`}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-black text-blue-800 tabular-nums">
                    {safeIDR(mySharePrice)}
                  </span>
                </div>
              )}

              {/* Bottom Row: Social Claimers (Left) + Thumb Stepper (Right) */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-100/80 pt-3">
                {/* Left: Who ordered this */}
                <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto text-[11px] no-scrollbar">
                  {allClaims.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                        Dipesan:
                      </span>
                      {allClaims.map((claim) => {
                        const m = membersById.get(claim.member_id);
                        const name = m?.display_name ?? "Tamu";
                        const isThisMe = claim.member_id === currentMemberId;
                        const countText = claim.portion_quantity > 1 ? ` (${claim.portion_quantity})` : "";

                        return (
                          <span
                            key={claim.member_id}
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                              isThisMe
                                ? "bg-blue-100 text-blue-800 font-bold"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <span>{isThisMe ? "Kamu" : name}{countText}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Belum ada yang memilih
                    </span>
                  )}
                </div>

                {/* Right: Universal Thumb-Friendly Mobile Stepper (GoFood-style) */}
                <div className="shrink-0">
                  {!currentMemberId ? (
                    <button
                      type="button"
                      onClick={onJoinPrompt}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-3.5 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition-all"
                    >
                      <Plus size={13} weight="bold" />
                      <span>Gabung untuk Klaim</span>
                    </button>
                  ) : claimsLocked ? (
                    <span className="inline-flex h-8 items-center rounded-lg bg-slate-100 px-2.5 text-[11px] font-bold text-slate-400">
                      Terkunci
                    </span>
                  ) : myPortions > 0 ? (
                    /* Active Stepper */
                    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white p-0.5 shadow-2xs">
                      {/* Minus or Trash button */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUnclaimWithSound(item.id)}
                        aria-label="Kurangi porsi"
                        title={myPortions === 1 ? "Batalkan pilihan" : "Kurangi 1 porsi"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all disabled:opacity-50"
                      >
                        {myPortions === 1 ? (
                          <Trash size={14} weight="bold" className="text-rose-600" />
                        ) : (
                          <Minus size={14} weight="bold" />
                        )}
                      </button>

                      {/* Portion counter */}
                      <span className="font-mono text-xs font-black text-slate-900 px-2 min-w-6 text-center tabular-nums">
                        {myPortions}
                      </span>

                      {/* Plus button (only if not full or shared) */}
                      {!item.is_shared && (
                        <button
                          type="button"
                          disabled={!canClaimMore || isPending}
                          onClick={() => handleClaimWithSound(item.id)}
                          aria-label="Tambah 1 porsi"
                          title="Tambah 1 porsi lagi"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-90 transition-all disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed shadow-2xs"
                        >
                          <Plus size={14} weight="bold" />
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Initial Claim Button */
                    <button
                      type="button"
                      disabled={!canClaimMore || isPending}
                      onClick={() => handleClaimWithSound(item.id)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all shadow-xs active:scale-95 disabled:cursor-not-allowed ${
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
                          <Plus size={13} weight="bold" />
                          <span>{item.is_shared ? "Ikut Patungan" : "Ambil"}</span>
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
