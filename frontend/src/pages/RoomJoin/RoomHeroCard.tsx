import { useState, useRef } from "react";
import {
  Camera,
  CircleNotch,
  DownloadSimple,
  Plus,
  QrCode,
  Receipt,
  ShareNetwork,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { safeIDR } from "./money";
import { compressImageFile } from "../../lib/imageCompression";
import { apiPost } from "../../lib/api";
import { ConfirmModal } from "../../components/ConfirmModal";
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

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-4 text-white shadow-md border border-blue-400/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Total Tagihan Kasir & Count */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200/90 block">
              Total Kasir
            </span>
            <p className="font-mono text-2xl font-black text-white tabular-nums tracking-tight">
              {safeIDR(room.grand_total)}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-blue-100/80 font-medium">
              <span>{room.items?.length ?? 0} Menu</span>
              <span>·</span>
              <span>{members.length} Peserta</span>
              {Boolean(room.receipts && room.receipts.length > 1) && (
                <>
                  <span>·</span>
                  <span className="font-bold text-white bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                    {room.receipts!.length} Spot
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasReceipt && onOpenReceiptImage && (
              <button
                type="button"
                onClick={onOpenReceiptImage}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all shadow-2xs"
                title="Lihat Foto Struk Asli"
              >
                <Receipt size={14} weight="bold" />
                <span>Foto Struk</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenPaymentInfo}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all shadow-2xs"
              title="Rekening & QRIS"
            >
              <QrCode size={14} weight="bold" />
              <span>Rekening</span>
            </button>

            {/* Foto Makan Bareng */}
            {isUploadingPhoto ? (
              <div className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold text-white border border-white/20">
                <CircleNotch size={14} weight="bold" className="animate-spin text-white" />
              </div>
            ) : hasGroupPhoto && room.group_photo_url ? (
              <button
                type="button"
                onClick={() => setGroupPhotoModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all shadow-2xs"
                title="Lihat Foto Meja"
              >
                <Camera size={14} weight="bold" />
                <span>Foto Meja</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all shadow-2xs"
                title="Upload Foto Meja"
              >
                <Plus size={14} weight="bold" />
                <span>Foto Meja</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAestheticReceipt}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-bold text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all shadow-2xs"
              title="Ekspor Struk Digital"
            >
              <ShareNetwork size={14} weight="bold" />
              <span>Struk</span>
            </button>
          </div>
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

