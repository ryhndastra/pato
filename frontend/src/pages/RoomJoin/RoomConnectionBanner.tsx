import { ArrowsClockwise, CheckCircle } from "@phosphor-icons/react";

interface RoomConnectionBannerProps {
  isReconnecting: boolean;
  justReconnected: boolean;
}

export function RoomConnectionBanner({
  isReconnecting,
  justReconnected,
}: RoomConnectionBannerProps) {
  if (!isReconnecting && !justReconnected) return null;

  return (
    <>
      {isReconnecting && (
        <div className="sticky top-[53px] z-20 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-300">
          <ArrowsClockwise size={14} weight="bold" className="animate-spin shrink-0" />
          <span>Koneksi terputus. Mencoba menghubungkan kembali...</span>
        </div>
      )}

      {justReconnected && (
        <div className="sticky top-[53px] z-20 flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-300">
          <CheckCircle size={14} weight="fill" className="shrink-0" />
          <span>Terhubung kembali ke meja!</span>
        </div>
      )}
    </>
  );
}
