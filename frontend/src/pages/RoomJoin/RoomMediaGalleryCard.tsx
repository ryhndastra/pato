import { useState, useRef } from "react";
import {
  Camera,
  CircleNotch,
  DownloadSimple,
  Eye,
  Images,
  MagnifyingGlassPlus,
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
      setUploadError("Gagal mengunggah foto barengan. Coba pilih file foto lain.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveGroupPhoto() {
    const ok = window.confirm("Hapus foto barengan ini?");
    if (!ok) return;

    setIsUploadingPhoto(true);
    try {
      await apiPost(`/api/rooms/${encodeURIComponent(room.room_code)}/photo`, {
        group_photo_url: null,
      });
      onPhotoUpdated?.();
    } catch {
      setUploadError("Gagal menghapus foto barengan.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-4.5 shadow-2xs sm:p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
            <Images size={18} weight="bold" />
          </span>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 sm:text-sm">
              Media & Foto Meja
            </h2>
            <p className="text-[11px] text-slate-400">
              Foto struk belanja, QRIS pembayaran, dan foto kenangan nongkrong
            </p>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
          {(hasReceipt ? 1 : 0) + (hasQris ? 1 : 0) + (hasGroupPhoto ? 1 : 0)}/3 Foto
        </span>
      </div>

      {uploadError && (
        <div className="mt-2.5 rounded-xl bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 border border-rose-100">
          {uploadError}
        </div>
      )}

      {/* Grid of 3 Media Cards */}
      <div className="mt-3.5 grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* 1. Struk Kasir Card */}
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 text-center transition-all hover:border-slate-200">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <Receipt size={14} weight="bold" className="text-blue-600" />
            <span>Struk Kasir</span>
          </div>

          {hasReceipt && room.receipt_image_url ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal("receipt")}
              className="group relative mt-2 flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-black/5 shadow-2xs"
            >
              <img
                src={room.receipt_image_url}
                alt="Struk Kasir"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <MagnifyingGlassPlus size={18} weight="bold" className="text-white drop-shadow" />
                <span className="text-[9px] font-bold text-white drop-shadow">Lihat</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex h-24 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 p-1 text-center">
              <span className="text-[10px] font-semibold text-slate-400">
                Tidak ada struk
              </span>
            </div>
          )}

          {hasReceipt && (
            <button
              type="button"
              onClick={() => setActiveModal("receipt")}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
            >
              <Eye size={12} weight="bold" />
              <span>Perbesar</span>
            </button>
          )}
        </div>

        {/* 2. QRIS Host Card */}
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 text-center transition-all hover:border-slate-200">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <QrCode size={14} weight="bold" className="text-purple-600" />
            <span>QRIS Host</span>
          </div>

          {hasQris && room.qris_image_url ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal("qris")}
              className="group relative mt-2 flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-2xs border border-slate-200"
            >
              <img
                src={room.qris_image_url}
                alt="QRIS Host"
                className="h-full w-full object-contain transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <MagnifyingGlassPlus size={18} weight="bold" className="text-white drop-shadow" />
                <span className="text-[9px] font-bold text-white drop-shadow">Scan</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex h-24 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 p-1 text-center">
              <span className="text-[10px] font-semibold text-slate-400">
                Transfer Rekening
              </span>
            </div>
          )}

          {hasQris && (
            <button
              type="button"
              onClick={() => setActiveModal("qris")}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:underline"
            >
              <Eye size={12} weight="bold" />
              <span>Buka QRIS</span>
            </button>
          )}
        </div>

        {/* 3. Foto Barengan / Custom Memory Card */}
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 text-center transition-all hover:border-slate-200">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
            <Camera size={14} weight="bold" className="text-emerald-600" />
            <span>Foto Bareng</span>
          </div>

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

          {isUploadingPhoto ? (
            <div className="mt-2 flex h-24 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
              <CircleNotch size={20} weight="bold" className="animate-spin text-emerald-600" />
              <span className="mt-1 text-[9px] font-bold text-slate-500">Mengunggah...</span>
            </div>
          ) : hasGroupPhoto && room.group_photo_url ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveModal("group")}
              className="group relative mt-2 flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-black/5 shadow-2xs"
            >
              <img
                src={room.group_photo_url}
                alt="Foto Barengan"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <MagnifyingGlassPlus size={18} weight="bold" className="text-white drop-shadow" />
                <span className="text-[9px] font-bold text-white drop-shadow">Lihat</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group mt-2 flex h-24 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-2 text-center transition-all hover:bg-emerald-100/50 active:scale-95"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs group-hover:scale-110 transition-transform">
                <UploadSimple size={14} weight="bold" />
              </div>
              <span className="mt-1 text-[9px] font-black text-emerald-800">
                + Pasang Foto
              </span>
            </button>
          )}

          {hasGroupPhoto && !isUploadingPhoto && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveModal("group")}
                className="text-[10px] font-bold text-emerald-600 hover:underline"
              >
                Lihat
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-slate-600 hover:underline"
              >
                Ganti
              </button>
            </div>
          )}
        </div>
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
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col items-center justify-center rounded-3xl bg-slate-900/95 p-3.5 shadow-2xl border border-slate-800 text-white"
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

            <div className="overflow-auto rounded-2xl bg-black/50 p-1.5 max-h-[72vh] w-full flex items-center justify-center">
              <img
                src={room.receipt_image_url}
                alt="Struk Kasir Full"
                className="h-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
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
            className="relative flex max-h-[90vh] w-full max-w-sm flex-col items-center justify-center rounded-3xl bg-white p-4 shadow-2xl border border-slate-200 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <QrCode size={18} weight="bold" className="text-purple-600" />
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

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 w-full flex items-center justify-center">
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
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700"
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
            className="relative flex max-h-[90vh] w-full max-w-xl flex-col items-center justify-center rounded-3xl bg-slate-900/95 p-3.5 shadow-2xl border border-slate-800 text-white"
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

            <div className="overflow-auto rounded-2xl bg-black/50 p-1.5 max-h-[72vh] w-full flex items-center justify-center">
              <img
                src={room.group_photo_url}
                alt="Foto Barengan Full"
                className="h-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
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
                className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300"
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

