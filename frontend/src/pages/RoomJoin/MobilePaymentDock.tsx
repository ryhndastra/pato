import {
  CheckCircle,
  Clock,
  CreditCard,
  LockSimple,
} from "@phosphor-icons/react";
import { safeIDR } from "./money";
import type { RoomMember, RoomStatus } from "./types";

interface MobilePaymentDockProps {
  me: RoomMember | null;
  roomStatus: RoomStatus;
  isHost?: boolean;
  activeTab?: "settlement" | "menu";
  verifiedFromFriends?: number;
  friendsTarget?: number;
  pendingCount?: number;
  onScrollToClaim?: () => void;
  onScrollToPayment?: () => void;
  onCloseRoom?: () => void;
  onJoinClick?: () => void;
  onLockClick?: () => void;
}

export function MobilePaymentDock({
  me,
  roomStatus,
  isHost,
  activeTab,
  verifiedFromFriends = 0,
  friendsTarget = 0,
  pendingCount = 0,
  onScrollToClaim,
  onScrollToPayment,
  onCloseRoom,
  onJoinClick,
  onLockClick,
}: MobilePaymentDockProps) {
  if (!me) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/70 bg-white/90 px-4 pt-3 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] shadow-[0_-8px_25px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden animate-sheet-up">
        <button
          type="button"
          onClick={onJoinClick}
          className="flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-xs font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.28)] active:scale-95 transition-all"
        >
          Gabung Meja untuk Mulai Klaim Makanan
        </button>
      </div>
    );
  }

  const isLocked = roomStatus === "LOCKED" || roomStatus === "CLOSED";
  const myPortionCount = me.claimed_item_ids?.length ?? 0;
  const allFriendsPaid = friendsTarget > 0 && verifiedFromFriends >= friendsTarget;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 pt-3 pb-[calc(max(env(safe-area-inset-bottom,0px),0px)+0.75rem)] shadow-[0_-8px_25px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden animate-sheet-up">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        {/* Left: Financial indicator */}
        <div className="flex flex-col min-w-0">
          {isHost && isLocked ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Terkumpul dari Teman
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-lg font-black text-emerald-600 tabular-nums whitespace-nowrap">
                  {safeIDR(verifiedFromFriends)}
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-400 tabular-nums whitespace-nowrap">
                  / {safeIDR(friendsTarget)}
                </span>
              </div>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bagian Kamu {myPortionCount > 0 ? `(${myPortionCount} Porsi)` : ""}
              </span>
              <span className="font-mono text-lg font-black text-slate-900 tabular-nums whitespace-nowrap">
                {safeIDR(me.share_amount)}
              </span>
            </>
          )}
        </div>

        {/* Right: Role-specific Native Action */}
        {isLocked ? (
          <div>
            {isHost ? (
              activeTab === "settlement" ? (
                roomStatus === "CLOSED" ? (
                  <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-xs font-black text-white shadow-xs">
                    <CheckCircle size={18} weight="fill" />
                    <span>Meja Selesai 100%</span>
                  </span>
                ) : allFriendsPaid && roomStatus === "LOCKED" ? (
                  <button
                    type="button"
                    onClick={onCloseRoom}
                    className="flex h-12 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(15,23,42,0.25)] hover:bg-black active:scale-95 transition-all"
                  >
                    <CheckCircle size={18} weight="fill" />
                    <span>Tutup Meja</span>
                  </button>
                ) : (
                  <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-50 px-4 text-xs font-bold text-emerald-700 border border-emerald-100 shadow-2xs">
                    <CheckCircle size={16} weight="fill" />
                    <span>{allFriendsPaid ? "Semua Lunas" : `${pendingCount} Menunggu`}</span>
                  </span>
                )
              ) : (
                <button
                  type="button"
                  onClick={onScrollToPayment}
                  className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.28)] hover:opacity-95 active:scale-95 transition-all"
                >
                  <CreditCard size={18} weight="bold" />
                  <span>Lihat Kas</span>
                </button>
              )
            ) : me.payment_status === "VERIFIED" ? (
              <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-50 px-5 text-xs font-bold text-emerald-700 border border-emerald-100 shadow-2xs">
                <CheckCircle size={18} weight="fill" />
                Lunas
              </span>
            ) : me.payment_status === "PENDING" ? (
              <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-amber-50 px-5 text-xs font-bold text-amber-700 border border-amber-100 shadow-2xs">
                <Clock size={18} weight="bold" />
                Dicek Host
              </span>
            ) : (
              <button
                type="button"
                onClick={onScrollToPayment}
                className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.28)] hover:opacity-95 active:scale-95 transition-all"
              >
                <CreditCard size={18} weight="bold" />
                <span>Bayar Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isHost ? (
              <button
                type="button"
                onClick={onLockClick || onScrollToClaim}
                className="flex h-12 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(15,23,42,0.25)] hover:bg-black active:scale-95 transition-all"
              >
                <LockSimple size={18} weight="bold" />
                <span>Kunci Meja</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onScrollToClaim}
                className="flex h-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-5 text-xs font-bold text-slate-800 shadow-2xs active:scale-95 transition-all"
              >
                {myPortionCount > 0 ? `${myPortionCount} Porsi Terpilih` : "Pilih Menu"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
