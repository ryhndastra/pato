import { useState, useRef } from "react";
import {
  Bank,
  Camera,
  CircleNotch,
  DownloadSimple,
  Plus,
  QrCode,
  Receipt,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { compressImageFile } from "../../lib/imageCompression";
import { apiPost } from "../../lib/api";
import { ConfirmModal } from "../../components/ConfirmModal";
import type { RoomDetail } from "./types";

interface RoomMediaGalleryCardProps {
  room: RoomDetail;
  onPhotoUpdated?: () => void;
}

export function RoomMediaGalleryCard({
  room,
  onPhotoUpdated,
}: RoomMediaGalleryCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeModal, setActiveModal] = useState<"receipt" | "qris" | "group" | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);

  const hasReceipt = Boolean(room.receipt_image_url);
  const hasQris = Boolean(room.qris_image_url);
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
    <section className="flex flex-col gap-1.5">
      {uploadError && (
        <div className="rounded-xl bg-rose-50 p-2 text-xs font-semibold text-rose-700 border border-rose-100">
          {uploadError}
        </div>
      )}

      {/* Hidden file input */}
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

      {/* Minimalist Horizontal Quick Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {/* 1. Struk Kasir */}
        {hasReceipt && room.receipt_image_url ? (
          <button
            type="button"
            onClick={() => setActiveModal("receipt")}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 active:scale-95 transition-all"
          >
            <Receipt size={14} weight="bold" />
            <span>Lihat Struk</span>
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-white text-[8px] font-bold">✓</span>
          </button>
        ) : (
          <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/70 px-2.5 text-xs font-medium text-slate-400">
            <Receipt size={14} weight="regular" />
            <span>Tanpa Struk</span>
          </div>
        )}

        {/* 2. QRIS Host / Info Rekening */}
        {hasQris && room.qris_image_url ? (
          <button
            type="button"
            onClick={() => setActiveModal("qris")}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
          >
            <QrCode size={14} weight="bold" className="text-blue-600" />
            <span>QRIS Host</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveModal("qris")}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Bank size={14} weight="bold" className="text-slate-500" />
            <span>Rekening</span>
          </button>
        )}

        {/* 3. Foto Meja */}
        {isUploadingPhoto ? (
          <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-500">
            <CircleNotch size={14} weight="bold" className="animate-spin text-blue-600" />
            <span>Mengunggah...</span>
          </div>
        ) : hasGroupPhoto && room.group_photo_url ? (
          <button
            type="button"
            onClick={() => setActiveModal("group")}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 active:scale-95 transition-all"
          >
            <Camera size={14} weight="bold" className="text-emerald-600" />
            <span>Foto Meja</span>
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white text-[8px] font-bold">✓</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-600 hover:border-slate-400 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Plus size={13} weight="bold" />
            <span>Foto Meja</span>
          </button>
        )}
      </div>

      {/* Lightbox Modal: Struk Kasir */}
      {activeModal === "receipt" && room.receipt_image_url && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col items-center justify-center rounded-2xl bg-slate-900 p-3.5 shadow-2xl border border-slate-800 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between px-2 pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt size={18} weight="bold" className="text-blue-400" />
                <span className="text-xs font-bold sm:text-sm">Foto Struk Kasir Asli</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Tutup Preview"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="overflow-auto rounded-xl bg-black/50 p-1.5 max-h-[72vh] w-full flex items-center justify-center">
              <img
                src={room.receipt_image_url}
                alt="Struk Kasir Full"
                className="h-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal: QRIS Host */}
      {activeModal === "qris" && room.qris_image_url && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-sm flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <QrCode size={18} weight="bold" className="text-blue-600" />
                <span className="text-xs font-black sm:text-sm">QRIS Pembayaran Host</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                title="Tutup"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 w-full flex items-center justify-center">
              <img
                src={room.qris_image_url}
                alt="QRIS Full"
                className="h-auto max-h-[60vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="mt-3 flex w-full gap-2">
              <a
                href={room.qris_image_url}
                download={`QRIS_${room.room_code}.jpg`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-black active:scale-95 transition-all"
              >
                <DownloadSimple size={16} weight="bold" />
                <span>Simpan Gambar ke Galeri</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal: Foto Barengan */}
      {activeModal === "group" && room.group_photo_url && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-xl flex-col items-center justify-center rounded-2xl bg-slate-900 p-3.5 shadow-2xl border border-slate-800 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between px-2 pb-2.5">
              <div className="flex items-center gap-2">
                <Camera size={18} weight="bold" className="text-emerald-400" />
                <span className="text-xs font-bold sm:text-sm">Kenangan Makan Bareng</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Tutup Preview"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="overflow-auto rounded-xl bg-black/50 p-1.5 max-h-[72vh] w-full flex items-center justify-center">
              <img
                src={room.group_photo_url}
                alt="Foto Barengan Full"
                className="h-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>

            <div className="mt-3 flex w-full items-center justify-between px-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setShowDeletePhotoModal(true);
                }}
                className="inline-flex items-center gap-1 font-semibold text-rose-400 hover:text-rose-300"
              >
                <Trash size={14} weight="bold" />
                <span>Hapus Foto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1 font-bold text-white hover:text-slate-200"
              >
                <UploadSimple size={14} weight="bold" />
                <span>Ganti Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Photo Modal */}
      <ConfirmModal
        isOpen={showDeletePhotoModal}
        onClose={() => setShowDeletePhotoModal(false)}
        onConfirm={handleConfirmRemovePhoto}
        title="Hapus Foto Meja?"
        description="Foto meja ini akan dihapus dari room dan tidak bisa dikembalikan."
        confirmText="Hapus Foto"
        cancelText="Batal"
        isDestructive
        isLoading={isUploadingPhoto}
      />
    </section>
  );
}
