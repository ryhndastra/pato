import { useState, useId } from "react";
import {
  ChatCircleDots,
  CheckCircle,
  Copy,
  WhatsappLogo,
  X,
  Sparkle,
} from "@phosphor-icons/react";
import mascotCelebrating from "../../assets/pato_mascot_celebrating.jpg";
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nudge-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative z-10 w-full max-w-[560px] rounded-[2rem] bg-white/20 p-1.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-white/30 backdrop-blur-xl sm:p-2">
        <div className="max-h-[88dvh] overflow-y-auto rounded-[calc(2rem-0.375rem)] bg-white p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] sm:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-hairline pb-4">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-black/5 sm:h-12 sm:w-12">
                <img
                  src={mascotCelebrating}
                  alt="Pato Mascot"
                  className="h-full w-full object-contain p-0.5"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold tracking-wider text-emerald-700 uppercase ring-1 ring-emerald-600/20 sm:text-[10px]">
                    F06 Auto Nudge
                  </span>
                  <Sparkle size={12} weight="fill" className="text-amber-500" />
                </div>
                <h2 id="nudge-modal-title" className="text-base font-bold text-ink sm:text-lg">
                  WhatsApp Nudge Generator
                </h2>
                <p className="text-[11px] text-ink-muted sm:text-xs">
                  Format penagihan sopan tanpa drama & tanpa simpan nomor HP.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-ink-muted transition-colors hover:bg-slate-200 hover:text-ink sm:h-9 sm:w-9"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          {/* Template tabs */}
          <div className="mt-4 sm:mt-5">
            <p className="mb-2 text-[10.5px] font-bold text-ink-muted uppercase tracking-wider sm:text-xs">
              Pilihan Nada Pesan
            </p>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100/80 p-1 ring-1 ring-black/5 sm:gap-2 sm:p-1.5">
              {TEMPLATES.map((tmpl) => {
                const isActive = activeTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setActiveTemplate(tmpl.id)}
                    className={`flex flex-col items-center justify-center rounded-xl px-1.5 py-1.5 text-center transition-all sm:py-2 ${
                      isActive
                        ? "bg-white font-bold text-blue-600 shadow-xs ring-1 ring-black/5"
                        : "font-medium text-ink-soft hover:text-ink"
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs">{tmpl.title}</span>
                    <span
                      className={`mt-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isActive ? "text-blue-600" : "text-ink-muted"
                      }`}
                    >
                      {tmpl.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form inputs */}
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3">
            <div>
              <label htmlFor={friendNameId} className="mb-1 block text-[10.5px] font-bold uppercase text-ink-muted sm:text-[11px]">
                Nama Teman
              </label>
              <input
                id={friendNameId}
                type="text"
                placeholder="Contoh: Kevin"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                className="h-9 w-full rounded-xl border border-hairline bg-slate-50/60 px-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand focus:bg-white focus:outline-none sm:h-10"
              />
            </div>
            <div>
              <label htmlFor={eventNameId} className="mb-1 block text-[10.5px] font-bold uppercase text-ink-muted sm:text-[11px]">
                Nama Resto / Acara
              </label>
              <input
                id={eventNameId}
                type="text"
                placeholder="Contoh: Sushi Tei"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="h-9 w-full rounded-xl border border-hairline bg-slate-50/60 px-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand focus:bg-white focus:outline-none sm:h-10"
              />
            </div>
            <div>
              <label htmlFor={amountId} className="mb-1 block text-[10.5px] font-bold uppercase text-ink-muted sm:text-[11px]">
                Nominal Tagihan (Rp)
              </label>
              <input
                id={amountId}
                type="number"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 w-full rounded-xl border border-hairline bg-slate-50/60 px-3 font-mono text-xs font-bold text-ink placeholder:text-ink-muted focus:border-brand focus:bg-white focus:outline-none sm:h-10"
              />
            </div>
            <div>
              <label htmlFor={roomLinkId} className="mb-1 block text-[10.5px] font-bold uppercase text-ink-muted sm:text-[11px]">
                Tautan Meja / Room
              </label>
              <input
                id={roomLinkId}
                type="text"
                value={roomUrl}
                onChange={(e) => setRoomUrl(e.target.value)}
                className="h-9 w-full rounded-xl border border-hairline bg-slate-50/60 px-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand focus:bg-white focus:outline-none sm:h-10"
              />
            </div>
          </div>

          {/* Message preview */}
          <div className="mt-4 sm:mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-muted sm:text-[11px]">
                <ChatCircleDots size={14} weight="bold" />
                <span>Preview Pesan WhatsApp</span>
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-700">
                Format Siap Kirim
              </span>
            </div>
            <div className="rounded-2xl bg-[#efeae2] p-3 ring-1 ring-black/5 shadow-inner sm:p-3.5">
              <div className="max-w-[95%] rounded-2xl rounded-tl-sm bg-[#d9fdd3] p-2.5 font-sans text-xs leading-relaxed text-slate-800 shadow-xs whitespace-pre-wrap sm:p-3">
                {messageText}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:items-center sm:gap-2.5">
            {/* Copy button */}
            <button
              type="button"
              onClick={() => copy(messageText)}
              className="group flex h-11 flex-1 items-center justify-between rounded-full bg-slate-100 px-4 text-xs font-bold text-ink transition-all hover:bg-slate-200 active:scale-[0.98] sm:h-12 sm:px-5"
            >
              <span>{copied ? "Teks Berhasil Disalin" : "Salin Pesan"}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink shadow-xs transition-transform group-hover:scale-105 sm:h-8 sm:w-8">
                {copied ? (
                  <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                ) : (
                  <Copy size={15} weight="bold" />
                )}
              </span>
            </button>

            {/* Open WhatsApp button */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="group flex h-11 flex-1 items-center justify-between rounded-full bg-emerald-600 px-4 text-xs font-bold text-white shadow-[0_4px_16px_rgba(5,150,105,0.25)] transition-all hover:bg-emerald-700 active:scale-[0.98] sm:h-12 sm:px-5"
            >
              <span>Kirim via WhatsApp</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white shadow-xs transition-transform group-hover:scale-105 group-hover:rotate-6 sm:h-8 sm:w-8">
                <WhatsappLogo size={17} weight="fill" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
