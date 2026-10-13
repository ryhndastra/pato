import { useState } from "react";
import { MagnifyingGlassMinus, MagnifyingGlassPlus, X } from "@phosphor-icons/react";

interface ReceiptImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export function ReceiptImageModal({ imageUrl, onClose }: ReceiptImageModalProps) {
  const [zoom, setZoom] = useState(1);

  function handleZoomIn() {
    setZoom((z) => Math.min(z + 0.5, 3));
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(z - 0.5, 1));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Foto Struk Asli"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-shell shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink">Foto Struk Asli</h3>
            <span className="rounded-full bg-haze px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              aria-label="Perkecil zoom"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink hover:bg-haze disabled:opacity-40"
            >
              <MagnifyingGlassMinus size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              aria-label="Perbesar zoom"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink hover:bg-haze disabled:opacity-40"
            >
              <MagnifyingGlassPlus size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup foto struk"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-haze hover:text-ink"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-900/5 p-4">
          <img
            src={imageUrl}
            alt="Struk Pembayaran Asli"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain transition-transform duration-150"
          />
        </div>
      </div>
    </div>
  );
}

