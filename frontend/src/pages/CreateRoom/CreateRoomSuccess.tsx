import { useState } from "react";
import { Check, Copy, WhatsappLogo } from "@phosphor-icons/react";
import { useNavigate } from "react-router";

interface CreateRoomSuccessProps {
  roomCode: string;
  shareUrl: string;
  title: string;
}

export function CreateRoomSuccess({ roomCode, shareUrl, title }: CreateRoomSuccessProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleWhatsapp() {
    const text = `Kuy gabung room patungan "${title}" di PaTo: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center lg:px-12">
      <div className="flex w-full max-w-[380px] flex-col items-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
          <Check size={28} weight="bold" />
        </div>

        <h1 className="mb-2 text-[22px] leading-[1.25] font-bold tracking-[-0.01em] text-ink lg:text-2xl">
          Room siap dibagikan
        </h1>
        <p className="mb-6 max-w-[32ch] text-sm leading-relaxed text-ink-soft">
          Kirim link ini ke teman-teman kamu biar mereka bisa mulai klaim
          makanan.
        </p>

        <div className="mb-4 w-full rounded-xl border border-hairline bg-haze px-4 py-3">
          <p className="mb-0.5 text-[11px] font-bold tracking-wide text-ink-muted uppercase">
            Kode Room
          </p>
          <p className="font-mono text-lg font-bold tracking-wide text-ink">
            {roomCode}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <button
            type="button"
            onClick={handleWhatsapp}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_2px_4px_rgba(37,99,235,0.15)]"
          >
            <WhatsappLogo size={20} weight="fill" />
            Bagikan via WhatsApp
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-shell text-[15px] font-bold text-ink active:bg-canvas"
          >
            <Copy size={20} weight="regular" />
            {copied ? "Tersalin!" : "Salin Link"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard", { replace: true })}
            className="h-[52px] w-full text-[15px] font-semibold text-ink-soft"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
