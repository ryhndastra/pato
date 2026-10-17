import {
  CheckCircle,
  Clock,
  Crown,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type { RoomMember, RoomStatus } from "./types";

interface MemberListProps {
  members: RoomMember[];
  currentMemberId: string | null;
  roomStatus: RoomStatus;
  selectedMemberId?: string | null;
  onSelectMember?: (memberId: string | null) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function MemberList({
  members,
  currentMemberId,
  roomStatus,
  selectedMemberId,
  onSelectMember,
}: MemberListProps) {
  if (members.length === 0) return null;
  const isSettlement = roomStatus === "LOCKED" || roomStatus === "CLOSED";

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
      {/* Small participant count indicator */}
      <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-2xs">
        <UsersThree size={14} weight="bold" className="text-slate-500" />
        <span>{members.length}</span>
      </div>

      {selectedMemberId && onSelectMember && !isSettlement && (
        <button
          type="button"
          onClick={() => onSelectMember(null)}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-blue-600 px-3 text-[11px] font-bold text-white shadow-2xs hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>Semua</span>
          <X size={12} weight="bold" />
        </button>
      )}

      {/* Member Chips */}
      {members.map((member) => {
        const isMe = member.id === currentMemberId;
        const isSelected = selectedMemberId === member.id;
        const initials = getInitials(member.display_name);
        const portionCount = member.claimed_item_ids?.length ?? 0;

        const PillElement = onSelectMember && !isSettlement ? "button" : "div";

        return (
          <PillElement
            key={member.id}
            type={onSelectMember && !isSettlement ? "button" : undefined}
            onClick={
              onSelectMember && !isSettlement
                ? () => onSelectMember(isSelected ? null : member.id)
                : undefined
            }
            title={
              onSelectMember && !isSettlement
                ? isSelected
                ? "Hapus filter pesanan"
                : `Lihat menu ${member.display_name}`
                : undefined
            }
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition-all ${
              onSelectMember && !isSettlement ? "cursor-pointer active:scale-95" : ""
            } ${
              isSelected
                ? "border-slate-900 bg-slate-900 text-white font-extrabold shadow-xs"
                : isMe
                  ? "border-blue-200 bg-blue-50/70 text-slate-900 font-bold shadow-2xs"
                  : "border-slate-200/80 bg-white text-slate-700 font-medium hover:border-slate-300 shadow-2xs"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold ${
                isSelected
                  ? "bg-white/20 text-white"
                  : isMe
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {initials}
            </span>

            <span className="truncate max-w-[110px] text-[11px]">
              {member.display_name}
            </span>

            {member.is_host && (
              <Crown size={12} weight="fill" className="text-amber-500 shrink-0" />
            )}

            {isMe && !member.is_host && (
              <span
                className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                }`}
              >
                Kamu
              </span>
            )}

            {portionCount > 0 && !isSettlement && (
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[9px] font-bold tabular-nums ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {portionCount}
              </span>
            )}

            {isSelected && (
              <X size={11} weight="bold" className="text-white/80 shrink-0 ml-0.5" />
            )}

            {isSettlement && (
              <span className="ml-0.5">
                {member.is_host ? (
                  <span className="inline-flex items-center rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-700">
                    Talangan
                  </span>
                ) : member.payment_status === "VERIFIED" ? (
                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200/60">
                    <CheckCircle size={10} weight="fill" />
                    Lunas
                  </span>
                ) : member.payment_status === "PENDING" ? (
                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-200/60">
                    <Clock size={10} weight="bold" />
                    Dicek
                  </span>
                ) : member.payment_status === "REJECTED" ? (
                  <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.2 text-[9px] font-bold text-rose-700 border border-rose-200/60">
                    <WarningCircle size={10} weight="bold" />
                    Ditolak
                  </span>
                ) : (
                  <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-500">
                    Belum
                  </span>
                )}
              </span>
            )}
          </PillElement>
        );
      })}
    </div>
  );
}
