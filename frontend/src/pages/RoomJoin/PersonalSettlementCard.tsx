import { useRef, useState } from "react";
import {
  Bank,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  QrCode,
  Storefront,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { compressImageFile } from "../../lib/imageCompression";
import { safeIDR } from "./money";
import type { RoomDetail, RoomMember } from "./types";

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
  const [zoomQrisUrl, setZoomQrisUrl] = useState<string | null>(null);

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
  const hasRoomBank = Boolean(room.bank_account_no);
  const hasRoomQris = Boolean(room.qris_image_url);

  const receiptBreakdown = me.receipt_breakdown && me.receipt_breakdown.length > 0
    ? me.receipt_breakdown
    : null;

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-100">
              <CheckCircle size={15} weight="fill" className="text-emerald-600" />
              Lunas
            </span>
          )}
          {paymentStatus === "PENDING" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 border border-amber-100">
              <Clock size={15} weight="bold" />
              Menunggu Host
            </span>
          )}
          {paymentStatus === "REJECTED" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-100">
              <WarningCircle size={15} weight="bold" />
              Bukti Ditolak
            </span>
          )}
          {paymentStatus === "UNPAID" && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              Belum Bayar
            </span>
          )}
        </div>
      </div>

      {/* 1. NOMINAL TRANSFER HERO */}
      <div className="flex flex-col gap-3 rounded-2xl bg-slate-50/90 p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Nominal Patungan
            </span>
            <p className="font-mono tabular-nums text-2xl sm:text-3xl font-black text-slate-900">
              {safeIDR(me.share_amount)}
            </p>
            {Boolean(me.raw_share_amount && me.raw_share_amount !== me.share_amount) && (
              <p className="mt-1 text-[11px] text-slate-500 font-medium">
                Dibulatkan dari <span className="line-through">{safeIDR(me.raw_share_amount)}</span> ({room.round_mode === "thousand" ? "ke ribuan" : "ke ratusan"}) agar transfer mudah
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => copyNominal(String(me.share_amount))}
            aria-label="Salin nominal transfer"
            className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs hover:bg-black active:scale-95 transition-all"
          >
            {copiedNominal ? (
              <>
                <Check size={15} weight="bold" className="text-emerald-300 animate-check-pop" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={15} weight="bold" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>

        {/* Fair-Math Breakdown */}
        <div className="border-t border-slate-200/70 pt-2.5 text-xs text-slate-600 flex flex-col gap-1.5">
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

      {/* 2. RINCIAN PER SPOT / NALANGIN (MULTI-RECEIPT BREAKDOWN) */}
      {receiptBreakdown && receiptBreakdown.length > 1 ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50/70 p-4 border border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Storefront size={15} weight="bold" />
            </span>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                Rincian Pembayaran per Spot Nongkrong
              </span>
              <p className="text-[10px] text-slate-500">
                Transfer ke masing-masing teman yang nalangin di tiap tempat:
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {receiptBreakdown.map((item, idx) => {
              const isPayerMe = item.payer_member_id === me.id;
              const hasCustomBank = Boolean(item.bank_account_no);
              const hasCustomQris = Boolean(item.qris_image_url);

              const bankNameToUse = hasCustomBank ? item.bank_name : (hasRoomBank ? room.bank_name : null);
              const bankAccNoToUse = hasCustomBank ? item.bank_account_no : (hasRoomBank ? room.bank_account_no : null);
              const bankHolderToUse = hasCustomBank ? item.bank_account_name : (hasRoomBank ? room.bank_account_name : null);
              const qrisToUse = hasCustomQris ? item.qris_image_url : (hasRoomQris ? room.qris_image_url : null);

              return (
                <div
                  key={`${item.receipt_id}-${idx}`}
                  className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Nalangin: <span className="font-bold text-slate-700">{isPayerMe ? "Kamu Sendiri" : item.payer_name}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-black text-slate-900 tabular-nums">
                        {safeIDR(item.amount)}
                      </span>
                    </div>
                  </div>

                  {isPayerMe ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200/70 px-3 py-2 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />
                      <span>Ditalangi oleh kamu (Tidak perlu bayar)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-2.5">
                      {bankAccNoToUse && (
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                          <div className="min-w-0 pr-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">
                              {bankNameToUse || "Bank"} {bankHolderToUse && `· a.n. ${bankHolderToUse}`}
                            </p>
                            <p className="font-mono text-xs font-bold text-slate-900 truncate">
                              {bankAccNoToUse}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyRekening(bankAccNoToUse)}
                            className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-white px-3 text-[11px] font-bold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
                          >
                            {copiedRekening ? (
                              <>
                                <Check size={12} weight="bold" className="text-emerald-600 animate-check-pop" />
                                <span className="text-emerald-600">Salin</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} weight="bold" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {qrisToUse && (
                        <div className="flex items-center justify-between rounded-xl bg-purple-50/50 px-3 py-2 border border-purple-100">
                          <div className="flex items-center gap-2">
                            <QrCode size={16} weight="bold" className="text-purple-600" />
                            <span className="text-xs font-bold text-purple-900">QRIS Nalangin</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setZoomQrisUrl(qrisToUse)}
                            className="flex h-9 items-center gap-1 rounded-xl bg-purple-600 px-3 text-[11px] font-bold text-white shadow-2xs hover:bg-purple-700 active:scale-95 transition-all"
                          >
                            <Eye size={12} weight="bold" />
                            <span>Buka QRIS</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* SINGLE RECIPIENT / HOST TRANSFER DESTINATION */
        <div className="flex flex-col gap-2.5 rounded-2xl bg-slate-50/70 p-4 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Tujuan Transfer ke Host
          </span>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {hasRoomBank && room.bank_account_no && (
              <div className="flex flex-col justify-between gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Bank size={18} weight="bold" />
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

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {room.bank_account_no}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyRekening(room.bank_account_no!)}
                    className="flex h-9 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
                  >
                    {copiedRekening ? (
                      <>
                        <Check size={12} weight="bold" className="text-emerald-600 animate-check-pop" />
                        <span className="text-emerald-600">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} weight="bold" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {hasRoomQris && room.qris_image_url && (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <QrCode size={18} weight="bold" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">QRIS Host</p>
                    <p className="text-[10px] text-slate-500">Scan via m-banking / e-wallet</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setZoomQrisUrl(room.qris_image_url!)}
                  className="flex h-9 items-center gap-1 rounded-xl bg-purple-50 px-3 text-xs font-bold text-purple-700 hover:bg-purple-100 active:scale-95 transition-all"
                >
                  <Eye size={13} weight="bold" />
                  <span>Lihat QRIS</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. REJECTION MESSAGE (IF REJECTED) */}
      {paymentStatus === "REJECTED" && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
          <p className="font-bold flex items-center gap-1.5 text-rose-800">
            <WarningCircle size={16} weight="bold" />
            Bukti transfer ditolak Host:
          </p>
          <p className="mt-1.5 font-medium bg-white/90 rounded-xl p-2.5 text-rose-950 border border-rose-100">
            &ldquo;{me.rejection_reason || "Nominal atau bukti transfer tidak sesuai."}&rdquo;
          </p>
          <p className="mt-2 text-[11px] text-rose-700">
            Silakan unggah ulang screenshot transfer yang valid di bawah.
          </p>
        </div>
      )}

      {/* 4. FORMULIR UPLOAD BUKTI / STATUS LUNAS */}
      {paymentStatus === "VERIFIED" ? (
        <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-emerald-50/80 p-5 text-center border border-emerald-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-100">
            <CheckCircle size={28} weight="fill" />
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
                <Eye size={13} weight="bold" />
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
            <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
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
                className="max-h-48 w-auto mx-auto rounded-xl object-contain border border-slate-200"
              />

              {uploadError && (
                <p className="text-xs font-semibold text-rose-600">{uploadError}</p>
              )}

              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-98 transition-all disabled:opacity-60"
              >
                <UploadSimple size={16} weight="bold" />
                <span>{uploading ? "Mengirim ke Host..." : "Kirim Bukti Pembayaran ke Host"}</span>
              </button>
            </div>
          ) : paymentStatus === "PENDING" ? (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
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
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30 active:scale-98"
            >
              <UploadSimple size={24} weight="bold" className="text-blue-600" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-backdrop-fade"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewingProof(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-sm w-full overflow-hidden rounded-3xl bg-white p-4 shadow-2xl animate-dialog-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Bukti Transfer Kamu</span>
              <button
                type="button"
                onClick={() => setViewingProof(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <img
              src={me.proof_image_url}
              alt="Bukti Transfer"
              className="max-h-[75vh] w-auto mx-auto rounded-2xl object-contain border border-slate-100"
            />
          </div>
        </div>
      )}

      {/* Modal Zoom QRIS */}
      {zoomQrisUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-backdrop-fade"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomQrisUrl(null)}
        >
          <div
            className="relative max-w-sm w-full flex flex-col items-center gap-3 rounded-3xl bg-white p-5 shadow-2xl animate-dialog-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-bold text-slate-900">QRIS Pembayaran</span>
              <button
                type="button"
                onClick={() => setZoomQrisUrl(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <img
              src={zoomQrisUrl}
              alt="QRIS Pembayaran"
              className="max-h-[60vh] w-auto rounded-2xl object-contain border border-slate-200"
            />
          </div>
        </div>
      )}
    </section>
  );
}
