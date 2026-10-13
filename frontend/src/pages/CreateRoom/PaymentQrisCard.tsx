import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import {
  Bank,
  CreditCard,
  MagnifyingGlassPlus,
  QrCode,
  SpinnerGap,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { digitsOnly } from "../../lib/format";

interface PaymentQrisCardProps {
  bankName: string;
  setBankName: (value: string) => void;
  bankAccountNo: string;
  setBankAccountNo: (value: string) => void;
  bankAccountName: string;
  setBankAccountName: (value: string) => void;
  qrisImageUrl: string | null;
  isProcessingQris: boolean;
  qrisError: string | null;
  onQrisFile: (file: File) => void;
  onRemoveQris: () => void;
}

const BANK_PRESETS = [
  { id: "bca", name: "BCA" },
  { id: "mandiri", name: "Mandiri" },
  { id: "bri", name: "BRI" },
  { id: "bni", name: "BNI" },
  { id: "gopay", name: "GoPay" },
  { id: "ovo", name: "OVO" },
  { id: "dana", name: "DANA" },
  { id: "seabank", name: "SeaBank" },
  { id: "jago", name: "Bank Jago" },
];

export function PaymentQrisCard({
  bankName,
  setBankName,
  bankAccountNo,
  setBankAccountNo,
  bankAccountName,
  setBankAccountName,
  qrisImageUrl,
  isProcessingQris,
  qrisError,
  onQrisFile,
  onRemoveQris,
}: PaymentQrisCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onQrisFile(file);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onQrisFile(file);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_32px_rgba(37,99,235,0.06)] sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 aspect-square items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <QrCode size={22} weight="bold" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Metode Pembayaran & QRIS
          </h2>
          <p className="text-xs text-slate-500">
            Upload foto QRIS atau cantumkan nomor rekening untuk kemudahan transfer teman
          </p>
        </div>
      </div>

      {/* QRIS Upload Dropzone */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-bold text-slate-700">
          Foto QRIS
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {qrisImageUrl ? (
          /* Preview state when image is uploaded */
          <div className="overflow-hidden rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 transition-all">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="relative group shrink-0 aspect-square">
                <img
                  src={qrisImageUrl}
                  alt="QRIS Preview"
                  className="h-32 w-32 rounded-xl border border-slate-200 bg-white object-contain p-2 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowZoomModal(true)}
                  aria-label="Perbesar QRIS"
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900/40 text-white opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100"
                >
                  <MagnifyingGlassPlus size={24} weight="bold" />
                </button>
              </div>

              <div className="flex flex-1 flex-col justify-between py-1 text-center sm:text-left">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Foto QRIS Berhasil Terpasang
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Teman di room bisa langsung scan QRIS ini dari aplikasi m-banking atau e-wallet mereka.
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <button
                    type="button"
                    onClick={() => setShowZoomModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
                  >
                    <MagnifyingGlassPlus size={14} weight="bold" />
                    Lihat Jelas
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
                  >
                    <UploadSimple size={14} weight="bold" />
                    Ganti Foto
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveQris}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                  >
                    <Trash size={14} weight="bold" />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Upload Dropzone state */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              isDragging
                ? "border-blue-600 bg-blue-50/60"
                : "border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/20"
            }`}
          >
            {isProcessingQris ? (
              <div className="flex flex-col items-center py-4">
                <SpinnerGap size={36} weight="bold" className="animate-spin text-blue-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800">Memproses foto QRIS...</p>
                <p className="text-xs text-slate-500">Mengoptimasi resolusi gambar</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex h-14 w-14 shrink-0 aspect-square items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80 transition-transform group-hover:scale-105">
                  <QrCode size={30} weight="bold" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Upload Foto QRIS
                </h3>
                <p className="mt-1 max-w-[40ch] text-xs text-slate-500">
                  Klik untuk memilih file dari galeri atau seret file ke sini
                </p>
                <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-blue-600 shadow-2xs ring-1 ring-slate-200">
                  <UploadSimple size={14} weight="bold" />
                  Pilih Foto
                </div>
              </>
            )}
          </div>
        )}

        {qrisError && (
          <p className="mt-2 text-xs font-medium text-rose-600">
            {qrisError}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-slate-100" />
        <span className="absolute bg-white px-3 text-xs font-medium text-slate-400">
          Atau Nomor Rekening
        </span>
      </div>

      {/* Popular Bank Selector Chips (Horizontal swipe on mobile, wrap on desktop) */}
      <div className="mb-5">
        <span className="mb-2 block text-xs font-semibold text-slate-600">
          Pilihan Bank / E-Wallet
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 sm:flex-wrap no-scrollbar">
          {BANK_PRESETS.map((bank) => {
            const isSelected = bankName.toLowerCase() === bank.name.toLowerCase();
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => setBankName(bank.name)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-slate-200/80 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600"
                }`}
              >
                {bank.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bank Account Form Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bank-name" className="mb-1.5 block text-xs font-bold text-slate-700">
            Bank / E-Wallet
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Bank size={18} weight="bold" />
            </div>
            <input
              id="bank-name"
              type="text"
              placeholder="Contoh: BCA / GoPay"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pr-4 pl-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bank-no" className="mb-1.5 block text-xs font-bold text-slate-700">
            Nomor Rekening / No. HP
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <CreditCard size={18} weight="bold" />
            </div>
            <input
              id="bank-no"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 5410982711"
              value={bankAccountNo}
              onChange={(e) => setBankAccountNo(digitsOnly(e.target.value))}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pr-4 pl-11 font-mono text-sm font-medium text-slate-900 placeholder:font-sans placeholder:text-slate-400 transition-all focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="bank-account-name" className="mb-1.5 block text-xs font-bold text-slate-700">
            Nama Pemilik Rekening
          </label>
          <input
            id="bank-account-name"
            type="text"
            placeholder="Sesuai nama rekening di buku tabungan / e-wallet"
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
          />
        </div>
      </div>

      {/* QRIS Modal Zoom */}
      {showZoomModal && qrisImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fade-up-fast"
        >
          <div className="relative max-h-[90vh] max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowZoomModal(false)}
              aria-label="Tutup pratinjau QRIS"
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <X size={18} weight="bold" />
            </button>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Foto QRIS</h3>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
              <img
                src={qrisImageUrl}
                alt="QRIS Full View"
                className="max-h-[60vh] w-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowZoomModal(false)}
              className="mt-4 w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
