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
  isLive?: boolean;
  onOpenChat?: () => void;
  onOpenReceiptImage?: () => void;
  onOpenAestheticReceipt: () => void;
}

export function RoomHeader({
  room,
  chatCount = 0,
  isLive = false,
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
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/70">
      <div className="mx-auto max-w-md sm:max-w-xl lg:max-w-3xl px-4 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-2.5 sm:px-6">
        {/* Main Navigation Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              aria-label="Kembali ke Dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-700 shadow-2xs transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft size={17} weight="bold" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <img src={patoPlain} alt="PaTo" className="h-3.5 w-3.5 object-contain" />
                <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  PATO MEJA
                </span>
                {isLive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                {room.title}
              </h1>
            </div>
          </div>

          {/* Action Icon Group */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Chat */}
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                aria-label="Buka Chat Meja"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-700 shadow-2xs transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900"
              >
                <ChatCircleDots size={18} weight="bold" />
                {chatCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 font-mono text-[9px] font-black text-white ring-2 ring-white shadow-2xs">
                    {chatCount > 99 ? "99+" : chatCount}
                  </span>
                )}
              </button>
            )}

            {/* Foto Struk Asli */}
            {room.receipt_image_url && onOpenReceiptImage && (
              <button
                type="button"
                onClick={onOpenReceiptImage}
                title="Lihat foto fisik struk kasir"
                aria-label="Lihat Foto Struk Asli"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-700 shadow-2xs transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900"
              >
                <Camera size={18} weight="bold" />
              </button>
            )}

            {/* Struk Patungan PaTo */}
            <button
              type="button"
              onClick={onOpenAestheticReceipt}
              title="Lihat struk rincian patungan"
              aria-label="Lihat Struk Patungan"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-700 shadow-2xs transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900"
            >
              <Receipt size={18} weight="bold" />
            </button>

            {/* Share Link */}
            <button
              type="button"
              onClick={handleShare}
              title="Bagikan tautan meja"
              aria-label="Bagikan Tautan Meja"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-700 shadow-2xs transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900"
            >
              {urlCopied ? (
                <Check size={16} weight="bold" className="text-emerald-600" />
              ) : (
                <ShareNetwork size={17} weight="bold" />
              )}
            </button>
          </div>
        </div>

        {/* Micro Sub-Bar: Clean Room Code Chip & Status Badge */}
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
          <button
            type="button"
            onClick={() => copyCode(room.room_code)}
            title="Salin kode meja"
            className="group flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-800 transition-all hover:bg-slate-100 hover:border-slate-300 active:scale-95 shadow-2xs"
          >
            <span className="text-slate-400">KODE:</span>
            <span>{room.room_code}</span>
            {codeCopied ? (
              <Check size={12} weight="bold" className="text-emerald-600" />
            ) : (
              <Copy size={12} weight="bold" className="text-slate-400 group-hover:text-slate-700 transition-colors" />
            )}
          </button>

          <StatusBadge status={room.status} />
        </div>
      </div>
    </header>
  );
}
