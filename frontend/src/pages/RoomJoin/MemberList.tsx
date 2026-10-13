import {
  CheckCircle,
  Clock,
  Crown,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import type { RoomMember, RoomStatus } from "./types";

interface MemberListProps {
  members: RoomMember[];
  currentMemberId: string | null;
  roomStatus: RoomStatus;
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
}: MemberListProps) {
  if (members.length === 0) return null;
  const isSettlement = roomStatus === "LOCKED" || roomStatus === "CLOSED";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <UsersThree size={14} weight="bold" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Peserta Meja
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
            {members.length} orang
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {members.map((member) => {
          const isMe = member.id === currentMemberId;
          const initials = getInitials(member.display_name);
          const colorClass = getAvatarColor(member.display_name);
          const portionCount = member.claimed_item_ids?.length ?? 0;

          return (
            <div
              key={member.id}
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-all ${
                isMe
                  ? "border-blue-200 bg-blue-50/70 text-ink ring-1 ring-blue-100"
                  : "border-slate-200/80 bg-slate-50/60 text-ink"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${colorClass}`}
              >
                {initials}
              </span>

              <span className="truncate max-w-[120px] font-bold text-ink">
                {member.display_name}
              </span>

              {member.is_host && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                  <Crown size={11} weight="fill" className="text-amber-500" />
                  Host
                </span>
              )}

              {isMe && !member.is_host && (
                <span className="rounded-full bg-blue-100/80 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">
                  Kamu
                </span>
              )}

              {portionCount > 0 && (
                <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 font-mono text-[10px] font-bold text-slate-700">
                  {portionCount}
                </span>
              )}

              {isSettlement && (
                <span className="ml-0.5">
                  {member.is_host ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
