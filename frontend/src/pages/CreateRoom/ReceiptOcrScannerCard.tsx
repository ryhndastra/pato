import { useState, useRef } from "react";
import {
  Camera,
  CheckCircle,
  CircleNotch,
  Eye,
  MagnifyingGlassPlus,
  Receipt,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { compressImageFile } from "../../lib/imageCompression";
import { apiPost } from "../../lib/api";

interface OcrResult {
  title?: string;
  items: Array<{ name: string; unitPrice: number; quantity: number }>;
  taxAmount?: number;
  serviceAmount?: number;
}

interface ReceiptOcrScannerCardProps {
  receiptImageUrl: string | null;
  onReceiptImageChange: (url: string | null) => void;
  onOcrExtracted: (result: OcrResult) => void;
}

export function ReceiptOcrScannerCard({
  receiptImageUrl,
  onReceiptImageChange,
  onOcrExtracted,
}: ReceiptOcrScannerCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStep, setScanStep] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  async function handleFileSelected(file: File) {
    setError(null);
    setScanSuccess(false);
    setIsProcessing(true);
    setScanStep("Mengompresi foto struk kasir...");

    try {
      const compressedBase64 = await compressImageFile(file);
      onReceiptImageChange(compressedBase64);

      setScanStep("Pato AI (Gemini) sedang membaca baris struk...");
      const extracted = await apiPost<OcrResult>("/api/rooms/ocr", {
        image: compressedBase64,
      });

      if (!extracted || !Array.isArray(extracted.items) || extracted.items.length === 0) {
        throw new Error("AI tidak mendeteksi daftar item makanan dari struk ini. Pastikan foto jelas dan cukup cahaya.");
      }

      setScanStep("Finalisasi daftar menu & pajak...");
      onOcrExtracted(extracted);
      setScanSuccess(true);
    } catch (err) {
      console.error("[OCR Scan Error]", err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memproses struk kasir. Coba foto ulang yang lebih terang atau input manual.",
      );
    } finally {
      setIsProcessing(false);
      setScanStep(null);
    }
  }

  function handleRemove() {
    onReceiptImageChange(null);
    setScanSuccess(false);
    setError(null);
    setShowPreviewModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <section className="rounded-3xl border border-blue-200/80 bg-gradient-to-b from-blue-50/50 to-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center justify-between border-b border-blue-100/70 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xs">
            <Receipt size={18} weight="bold" />
          </span>
          <div>
            <h2 className="text-sm font-black text-slate-900 sm:text-base">
              Scan Foto Struk Kasir (AI OCR)
            </h2>
            <p className="text-[11px] text-slate-500">
              Upload struk agar AI mengisi otomatis daftar menu & pajak kasir
            </p>
          </div>
        </div>

        {receiptImageUrl && !isProcessing && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0"
          >
            <Trash size={13} weight="bold" />
            <span>Hapus Foto</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-100">
          {error}
        </div>
      )}

      {scanSuccess && (
        <div className="mt-3.5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
          <CheckCircle size={18} weight="fill" className="shrink-0 text-emerald-600" />
          <span>
            Berhasil mengekstrak menu dari struk! Periksa daftar menu di bawah dan kamu bisa tambah/edit manual jika ada yang kurang pas.
          </span>
        </div>
      )}

      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file);
          }}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/60 p-8 text-center">
            <CircleNotch size={32} weight="bold" className="animate-spin text-blue-600" />
            <div>
              <p className="text-xs font-black text-slate-900">{scanStep}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Proses ekstraksi otomatis biasanya memakan waktu 1–2 detik
              </p>
            </div>
          </div>
        ) : receiptImageUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
            {/* Clickable thumbnail to preview full photo */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setShowPreviewModal(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setShowPreviewModal(true);
              }}
              title="Klik untuk melihat foto struk penuh"
              className="group relative flex h-24 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-black/5 shadow-2xs transition-all hover:ring-2 hover:ring-blue-500"
            >
              <img
                src={receiptImageUrl}
                alt="Preview Struk Kasir"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                <MagnifyingGlassPlus size={20} weight="bold" className="text-white drop-shadow" />
                <span className="mt-0.5 text-[9px] font-bold text-white drop-shadow">Lihat Foto</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <CheckCircle size={12} weight="fill" />
                <span>Foto Struk Terlampir</span>
              </span>
              <p className="mt-1 text-xs font-bold text-slate-800">
                Struk ini akan ditampilkan transparan ke semua teman di room
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-600 hover:underline"
                >
                  <Eye size={13} weight="bold" />
                  <span>Lihat Foto Struk Penuh</span>
                </button>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <UploadSimple size={13} weight="bold" />
                  <span>Ganti Foto</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/30 active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Camera size={24} weight="bold" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">
                Ambil Foto atau Upload Struk Kasir
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Format JPG/PNG/WebP. AI akan otomatis membaca nama pesanan & nominal harga.
              </p>
            </div>

            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs group-hover:bg-blue-700"
            >
              <UploadSimple size={14} weight="bold" />
              <span>Pilih Foto Struk</span>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Full Receipt Photo Preview */}
      {showPreviewModal && receiptImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
          onClick={() => setShowPreviewModal(false)}
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
                onClick={() => setShowPreviewModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Tutup Preview"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="overflow-auto rounded-2xl bg-black/50 p-1.5 max-h-[72vh] w-full flex items-center justify-center">
              <img
                src={receiptImageUrl}
                alt="Struk Kasir Full"
                className="h-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>

            <div className="pt-2 text-center text-[11px] text-slate-400">
              Klik tanda silang atau area di luar foto untuk menutup
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
