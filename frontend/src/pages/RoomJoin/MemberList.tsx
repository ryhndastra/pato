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
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-2xs">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <UsersThree size={14} weight="bold" className="text-slate-500 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Peserta Meja
          </span>
          <span className="whitespace-nowrap shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
            {members.length} orang
          </span>
        </div>

        {onSelectMember && !isSettlement && (
          <div className="min-w-0 text-right">
            {selectedMemberId ? (
              <button
                type="button"
                onClick={() => onSelectMember(null)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 active:scale-95"
              >
                <span>Hapus Filter</span>
                <X size={11} weight="bold" />
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 truncate block">
                Tap nama untuk filter
              </span>
            )}
          </div>
        )}
      </div>

      {/* Member Chips */}
      <div className="flex flex-wrap gap-1.5">
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
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-all ${
                onSelectMember && !isSettlement ? "cursor-pointer active:scale-95" : ""
              } ${
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white font-extrabold shadow-xs"
                  : isMe
                    ? "border-blue-200 bg-blue-50/60 text-slate-900 font-semibold hover:border-blue-300"
                    : "border-slate-200/80 bg-slate-50/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {initials}
              </span>

              <span className="truncate max-w-[110px]">
                {member.display_name}
              </span>

              {member.is_host && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-bold ${
                    isSelected
                      ? "bg-amber-400 text-amber-950"
                      : "bg-amber-50 text-amber-800 border border-amber-200/60"
                  }`}
                >
                  <Crown size={10} weight="fill" className={isSelected ? "text-amber-950" : "text-amber-500"} />
                  Host
                </span>
              )}

              {isMe && !member.is_host && (
                <span
                  className={`rounded px-1 py-0.2 text-[9px] font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  Kamu
                </span>
              )}

              {portionCount > 0 && (
                <span
                  className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold tabular-nums ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
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
    </div>
  );
}
