import { useState } from "react";
import {
  CalendarBlank,
  ArrowUpRight,
  Copy,
  CheckCircle,
  CircleNotch,
  Trash,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { apiDelete, ApiError } from "../../lib/api";
import { formatIDR } from "../../lib/format";
import { STATUS_STYLE, formatRoomDate, type MyRoom } from "./roomStatus";
import type { NudgeInitialData } from "./WhatsAppNudgeModal";

interface RoomCardProps {
  room: MyRoom;
  onOpenNudge: (data: NudgeInitialData) => void;
  onDeleted: (roomCode: string) => void;
}

export function RoomCard({ room, onOpenNudge, onDeleted }: RoomCardProps) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { copied, copy } = useCopyToClipboard();
  const status = STATUS_STYLE[room.status];
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}/room/${room.room_code}`;

  async function handleDelete() {
    const confirmed = window.confirm(
      `Hapus meja "${room.title}" (${room.room_code})? Semua klaim dan data pembayaran di dalamnya ikut terhapus permanen, tidak bisa dibalikin.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete(`/api/rooms/${room.room_code}`, undefined, token);
      onDeleted(room.room_code);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Gagal menghapus room.");
      setDeleting(false);
    }
  }

  return (
    <div className="group/card rounded-[1.75rem] bg-slate-200/50 p-1 ring-1 ring-black/5 transition-all duration-300 hover:bg-blue-100/70 hover:shadow-md sm:rounded-[2rem] sm:p-1.5">
      <div className="flex flex-col justify-between rounded-[calc(1.75rem-0.25rem)] bg-white p-4 shadow-xs transition-all duration-300 sm:rounded-[calc(2rem-0.375rem)] sm:p-5">
        <div>
          {/* Room code and status */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => copy(room.room_code)}
              title="Salin kode meja"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] font-bold text-ink transition-colors hover:bg-slate-200 sm:text-xs"
            >
              <span>{room.room_code}</span>
              {copied ? (
                <CheckCircle size={12} weight="fill" className="text-emerald-600" />
              ) : (
                <Copy size={12} weight="bold" className="text-ink-muted" />
              )}
            </button>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold sm:px-3 sm:py-1 sm:text-xs ${status.badgeClass}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${status.dotClass} ${
                  status.pulse ? "animate-pulse ring-2 ring-emerald-400/40" : ""
                }`}
              />
              <span>{status.label}</span>
            </span>
          </div>

          {/* Title and date */}
          <div className="mt-3 sm:mt-4">
            <h3 className="line-clamp-1 text-sm font-extrabold text-ink transition-colors group-hover/card:text-blue-700 sm:text-base">
              {room.title}
            </h3>

            <div className="mt-1 flex items-center justify-between text-[11px] text-ink-muted sm:text-xs">
              <span className="flex items-center gap-1">
                <CalendarBlank size={13} weight="regular" />
                <span>{formatRoomDate(room.created_at)}</span>
              </span>
              <span className="hidden font-medium sm:inline">{status.desc}</span>
            </div>
          </div>

          {/* Total amount */}
          <div className="mt-3 rounded-2xl bg-slate-50/80 p-2.5 ring-1 ring-black/5 sm:mt-4 sm:p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted sm:text-[10.5px]">
              Total Tagihan
            </span>
            <span className="font-mono text-lg font-extrabold text-ink sm:text-xl">
              {formatIDR(room.grand_total)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-hairline pt-3 sm:mt-5 sm:pt-4">
          <div className="flex items-center gap-1.5">
            {/* Nudge button */}
            <button
              type="button"
              onClick={() =>
                onOpenNudge({
                  roomCode: room.room_code,
                  roomTitle: room.title,
                  amount: room.grand_total,
                })
              }
              title="Tagih via WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 transition-all hover:bg-emerald-100 active:scale-95"
            >
              <WhatsappLogo size={16} weight="fill" />
            </button>

            {/* Share button */}
            <button
              type="button"
              onClick={() => copy(shareUrl)}
              title="Salin tautan room"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-ink-muted ring-1 ring-black/5 transition-all hover:bg-slate-200 hover:text-ink active:scale-95"
            >
              {copied ? (
                <CheckCircle size={15} weight="fill" className="text-emerald-600" />
              ) : (
                <Copy size={15} weight="bold" />
              )}
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Hapus meja"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-600/20 transition-all hover:bg-rose-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? (
                <CircleNotch size={15} weight="bold" className="animate-spin" />
              ) : (
                <Trash size={15} weight="bold" />
              )}
            </button>
          </div>

          {/* Open room button */}
          <button
            type="button"
            onClick={() => navigate(`/room/${room.room_code}`)}
            className="group/btn flex h-9 items-center gap-2 rounded-full bg-blue-600 px-3.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.98] sm:h-10 sm:px-4 sm:gap-2.5"
          >
            <span>Buka Meja</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 sm:h-6 sm:w-6">
              <ArrowUpRight size={12} weight="bold" />
            </span>
          </button>
        </div>

        {deleteError && (
          <p className="mt-2 text-[11px] font-semibold text-rose-600">{deleteError}</p>
        )}
      </div>
    </div>
  );
}
