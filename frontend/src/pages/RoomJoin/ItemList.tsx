import { useMemo, useState } from "react";
import {
  Eye,
  ForkKnife,
  MagnifyingGlass,
  Plus,
  Receipt,
  Storefront,
  X,
} from "@phosphor-icons/react";
import type { RoomItem, RoomMember, RoomReceipt, RoomStatus } from "./types";
import { safeIDR } from "./money";
import { soundFX } from "../../lib/soundFx";
import { haptic } from "../../lib/haptic";
import { ItemCard } from "./ItemCard";

interface ItemListProps {
  items: RoomItem[];
  members: RoomMember[];
  receipts?: RoomReceipt[];
  currentMemberId: string | null;
  roomStatus: RoomStatus;
  pendingItemId: string | null;
  onClaim: (itemId: string) => void;
  onUnclaim: (itemId: string) => void;
  onJoinPrompt?: () => void;
  selectedMemberId?: string | null;
  onClearMemberFilter?: () => void;
  onAddReceipt?: () => void;
  onViewReceiptImage?: (url: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ItemList({
  items,
  members,
  receipts = [],
  currentMemberId,
  roomStatus,
  pendingItemId,
  onClaim,
  onUnclaim,
  onJoinPrompt,
  selectedMemberId,
  onClearMemberFilter,
  onAddReceipt,
  onViewReceiptImage,
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

  // Filter and search items
  const displayedItems = useMemo(() => {
    let result = items;

    if (selectedMemberId) {
      result = result.filter((item) => {
        return (
          item.claimed_by_member_ids?.includes(selectedMemberId) ||
          item.claims?.some((c) => c.member_id === selectedMemberId)
        );
      });
    } else {
      if (filterMode === "unclaimed") {
        result = result.filter((i) => !i.is_shared && i.claimed_quantity < i.quantity);
      } else if (filterMode === "shared") {
        result = result.filter((i) => i.is_shared);
      } else if (filterMode === "mine") {
        result = myClaimedItems;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }

    return result;
  }, [items, selectedMemberId, filterMode, myClaimedItems, searchQuery]);

  // Group items by Receipt / Spot
  const spotGroups = useMemo(() => {
    if (receipts && receipts.length > 0) {
      const groups = receipts.map((rc, idx) => ({
        spotIndex: idx + 1,
        receipt: rc,
        items: displayedItems.filter((i) => i.receipt_id === rc.id),
      }));

      const orphanItems = displayedItems.filter(
        (i) => !i.receipt_id || !receipts.some((rc) => rc.id === i.receipt_id)
      );
      if (orphanItems.length > 0) {
        groups.unshift({
          spotIndex: 1,
          receipt: {
            id: "primary",
            title: "Struk Utama",
            payer_member_id: null,
            payer_name: "Host",
            subtotal: orphanItems.reduce((s, it) => s + it.unit_price * (it.quantity || 1), 0),
            tax_amount: 0,
            service_amount: 0,
            discount_amount: 0,
            grand_total: orphanItems.reduce((s, it) => s + it.unit_price * (it.quantity || 1), 0),
            bank_name: null,
            bank_account_no: null,
            bank_account_name: null,
            qris_image_url: null,
            receipt_image_url: null,
            created_by_member_id: null,
            sort_order: 0,
            created_at: "",
          },
          items: orphanItems,
        });
      }

      return groups.filter((g) => g.items.length > 0);
    }

    return [
      {
        spotIndex: 1,
        receipt: null,
        items: displayedItems,
      },
    ];
  }, [receipts, displayedItems]);

  function handleClaimWithSound(itemId: string) {
    soundFX.playClaim();
    haptic.light();
    onClaim(itemId);
  }

  function handleUnclaimWithSound(itemId: string) {
    soundFX.playUnclaim();
    haptic.light();
    onUnclaim(itemId);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-2xs">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
          <ForkKnife size={28} weight="regular" />
        </span>
        <h3 className="text-base font-bold text-slate-900">Belum ada menu di meja ini</h3>
        <p className="max-w-[34ch] text-xs text-slate-500 leading-relaxed">
          Belum ada pesanan makanan atau minuman. Scan struk kasir atau input menu manual untuk mulai patungan.
        </p>

        {onAddReceipt && !claimsLocked && (
          <button
            type="button"
            onClick={onAddReceipt}
            className="mt-2 inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Struk Pertama</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. FILTER & SEARCH BAR */}
      {selectedMember ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-mono text-[10px] font-bold">
              {getInitials(selectedMember.display_name)}
            </span>
            <span className="font-bold text-blue-950 truncate">
              Pesanan {selectedMember.display_name} ({displayedItems.length} menu)
            </span>
          </div>

          <button
            type="button"
            onClick={onClearMemberFilter}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 active:scale-95 transition-all"
          >
            <X size={12} weight="bold" />
            <span>Semua Menu</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.length >= 3 && (
            <div className="relative flex items-center">
              <MagnifyingGlass
                size={16}
                weight="bold"
                className="absolute left-3.5 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari makanan / minuman..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    haptic.light();
                  }}
                  className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterMode("all");
                haptic.light();
              }}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 font-bold whitespace-nowrap transition-all active:scale-95 ${
                filterMode === "all"
                  ? "bg-slate-900 text-white shadow-xs"
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
                onClick={() => {
                  setFilterMode("unclaimed");
                  haptic.light();
                }}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 font-bold whitespace-nowrap transition-all active:scale-95 ${
                  filterMode === "unclaimed"
                    ? "bg-amber-500 text-white shadow-xs"
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
                onClick={() => {
                  setFilterMode("shared");
                  haptic.light();
                }}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 font-bold whitespace-nowrap transition-all active:scale-95 ${
                  filterMode === "shared"
                    ? "bg-indigo-600 text-white shadow-xs"
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
                onClick={() => {
                  setFilterMode("mine");
                  haptic.light();
                }}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 font-bold whitespace-nowrap transition-all active:scale-95 ${
                  filterMode === "mine"
                    ? "bg-blue-600 text-white shadow-xs"
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

            {onAddReceipt && !claimsLocked && (
              <button
                type="button"
                onClick={onAddReceipt}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-2xs active:scale-95 transition-all"
                title="Tambah Struk Tempat Baru"
              >
                <Plus size={14} weight="bold" />
                <span>Tambah Struk</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. PESANAN SAYA SUMMARY BANNER */}
      {filterMode === "mine" && myClaimedItems.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-200/80 bg-blue-50/70 p-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
              <Receipt size={18} weight="bold" />
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

      {/* 4. EMPTY FILTER STATE */}
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
                className="mt-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
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

      {/* 5. ITEM CARDS GROUPED BY SPOT / RECEIPT */}
      <div className="flex flex-col gap-6">
        {spotGroups.map((group) => {
          const rc = group.receipt;

          return (
            <div key={rc?.id || "default-spot"} className="flex flex-col gap-3">
              {/* Spot Header Banner */}
              {rc && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-4 py-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
                      <Storefront size={16} weight="bold" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {rc.title}
                        </h4>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60">
                          Nalangin: {rc.payer_name || "Host"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Subtotal spot: <span className="font-mono font-bold text-slate-700">{safeIDR(rc.subtotal)}</span>
                      </p>
                    </div>
                  </div>

                  {rc.receipt_image_url && onViewReceiptImage && (
                    <button
                      type="button"
                      onClick={() => onViewReceiptImage(rc.receipt_image_url!)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs active:scale-95 transition-all shrink-0"
                    >
                      <Eye size={13} weight="bold" />
                      <span>Foto Struk</span>
                    </button>
                  )}
                </div>
              )}

              {/* Items in this spot */}
              <div className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    membersById={membersById}
                    currentMemberId={currentMemberId}
                    claimsLocked={claimsLocked}
                    isPending={pendingItemId === item.id}
                    onClaim={handleClaimWithSound}
                    onUnclaim={handleUnclaimWithSound}
                    onJoinPrompt={onJoinPrompt}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Search / Filter Results */}
      {displayedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border border-dashed border-slate-200 bg-white/70 py-10 px-4 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <MagnifyingGlass size={20} weight="bold" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-800">
              {searchQuery ? `Tidak ada menu "${searchQuery}"` : "Tidak ada menu di kategori ini"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Coba ubah kata kunci atau ganti filter kategori di atas.
            </p>
          </div>
          {(searchQuery || filterMode !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterMode("all");
                haptic.light();
              }}
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all shadow-2xs"
            >
              <X size={12} weight="bold" />
              <span>Reset Filter & Pencarian</span>
            </button>
          )}
        </div>
      )}

      {/* 6. SUBTLE FOOTER CTA */}
      {onAddReceipt && !claimsLocked && (
        <div className="pt-2 pb-4 text-center">
          <button
            type="button"
            onClick={onAddReceipt}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-white/70 hover:bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-2xs transition-all active:scale-95"
          >
            <Plus size={14} weight="bold" />
            <span>Pindah spot nongkrong? Tambah Struk Baru</span>
          </button>
        </div>
      )}
    </div>
  );
}
