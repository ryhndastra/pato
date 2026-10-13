import { useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  House,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import patoMascotCelebrating from "../../assets/pato_mascot_celebrating.jpg";

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
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsapp() {
    const text = `Kuy gabung room split bill "${title}" di PaTo: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      {/* Decorative top curved hero */}
      <div className="relative overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-blue-500 px-4 pt-10 pb-20 sm:px-6 sm:pb-24 text-center">
        <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 mx-auto max-w-md">
          <p className="font-mono text-xs font-bold tracking-widest text-blue-200 uppercase">
            BERHASIL DIBUAT
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Room Siap Dibagikan!
          </h1>
          <p className="mt-1.5 text-xs text-blue-100 sm:text-sm">
            Kirim link ke teman-teman agar mereka bisa klaim porsi masing-masing.
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 mx-auto -mt-10 w-full max-w-md flex-1 px-4 pb-12 sm:-mt-12 sm:px-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-blue-600/5 sm:p-8">
          {/* Celebrating Mascot */}
          <div className="relative mx-auto -mt-12 mb-5 flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-3xl border-3 border-white bg-white p-1 shadow-lg shadow-blue-600/15 ring-4 ring-blue-50">
                <img
                  src={patoMascotCelebrating}
                  alt="Pato Mascot"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
                <Check size={14} weight="bold" />
              </div>
            </div>
          </div>

          {/* Room Code Box */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-center">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              KODE AKSES ROOM
            </span>
            <div className="mt-1 flex items-center justify-center">
              <p className="font-mono text-3xl font-black tracking-wider text-blue-600">
                {roomCode}
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Acara: <span className="font-bold text-slate-900">{title}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleWhatsapp}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              <WhatsappLogo size={22} weight="fill" />
              <span>Bagikan ke WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white font-bold text-slate-800 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <Copy
                size={20}
                weight={copied ? "fill" : "regular"}
                className={copied ? "text-emerald-600" : ""}
              />
              <span>{copied ? "Link Tersalin!" : "Salin Link Room"}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/room/${roomCode}`)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              <span>Buka Room Sekarang</span>
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
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
