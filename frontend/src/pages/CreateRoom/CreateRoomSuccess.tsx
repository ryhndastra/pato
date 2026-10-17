import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  House,
  Lightbulb,
  MapPin,
  ShareNetwork,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import patoLogo from "../../assets/pato.png";

interface CreateRoomSuccessProps {
  roomCode: string;
  shareUrl: string;
  title: string;
}

export function CreateRoomSuccess({
  roomCode,
  shareUrl,
  title,
}: CreateRoomSuccessProps) {
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  }

  function handleWhatsapp() {
    const text = `Kuy gabung room split bill "${title || "Patungan"}" di PaTo: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Split Bill: ${title || "Patungan"}`,
          text: `Kuy gabung meja split bill "${title || "Patungan"}" di PaTo:`,
          url: shareUrl,
        });
        return;
      } catch {
        // user aborted or not supported
      }
    }
    handleCopyLink();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100/70">
      {/* Top blue gradient header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-4 pt-[calc(max(env(safe-area-inset-top,0px),0px)+1rem)] pb-14 text-white sm:px-6 sm:pb-16">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 mx-auto max-w-md">
          {/* Top navigation */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Beranda</span>
            </button>
          </div>

          {/* Celebratory Hero Header */}
          <div className="mt-5 flex flex-col items-center text-center">
            {/* Celebratory Brand & Success Icon */}
            <div className="relative mb-3.5">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-white/60 bg-white p-3 shadow-xl shadow-blue-950/30 ring-4 ring-white/20 sm:h-22 sm:w-22">
                <img
                  src={patoLogo}
                  alt="PaTo Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
                <Check size={14} weight="bold" />
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Meja Siap Dipakai!
            </h1>
            <p className="mt-1 max-w-xs text-xs font-medium text-blue-100/90 sm:text-sm">
              Bagikan link atau kode ini ke teman semeja agar bisa langsung klaim pesanan.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 mx-auto -mt-6 w-full max-w-md flex-1 px-4 pb-8 sm:px-6">
        <div className="space-y-4">
          {/* Ticket Card: Access Code & Link */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
            {/* Ticket Header */}
            <div className="border-b border-dashed border-slate-200 bg-slate-50/80 px-5 py-4 text-center">
              <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
                KODE AKSES MEJA
              </span>
              <div className="mt-1 flex items-center justify-center gap-3">
                <p className="font-mono text-3xl font-black tracking-widest text-blue-600 sm:text-4xl">
                  {roomCode}
                </p>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  aria-label="Salin Kode Akses"
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100 active:scale-95"
                >
                  {copiedCode ? (
                    <>
                      <Check size={13} weight="bold" className="text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} weight="bold" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              {title ? (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-200/60 px-3 py-1 text-xs font-semibold text-slate-700">
                  <MapPin size={13} weight="fill" className="shrink-0 text-blue-600" />
                  <span className="truncate max-w-[220px]">{title}</span>
                </div>
              ) : null}
            </div>

            {/* Quick Link Row */}
            <div className="p-4 sm:p-5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Link Langsung
              </label>
              <div className="mt-1.5 flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 pl-3.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <span className="truncate text-xs font-mono text-slate-600 flex-1">
                  {shareUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-white px-3 text-xs font-bold text-slate-700 shadow-xs border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check size={14} weight="bold" className="text-emerald-600" />
                      <span className="text-emerald-700">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} weight="bold" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2.5">
                {/* Primary CTA: Open Room */}
                <button
                  type="button"
                  onClick={() => navigate(`/room/${roomCode}`)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]"
                >
                  <span>Buka Meja Sekarang</span>
                  <ArrowRight size={18} weight="bold" />
                </button>

                {/* Secondary 2-column actions: WhatsApp + Share */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleWhatsapp}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.98] sm:text-sm"
                  >
                    <WhatsappLogo size={18} weight="fill" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 active:scale-[0.98] sm:text-sm"
                  >
                    <ShareNetwork size={18} weight="bold" className="text-blue-600" />
                    <span>{copiedLink ? "Link Tersalin!" : "Bagikan"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Friendly Tip Box for everyday non-tech users */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900/90">
            <Lightbulb size={18} weight="fill" className="shrink-0 text-amber-500 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold text-blue-950">Tanpa ribet install:</strong> Teman kamu bisa langsung buka link lewat browser HP dan klaim pesanan masing-masing.
            </p>
          </div>

          {/* Back to Home footer */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-700"
            >
              <House size={16} weight="regular" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
