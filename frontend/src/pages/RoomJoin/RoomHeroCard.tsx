import { useState, useRef } from "react";
import {
  Camera,
  Check,
  CircleNotch,
  Copy,
  DownloadSimple,
  ForkKnife,
  Plus,
  QrCode,
  Receipt,
  ShareNetwork,
  Trash,
  UploadSimple,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { safeIDR } from "./money";
import { StatusBadge } from "./StatusBadge";
import { compressImageFile } from "../../lib/imageCompression";
import { apiPost } from "../../lib/api";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import type { RoomDetail, RoomMember } from "./types";

interface RoomHeroCardProps {
  room: RoomDetail;
  members: RoomMember[];
  onOpenReceiptImage?: () => void;
  onOpenPaymentInfo: () => void;
  onOpenAestheticReceipt: () => void;
  onPhotoUpdated?: () => void;
}

export function RoomHeroCard({
  room,
  members,
  onOpenReceiptImage,
  onOpenPaymentInfo,
  onOpenAestheticReceipt,
  onPhotoUpdated,
}: RoomHeroCardProps) {
  const { copied, copy } = useCopyToClipboard();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [groupPhotoModalOpen, setGroupPhotoModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);

  const hasReceipt = Boolean(room.receipt_image_url);
  const hasGroupPhoto = Boolean(room.group_photo_url);

  async function handleGroupPhotoSelected(file: File) {
    setUploadError(null);
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImageFile(file, 1400, 1400, 0.85);
      await apiPost(`/api/rooms/${encodeURIComponent(room.room_code)}/photo`, {
        group_photo_url: compressed,
      });
      onPhotoUpdated?.();
    } catch (err) {
      console.error("[Upload Group Photo Error]", err);
      setUploadError("Gagal mengunggah foto meja.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleConfirmRemovePhoto() {
    setIsUploadingPhoto(true);
    try {
      await apiPost(`/api/rooms/${encodeURIComponent(room.room_code)}/photo`, {
        group_photo_url: null,
      });
      setShowDeletePhotoModal(false);
      onPhotoUpdated?.();
    } catch {
      setUploadError("Gagal menghapus foto meja.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <>
      {/* Hidden file input for uploading table photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleGroupPhotoSelected(file);
        }}
      />

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-5 text-white shadow-[0_12px_36px_rgba(37,99,235,0.22)] border border-blue-400/30">
        {/* Ambient background glow accents */}
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-indigo-400/25 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />

        {/* Top row: Live Pill + Room Code Copy Pill + Status Badge */}
        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-100 border border-white/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Meja Aktif</span>
            </span>

            <button
              type="button"
              onClick={() => copy(room.room_code)}
              title="Salin kode meja"
              className="group inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-2.5 py-1 font-mono text-[11px] font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all shadow-2xs"
            >
              <span className="text-blue-200">KODE:</span>
              <span className="tracking-wide">{room.room_code}</span>
              {copied ? (
                <Check size={11} weight="bold" className="text-emerald-300 animate-check-pop" />
              ) : (
                <Copy size={11} weight="bold" className="text-blue-200 group-hover:text-white transition-colors" />
              )}
            </button>
          </div>

          <StatusBadge status={room.status} />
        </div>

        {/* Middle: Room Title & Meta (Full width, never squished!) */}
        <div className="relative z-10 mt-3.5">
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug break-words drop-shadow-xs">
            {room.title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-blue-100/90 font-medium">
            <span className="inline-flex items-center gap-1">
              <ForkKnife size={13} weight="bold" />
              <span>{room.items?.length ?? 0} Menu</span>
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <UsersThree size={13} weight="bold" />
              <span>{members.length} Peserta</span>
            </span>
            {Boolean(room.receipts && room.receipts.length > 1) && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-bold text-white">
                  <Receipt size={12} weight="bold" />
                  <span>{room.receipts!.length} Spot Struk</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Dedicated Grand Total Kasir Strip (Full width, handles large millions cleanly) */}
        <div className="relative z-10 mt-3.5 flex items-center justify-between gap-3 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-3 border border-white/15 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 shrink-0">
            Total Kasir
          </span>
          <span className="font-mono text-lg sm:text-xl font-black text-white tabular-nums tracking-tight text-right whitespace-nowrap drop-shadow-xs">
            {safeIDR(room.grand_total)}
          </span>
        </div>

        {/* Bottom row: Quick action glass pills (Mobile-friendly touch height) */}
        <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {hasReceipt && onOpenReceiptImage && (
            <button
              type="button"
              onClick={onOpenReceiptImage}
              className="inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
            >
              <Receipt size={14} weight="bold" />
              <span>Foto Struk</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black">✓</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPaymentInfo}
            className="inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
          >
            <QrCode size={14} weight="bold" />
            <span>QRIS & Rekening</span>
          </button>

          {/* Foto Makan Bareng */}
          {isUploadingPhoto ? (
            <div className="inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 text-xs font-bold text-white border border-white/20">
              <CircleNotch size={14} weight="bold" className="animate-spin text-white" />
              <span>Mengunggah...</span>
            </div>
          ) : hasGroupPhoto && room.group_photo_url ? (
            <button
              type="button"
              onClick={() => setGroupPhotoModalOpen(true)}
              className="inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
            >
              <Camera size={14} weight="bold" />
              <span>Foto Meja</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black">✓</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
            >
              <Plus size={14} weight="bold" />
              <span>Foto Meja</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAestheticReceipt}
            className="inline-flex h-9.5 shrink-0 items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
          >
            <ShareNetwork size={14} weight="bold" />
            <span>Struk Patungan</span>
          </button>
        </div>

        {uploadError && (
          <p className="mt-2 text-xs font-semibold text-rose-200">
            {uploadError}
          </p>
        )}
      </div>

      {/* Lightbox Modal: Foto Barengan */}
      {groupPhotoModalOpen && room.group_photo_url && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
          onClick={() => setGroupPhotoModalOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-xl flex-col items-center justify-center rounded-3xl bg-slate-900 p-4 shadow-2xl border border-slate-800 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between px-2 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={18} weight="bold" className="text-emerald-400" />
                <span className="text-sm font-bold">Kenangan Makan Bareng</span>
              </div>
              <button
                type="button"
                onClick={() => setGroupPhotoModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Tutup Preview"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="overflow-auto rounded-2xl bg-black/50 p-2 max-h-[70vh] w-full flex items-center justify-center">
              <img
                src={room.group_photo_url}
                alt="Foto Barengan Full"
                className="h-auto max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>

            <div className="mt-3.5 flex w-full items-center justify-between px-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setGroupPhotoModalOpen(false);
                  setShowDeletePhotoModal(true);
                }}
                className="inline-flex items-center gap-1.5 font-semibold text-rose-400 hover:text-rose-300"
              >
                <Trash size={14} weight="bold" />
                <span>Hapus Foto</span>
              </button>

              <div className="flex items-center gap-3">
                <a
                  href={room.group_photo_url}
                  download={`Foto_Meja_${room.room_code}.jpg`}
                  className="inline-flex items-center gap-1.5 font-bold text-blue-400 hover:text-blue-300"
                >
                  <DownloadSimple size={14} weight="bold" />
                  <span>Unduh</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setGroupPhotoModalOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1.5 font-bold text-white hover:text-slate-200"
                >
                  <UploadSimple size={14} weight="bold" />
                  <span>Ganti Foto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeletePhotoModal}
        onClose={() => setShowDeletePhotoModal(false)}
        onConfirm={handleConfirmRemovePhoto}
        title="Hapus Foto Meja?"
        description="Foto kenangan meja ini akan dihapus untuk semua peserta."
        confirmText="Hapus Foto"
        cancelText="Batal"
        isDestructive
        isLoading={isUploadingPhoto}
      />
    </>
  );
}

