import { useState, useId, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChatCircleDots,
  CheckCircle,
  Copy,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { formatIDR } from "../../lib/format";

export interface NudgeInitialData {
  roomCode?: string;
  roomTitle?: string;
  amount?: number;
}

interface WhatsAppNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: NudgeInitialData | null;
}

type TemplateType = "friendly" | "formal" | "humor";

const TEMPLATES: { id: TemplateType; title: string; badge: string }[] = [
  { id: "friendly", title: "Santai & Ramah", badge: "Pilihan Utama" },
  { id: "formal", title: "Kasir Formal", badge: "Resmi" },
  { id: "humor", title: "Cepat & Ringkas", badge: "Langsung" },
];

export function WhatsAppNudgeModal({
  isOpen,
  onClose,
  initialData,
}: WhatsAppNudgeModalProps) {
  const friendNameId = useId();
  const eventNameId = useId();
  const amountId = useId();
  const roomLinkId = useId();

  const [activeTemplate, setActiveTemplate] = useState<TemplateType>("friendly");
  const [friendName, setFriendName] = useState("");
  const [eventName, setEventName] = useState(initialData?.roomTitle ?? "Makan Bareng");
  const [amount, setAmount] = useState<string>(
    initialData?.amount ? String(initialData.amount) : "50000",
  );
  const [roomUrl, setRoomUrl] = useState(() => {
    if (initialData?.roomCode) {
      return `${window.location.origin}/room/${initialData.roomCode}`;
    }
    return window.location.origin;
  });

  const { copied, copy } = useCopyToClipboard();

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetName = friendName.trim() || "[Nama]";
  const targetEvent = eventName.trim() || "acara makan";
  const numAmount = Number(amount) || 0;
  const formattedNominal = formatIDR(numAmount);

  function getMessage(): string {
    switch (activeTemplate) {
      case "friendly":
        return `Halo ${targetName}, tadi patungan di *${targetEvent}* total bagian kamu *${formattedNominal}* ya.\n\nDetail rincian menu dan QRIS pembayaran bisa dicek di tautan berikut:\n• ${roomUrl}\n\nTerima kasih banyak!`;
      case "formal":
        return `Selamat siang/malam ${targetName},\n\nBerikut rincian tagihan split bill untuk *${targetEvent}*:\n• Total tagihan: *${formattedNominal}*\n• Detail rincian & QRIS: ${roomUrl}\n\nMohon bantuannya untuk menyelesaikan pembayaran via tautan di atas. Terima kasih.`;
      case "humor":
        return `Halo ${targetName}, tagihan patungan untuk *${targetEvent}* sebesar *${formattedNominal}* sudah dihitung via PaTo.\n\nBisa langsung cek rincian dan QRIS pembayarannya di tautan berikut:\n• ${roomUrl}\n\nMohon segera diselesaikan ya, terima kasih!`;
    }
  }

  const messageText = getMessage();

  function handleOpenWhatsApp() {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nudge-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Clean Native Modal Card */}
      <div className="relative z-10 flex w-full max-w-[500px] max-h-[92dvh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* 1. STICKY HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-50">
              <WhatsappLogo size={22} weight="fill" />
            </div>
            <div className="min-w-0">
              <h2 id="nudge-modal-title" className="truncate text-base font-extrabold text-slate-900">
                Kirim Pengingat Tagihan
              </h2>
              <p className="truncate text-xs text-slate-500">
                Pesan WhatsApp siap kirim tanpa canggung
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 active:scale-90"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* 2. SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Template Selection Tabs */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pilihan Nada Pesan
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100/80 p-1">
              {TEMPLATES.map((tmpl) => {
                const isActive = activeTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setActiveTemplate(tmpl.id)}
                    className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 text-center transition-all ${
                      isActive
                        ? "bg-white font-extrabold text-blue-600 shadow-xs ring-1 ring-slate-200/60"
                        : "font-semibold text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs">{tmpl.title}</span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    >
                      {tmpl.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor={friendNameId} className="mb-1 block text-[11px] font-bold text-slate-600">
                Nama Teman
              </label>
              <input
                id={friendNameId}
                type="text"
                placeholder="Contoh: Kevin"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={eventNameId} className="mb-1 block text-[11px] font-bold text-slate-600">
                Nama Resto / Acara
              </label>
              <input
                id={eventNameId}
                type="text"
                placeholder="Contoh: Sushi Tei"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={amountId} className="mb-1 block text-[11px] font-bold text-slate-600">
                Nominal Tagihan (Rp)
              </label>
              <input
                id={amountId}
                type="number"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 font-mono text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={roomLinkId} className="mb-1 block text-[11px] font-bold text-slate-600">
                Tautan Meja / Room
              </label>
              <input
                id={roomLinkId}
                type="text"
                value={roomUrl}
                onChange={(e) => setRoomUrl(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* WhatsApp Preview Bubble */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <ChatCircleDots size={14} weight="bold" />
                <span>Preview Teks WhatsApp</span>
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Format Siap Kirim
              </span>
            </div>

            <div className="rounded-2xl bg-[#ece5dd] p-3.5 border border-slate-200/80 shadow-inner">
              <div className="relative max-w-[94%] rounded-2xl rounded-tl-sm bg-[#d9fdd3] p-3 text-xs leading-relaxed text-slate-900 shadow-xs whitespace-pre-wrap font-sans">
                {messageText}
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                  <span>Baru saja</span>
                  <CheckCircle size={11} weight="fill" className="text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. STICKY FOOTER ACTION BUTTONS */}
        <div className="flex shrink-0 flex-col sm:flex-row items-center gap-2 border-t border-slate-100 bg-slate-50/90 p-4">
          <button
            type="button"
            onClick={() => copy(messageText)}
            className="flex h-11 w-full sm:flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-98 transition-all"
          >
            {copied ? (
              <>
                <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                <span>Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy size={16} weight="bold" />
                <span>Salin Pesan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex h-11 w-full sm:flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
          >
            <WhatsappLogo size={18} weight="fill" />
            <span>Kirim via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
