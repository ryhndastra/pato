import { useState } from "react";
import {
  Bank,
  Check,
  Copy,
  DownloadSimple,
  Eye,
  QrCode,
  X,
} from "@phosphor-icons/react";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { haptic } from "../../lib/haptic";
import type { RoomDetail } from "./types";

interface HostPaymentTargetCardProps {
  room: RoomDetail;
}

export function HostPaymentTargetCard({ room }: HostPaymentTargetCardProps) {
  const { copied, copy } = useCopyToClipboard();
  const [zoomQris, setZoomQris] = useState(false);
  const [downloadingQris, setDownloadingQris] = useState(false);

  async function handleDownloadQris(url: string) {
    if (!url) return;
    haptic.medium();
    setDownloadingQris(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `QRIS-pato-${room.room_code || "bayar"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      haptic.success();
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = `QRIS-pato-${room.room_code || "bayar"}.png`;
      a.click();
    } finally {
      setDownloadingQris(false);
    }
  }

  const hasQris = Boolean(room.qris_image_url);
  const hasBank = Boolean(room.bank_account_no);

  if (!hasQris && !hasBank) {
    return (
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Informasi Rekening Host
        </h3>
        <p className="text-xs text-slate-600">
          Host belum menambahkan nomor rekening atau QRIS. Silakan konfirmasi pembayaran secara langsung ke Host.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Bank size={14} weight="bold" className="text-blue-600" />
          <span>Tujuan Pembayaran ke Host</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {hasBank && room.bank_account_no && (
          <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Transfer Bank / E-Wallet
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {room.bank_name || "Transfer Bank"}
              </p>
              {room.bank_account_name && (
                <p className="text-[11px] text-slate-500">
                  a.n. {room.bank_account_name}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
              <span className="font-mono text-xs font-bold text-slate-900">
                {room.bank_account_no}
              </span>
              <button
                type="button"
                onClick={() => copy(room.bank_account_no!)}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check size={11} weight="bold" className="text-emerald-600" />
                    <span className="text-emerald-600">Disalin</span>
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
          <div className="flex flex-col items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-center">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <QrCode size={13} weight="bold" />
                QRIS Pembayaran
              </span>
              <p className="text-xs text-slate-600 mt-0.5">Scan via m-banking / e-wallet</p>
            </div>

            <button
              type="button"
              onClick={() => setZoomQris(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 active:scale-95"
            >
              <Eye size={12} weight="bold" />
              <span>Lihat QRIS</span>
            </button>
          </div>
        )}
      </div>

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
              className="max-h-[50vh] w-auto rounded-xl object-contain border border-slate-200"
            />

            <button
              type="button"
              onClick={() => handleDownloadQris(room.qris_image_url!)}
              disabled={downloadingQris}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-70"
            >
              <DownloadSimple size={16} weight="bold" />
              <span>{downloadingQris ? "Menyimpan..." : "Simpan Gambar QRIS"}</span>
            </button>

            <p className="text-[11px] text-slate-500 text-center leading-tight">
              Buka aplikasi m-banking atau e-wallet kamu, lalu gunakan fitur <strong>Scan dari Galeri</strong>.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
