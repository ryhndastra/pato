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
import patoPlain from "../../assets/pato.png";

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
    <header className="sticky top-0 z-30 w-full overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-[0_4px_20px_rgba(29,78,216,0.18)]">
      {/* Ambient background glow decoration */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-indigo-400/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />

      <div className="relative z-10 mx-auto max-w-md sm:max-w-xl lg:max-w-3xl px-4 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-3 sm:px-6">
        {/* Top App Bar Navigation Row */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              aria-label="Kembali ke Dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition-all active:scale-90 hover:bg-white/20 shadow-2xs"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <img src={patoPlain} alt="PaTo" className="h-3.5 w-3.5 object-contain" />
                <span className="font-mono text-[10px] font-bold tracking-wider text-blue-200 uppercase">
                  PATO MEJA
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                {room.title}
              </h1>
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
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition-all active:scale-90 hover:bg-white/20 shadow-2xs"
              >
                <ChatCircleDots size={18} weight="bold" />
                {chatCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-black text-white ring-2 ring-blue-600 shadow-xs">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition-all active:scale-90 hover:bg-white/20 shadow-2xs"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition-all active:scale-90 hover:bg-white/20 shadow-2xs"
            >
              <Receipt size={18} weight="bold" />
            </button>

            {/* Share link button */}
            <button
              type="button"
              onClick={handleShare}
              title="Bagikan tautan meja"
              aria-label="Bagikan Tautan Meja"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition-all active:scale-90 hover:bg-white/20 shadow-2xs"
            >
              {urlCopied ? (
                <Check size={16} weight="bold" className="text-emerald-300" />
              ) : (
                <ShareNetwork size={17} weight="bold" />
              )}
            </button>
          </div>
        </div>

        {/* Micro Sub-Bar: Room Code pill + Status badge */}
        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => copyCode(room.room_code)}
            title="Salin kode meja"
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-[11px] font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 shadow-2xs"
          >
            <span className="text-blue-200">KODE:</span>
            <span className="tracking-wider">{room.room_code}</span>
            {codeCopied ? (
              <Check size={12} weight="bold" className="text-emerald-300" />
            ) : (
              <Copy size={12} weight="bold" className="text-blue-200 group-hover:text-white transition-colors" />
            )}
          </button>

          <StatusBadge status={room.status} />
        </div>
      </div>
    </header>
  );
}
