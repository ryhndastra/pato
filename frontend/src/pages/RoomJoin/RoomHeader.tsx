import {
  ArrowLeft,
  Camera,
  ChatCircleDots,
  Check,
  Copy,
  Receipt,
  ShareNetwork,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { StatusBadge } from "./StatusBadge";
import type { RoomDetail } from "./types";

interface RoomHeaderProps {
  room: RoomDetail;
  chatCount?: number;
  onOpenChat?: () => void;
  onOpenReceiptImage?: () => void;
  onOpenAestheticReceipt: () => void;
}

export function RoomHeader({
  room,
  chatCount = 0,
  onOpenChat,
  onOpenReceiptImage,
  onOpenAestheticReceipt,
}: RoomHeaderProps) {
  const navigate = useNavigate();
  const { copied: codeCopied, copy: copyCode } = useCopyToClipboard();
  const { copied: urlCopied, copy: copyUrl } = useCopyToClipboard();

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meja Patungan: ${room.title}`,
          text: `Klaim pesananmu di meja ${room.title} (Kode: ${room.room_code}) via PaTo!`,
          url,
        });
        return;
      } catch {
        // Fallback to copy URL
      }
    }
    copyUrl(url);
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-md sm:max-w-xl lg:max-w-3xl px-4 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-2.5 sm:px-6">
        {/* Top App Bar Navigation Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              aria-label="Kembali ke Dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-90 transition-all shadow-2xs"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight truncate">
                {room.title}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => copyCode(room.room_code)}
                  title="Salin kode meja"
                  className="group inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 border border-blue-200/70 hover:bg-blue-100 active:scale-95 transition-all"
                >
                  <span className="text-blue-500 font-semibold">KODE:</span>
                  <span>{room.room_code}</span>
                  {codeCopied ? (
                    <Check size={10} weight="bold" className="text-emerald-600 animate-check-pop" />
                  ) : (
                    <Copy size={10} weight="bold" className="text-blue-500 group-hover:text-blue-700 transition-colors" />
                  )}
                </button>
                <StatusBadge status={room.status} />
              </div>
            </div>
          </div>

          {/* Header Action Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Chat Icon Button with Unread Badge */}
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                aria-label="Buka Chat Meja"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-90 transition-all shadow-2xs"
              >
                <ChatCircleDots size={18} weight="bold" />
                {chatCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-black text-white ring-2 ring-white shadow-xs">
                    {chatCount > 99 ? "99+" : chatCount}
                  </span>
                )}
              </button>
            )}

            {/* Foto struk fisik asli (jika tersedia) */}
            {room.receipt_image_url && onOpenReceiptImage && (
              <button
                type="button"
                onClick={onOpenReceiptImage}
                title="Lihat foto fisik struk kasir"
                aria-label="Lihat Foto Struk Asli"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-90 transition-all shadow-2xs"
              >
                <Camera size={18} weight="bold" />
              </button>
            )}

            {/* Struk digital patungan PaTo */}
            <button
              type="button"
              onClick={onOpenAestheticReceipt}
              title="Lihat struk rincian patungan"
              aria-label="Lihat Struk Patungan"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-90 transition-all shadow-2xs"
            >
              <Receipt size={18} weight="bold" />
            </button>

            {/* Share link button */}
            <button
              type="button"
              onClick={handleShare}
              title="Bagikan tautan meja"
              aria-label="Bagikan Tautan Meja"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-90 transition-all shadow-2xs"
            >
              {urlCopied ? (
                <Check size={16} weight="bold" className="text-emerald-600 animate-check-pop" />
              ) : (
                <ShareNetwork size={17} weight="bold" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
