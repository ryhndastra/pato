import { useState, useRef } from "react";
import {
  Bank,
  Camera,
  CircleNotch,
  DownloadSimple,
  Eye,
  Images,
  Plus,
  QrCode,
  Receipt,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { compressImageFile } from "../../lib/imageCompression";
import { apiPost } from "../../lib/api";
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

  const hasReceipt = Boolean(room.receipt_image_url);
  const hasQris = Boolean(room.qris_image_url);
  const hasGroupPhoto = Boolean(room.group_photo_url);
  const mediaCount = (hasReceipt ? 1 : 0) + (hasQris ? 1 : 0) + (hasGroupPhoto ? 1 : 0);

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

  async function handleRemoveGroupPhoto() {
    const ok = window.confirm("Hapus foto meja ini?");
    if (!ok) return;

    setIsUploadingPhoto(true);
    try {
      await apiPost(`/api/rooms/${encodeURIComponent(room.room_code)}/photo`, {
        group_photo_url: null,
      });
      onPhotoUpdated?.();
    } catch {
      setUploadError("Gagal menghapus foto meja.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-2xs">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-1.5">
          <Images size={14} weight="bold" className="text-slate-500" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Media & Foto Meja
          </h2>
        </div>

        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
          {mediaCount}/3
        </span>
      </div>

      {uploadError && (
        <div className="mb-2 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700 border border-rose-100">
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

      {/* Minimalist 3-Column Strip */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. Struk Kasir */}
        {hasReceipt && room.receipt_image_url ? (
          <button
            type="button"
            onClick={() => setActiveModal("receipt")}
            className="group flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 text-center transition-all hover:bg-slate-100/70 hover:border-slate-300 active:scale-95 shadow-2xs"
          >
            <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-slate-200 shadow-2xs">
              <img
                src={room.receipt_image_url}
                alt="Struk Kasir"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Eye size={13} weight="bold" className="text-white drop-shadow" />
              </div>
            </div>
            <span className="mt-1 text-[11px] font-bold text-slate-800 truncate w-full">
              Struk Kasir
            </span>
            <span className="text-[10px] font-bold text-blue-600">Lihat Foto</span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Receipt size={14} weight="regular" />
            </span>
            <span className="mt-1 text-[11px] font-semibold text-slate-700 truncate w-full">
              Struk Kasir
            </span>
            <span className="text-[10px] text-slate-400">Tanpa Struk</span>
          </div>
        )}

        {/* 2. QRIS Host / Rekening */}
        {hasQris && room.qris_image_url ? (
          <button
            type="button"
            onClick={() => setActiveModal("qris")}
            className="group flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 text-center transition-all hover:bg-slate-100/70 hover:border-slate-300 active:scale-95 shadow-2xs"
          >
            <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white p-0.5 border border-slate-200 shadow-2xs">
              <img
                src={room.qris_image_url}
                alt="QRIS Host"
                className="h-full w-full object-contain transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Eye size={13} weight="bold" className="text-white drop-shadow" />
              </div>
            </div>
            <span className="mt-1 text-[11px] font-bold text-slate-800 truncate w-full">
              QRIS Host
            </span>
            <span className="text-[10px] font-bold text-blue-600">Scan QR</span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Bank size={14} weight="regular" />
            </span>
            <span className="mt-1 text-[11px] font-semibold text-slate-700 truncate w-full">
              Pembayaran
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Rekening</span>
          </div>
        )}

        {/* 3. Foto Barengan */}
        {isUploadingPhoto ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-center">
            <CircleNotch size={16} weight="bold" className="animate-spin text-slate-600" />
            <span className="mt-1 text-[10px] font-bold text-slate-500">Mengunggah...</span>
          </div>
        ) : hasGroupPhoto && room.group_photo_url ? (
          <button
            type="button"
            onClick={() => setActiveModal("group")}
            className="group flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 text-center transition-all hover:bg-slate-100/70 hover:border-slate-300 active:scale-95 shadow-2xs"
          >
            <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-slate-200 shadow-2xs">
              <img
                src={room.group_photo_url}
                alt="Foto Barengan"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Eye size={13} weight="bold" className="text-white drop-shadow" />
              </div>
            </div>
            <span className="mt-1 text-[11px] font-bold text-slate-800 truncate w-full">
              Foto Meja
            </span>
            <span className="text-[10px] font-bold text-blue-600">Lihat Foto</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-2 text-center transition-all hover:bg-slate-100 hover:border-slate-400 active:scale-95"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <Plus size={14} weight="bold" />
            </span>
            <span className="mt-1 text-[11px] font-bold text-slate-800 truncate w-full">
              Foto Meja
            </span>
            <span className="text-[10px] font-bold text-slate-500">+ Upload</span>
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
                  handleRemoveGroupPhoto();
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
    </section>
  );
}
