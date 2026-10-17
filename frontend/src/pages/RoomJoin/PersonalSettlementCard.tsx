import { useRef, useState } from "react";
import {
  Bank,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  QrCode,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { compressImageFile } from "../../lib/imageCompression";
import { safeIDR } from "./money";
import type { RoomDetail, RoomMember } from "./types";
import mascotCelebrating from "../../assets/pato_mascot_celebrating.jpg";

interface PersonalSettlementCardProps {
  room: RoomDetail;
  me: RoomMember;
  onSubmitProof: (proofBase64: string) => Promise<void>;
}

export function PersonalSettlementCard({
  room,
  me,
  onSubmitProof,
}: PersonalSettlementCardProps) {
  const { copied: copiedNominal, copy: copyNominal } = useCopyToClipboard();
  const { copied: copiedRekening, copy: copyRekening } = useCopyToClipboard();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewProof, setPreviewProof] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState(false);
  const [zoomQris, setZoomQris] = useState(false);

  const subtotal = room.subtotal > 0 ? room.subtotal : 1;
  const ratio = me.subtotal_share / subtotal;
  const myTax = Math.round((room.tax_amount ?? 0) * ratio);
  const myService = Math.round((room.service_amount ?? 0) * ratio);
  const myDiscount = Math.round((room.discount_amount ?? 0) * ratio);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      const compressed = await compressImageFile(file, 1200, 1200, 0.82);
      setPreviewProof(compressed);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Gagal memproses gambar bukti transfer.");
    }
  }

  async function handleConfirmUpload() {
    if (!previewProof) return;
    setUploading(true);
    setUploadError(null);
    try {
      await onSubmitProof(previewProof);
      setPreviewProof(null);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Gagal mengunggah bukti transfer.");
    } finally {
      setUploading(false);
    }
  }

  const paymentStatus = me.payment_status ?? "UNPAID";
  const hasBank = Boolean(room.bank_account_no);
  const hasQris = Boolean(room.qris_image_url);

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tagihan Patungan Kamu
          </span>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            {me.display_name}
          </h2>
        </div>

        <div>
          {paymentStatus === "VERIFIED" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
              <CheckCircle size={14} weight="fill" className="text-emerald-600" />
              Lunas
            </span>
          )}
          {paymentStatus === "PENDING" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-100">
              <Clock size={14} weight="bold" />
              Menunggu Host
            </span>
          )}
          {paymentStatus === "REJECTED" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-100">
              <WarningCircle size={14} weight="bold" />
              Bukti Ditolak
            </span>
          )}
          {paymentStatus === "UNPAID" && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Belum Bayar
            </span>
          )}
        </div>
      </div>

      {/* 1. NOMINAL TRANSFER HERO */}
      <div className="flex flex-col gap-2.5 rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Nominal Pas Transfer
            </span>
            <p className="font-mono tabular-nums text-2xl sm:text-3xl font-black text-slate-900">
              {safeIDR(me.share_amount)}
            </p>
            {Boolean(me.raw_share_amount && me.raw_share_amount !== me.share_amount) && (
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                Dibulatkan dari <span className="line-through">{safeIDR(me.raw_share_amount)}</span> ({room.round_mode === "thousand" ? "ke ribuan" : "ke ratusan"}) agar transfer mudah
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => copyNominal(String(me.share_amount))}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-black active:scale-90 transition-all"
          >
            {copiedNominal ? (
              <>
                <Check size={13} weight="bold" className="text-emerald-300" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={13} weight="bold" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>

        {/* Fair-Math Breakdown */}
        <div className="border-t border-slate-200/60 pt-2 text-xs text-slate-600 flex flex-col gap-1">
          <div className="flex justify-between">
            <span>Subtotal menu pilihanmu</span>
            <span className="font-mono font-semibold text-slate-900">{safeIDR(me.subtotal_share)}</span>
          </div>
          {(room.tax_amount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span>Porsi pajak restoran (PB1)</span>
              <span className="font-mono font-semibold text-slate-900">{safeIDR(myTax)}</span>
            </div>
          )}
          {(room.service_amount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span>Porsi service charge</span>
              <span className="font-mono font-semibold text-slate-900">{safeIDR(myService)}</span>
            </div>
          )}
          {(room.discount_amount ?? 0) > 0 && (
            <div className="flex justify-between text-blue-600 font-semibold">
              <span>Potongan diskon</span>
              <span className="font-mono">-{safeIDR(myDiscount)}</span>
            </div>
          )}
          {Boolean(me.raw_share_amount && me.raw_share_amount !== me.share_amount) && (
            <div className="flex justify-between text-blue-600 font-medium">
              <span>Penyesuaian pembulatan</span>
              <span className="font-mono">+{safeIDR(me.share_amount - (me.raw_share_amount ?? me.share_amount))}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. TUJUAN TRANSFER BANK & QRIS HOST */}
      <div className="flex flex-col gap-2 rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Tujuan Transfer ke Host
        </span>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {hasBank && room.bank_account_no && (
            <div className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200/80 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Bank size={16} weight="bold" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {room.bank_name || "Transfer Bank"}
                  </p>
                  {room.bank_account_name && (
                    <p className="truncate text-[11px] text-slate-500">
                      a.n. {room.bank_account_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="font-mono text-xs font-bold text-slate-900">
                  {room.bank_account_no}
                </span>
                <button
                  type="button"
                  onClick={() => copyRekening(room.bank_account_no!)}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 active:scale-95"
                >
                  {copiedRekening ? (
                    <>
                      <Check size={11} weight="bold" className="text-emerald-600" />
                      <span className="text-emerald-600">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} weight="bold" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {hasQris && room.qris_image_url && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <QrCode size={16} weight="bold" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">QRIS Host</p>
                  <p className="text-[10px] text-slate-500">Scan via m-banking / e-wallet</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setZoomQris(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 active:scale-95"
              >
                <Eye size={12} weight="bold" />
                <span>Lihat QRIS</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. REJECTION MESSAGE (IF REJECTED) */}
      {paymentStatus === "REJECTED" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900">
          <p className="font-bold flex items-center gap-1.5 text-rose-800">
            <WarningCircle size={15} weight="bold" />
            Bukti transfer ditolak Host:
          </p>
          <p className="mt-1 font-medium bg-white/80 rounded-lg p-2 text-rose-950 border border-rose-100">
            &ldquo;{me.rejection_reason || "Nominal atau bukti transfer tidak sesuai."}&rdquo;
          </p>
          <p className="mt-1.5 text-[11px] text-rose-700">
            Silakan unggah ulang screenshot transfer yang valid di bawah.
          </p>
        </div>
      )}

      {/* 4. FORMULIR UPLOAD BUKTI / STATUS LUNAS */}
      {paymentStatus === "VERIFIED" ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-emerald-50/70 p-4 text-center border border-emerald-100">
          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white p-1 shadow-2xs border border-emerald-200/60">
            <img
              src={mascotCelebrating}
              alt="Pato Celebrating"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-900">
              Pembayaran Terverifikasi Lunas!
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Terima kasih sudah melunasi patungan tepat waktu.
            </p>
          </div>
          {me.proof_image_url && (
            <button
              type="button"
              onClick={() => setViewingProof(true)}
              className="mt-1 text-xs font-bold text-emerald-800 hover:underline"
            >
              Lihat Foto Bukti Terkirim
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              {paymentStatus === "PENDING" ? "Bukti Terkirim" : "Unggah Bukti Transfer"}
            </span>
            {me.proof_image_url && (
              <button
                type="button"
                onClick={() => setViewingProof(true)}
                className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <Eye size={12} weight="bold" />
                <span>Lihat Bukti</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {previewProof ? (
            <div className="flex flex-col gap-2.5 rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Foto siap dikirim</span>
                <button
                  type="button"
                  onClick={() => setPreviewProof(null)}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Batal
                </button>
              </div>

              <img
                src={previewProof}
                alt="Pratinjau"
                className="max-h-48 w-auto mx-auto rounded-lg object-contain border border-slate-200"
              />

              {uploadError && (
                <p className="text-xs font-semibold text-rose-600">{uploadError}</p>
              )}

              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-98 transition-all disabled:opacity-60"
              >
                <UploadSimple size={15} weight="bold" />
                <span>{uploading ? "Mengirim ke Host..." : "Kirim Bukti Pembayaran ke Host"}</span>
              </button>
            </div>
          ) : paymentStatus === "PENDING" ? (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Clock size={16} weight="bold" className="text-amber-600 shrink-0" />
                <span>Bukti terkirim. Menunggu konfirmasi Host.</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-blue-600 hover:underline shrink-0 ml-2"
              >
                Ganti
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-5 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30 active:scale-98"
            >
              <UploadSimple size={20} weight="bold" className="text-blue-600" />
              <p className="text-xs font-bold text-slate-800">
                Pilih Screenshot Bukti Transfer
              </p>
              <p className="text-[11px] text-slate-400">
                Pilih file struk m-banking dari galeri ponsel
              </p>
            </button>
          )}
        </div>
      )}

      {/* Modal View Proof */}
      {viewingProof && me.proof_image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewingProof(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-sm w-full overflow-hidden rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Bukti Transfer Kamu</span>
              <button
                type="button"
                onClick={() => setViewingProof(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <img
              src={me.proof_image_url}
              alt="Bukti Transfer"
              className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain border border-slate-100"
            />
          </div>
        </div>
      )}

      {/* Modal Zoom QRIS */}
      {zoomQris && room.qris_image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomQris(false)}
        >
          <div
            className="relative max-w-sm w-full flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-bold text-slate-900">QRIS Host</span>
              <button
                type="button"
                onClick={() => setZoomQris(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <img
              src={room.qris_image_url}
              alt="QRIS Host"
              className="max-h-[60vh] w-auto rounded-xl object-contain border border-slate-200"
            />
          </div>
        </div>
      )}
    </section>
  );
}
