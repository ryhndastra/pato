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

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

function getAvatarColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
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
    <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <UsersThree size={14} weight="bold" />
          </span>
          <span className="text-xs font-bold text-slate-800">
            Peserta Meja
          </span>
          <span className="whitespace-nowrap shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
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
                <span>Reset Filter</span>
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
          const colorClass = getAvatarColor(member.display_name);
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
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all ${
                onSelectMember && !isSettlement ? "cursor-pointer active:scale-95" : ""
              } ${
                isSelected
                  ? "border-blue-600 bg-blue-600 text-white font-extrabold shadow-xs"
                  : isMe
                    ? "border-blue-200 bg-blue-50/70 text-slate-900 hover:bg-blue-100/60 font-bold"
                    : "border-slate-200/90 bg-slate-50/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                  isSelected ? "bg-white text-blue-600" : colorClass
                }`}
              >
                {initials}
              </span>

              <span className="truncate max-w-[110px]">
                {member.display_name}
              </span>

              {member.is_host && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    isSelected
                      ? "bg-amber-400 text-amber-950"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  <Crown size={10} weight="fill" className={isSelected ? "text-amber-950" : "text-amber-500"} />
                  Host
                </span>
              )}

              {isMe && !member.is_host && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    isSelected ? "bg-blue-500 text-white" : "bg-blue-100/80 text-blue-700"
                  }`}
                >
                  Kamu
                </span>
              )}

              {portionCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                    isSelected ? "bg-blue-700 text-white" : "bg-slate-200/90 text-slate-700"
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
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">
                      Talangan
                    </span>
                  ) : member.payment_status === "VERIFIED" ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                      <CheckCircle size={10} weight="fill" />
                      Lunas
                    </span>
                  ) : member.payment_status === "PENDING" ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">
                      <Clock size={10} weight="bold" />
                      Dicek
                    </span>
                  ) : member.payment_status === "REJECTED" ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.2 text-[9px] font-bold text-rose-700">
                      <WarningCircle size={10} weight="bold" />
                      Ditolak
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-500">
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
