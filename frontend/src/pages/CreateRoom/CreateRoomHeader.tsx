import { ArrowLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import patoMascotHelper from "../../assets/pato_mascot_helper.jpg";

interface CreateRoomHeaderProps {
  hasQris: boolean;
}

export function CreateRoomHeader({ hasQris }: CreateRoomHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="relative w-full overflow-hidden rounded-b-[40px] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-5 pt-[calc(max(env(safe-area-inset-top,0px),0px)+1.5rem)] pb-20 sm:rounded-b-[54px] sm:px-8 sm:pt-9 sm:pb-24 lg:rounded-b-[64px] lg:px-12 lg:pt-11 lg:pb-28">
      {/* Ambient animated glow orbs */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/15 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-float-reverse" />

      <div className="relative z-10 mx-auto max-w-[1120px]">
        {/* Top bar with back button */}
        <div className="mb-3.5 flex items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="flex h-10 w-10 shrink-0 aspect-square items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-90"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
        </div>

        {/* Hero content: Title, Tip & Mascot */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 max-w-[560px] animate-fade-up">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              Buat Room Baru
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-blue-100/90 sm:text-sm">
              {hasQris
                ? "Foto QRIS sudah terpasang. Teman-teman bisa langsung scan dari galeri m-banking saat tagihan siap!"
                : "Unggah foto QRIS kamu agar teman-teman bisa langsung scan dari galeri m-banking tanpa repot catat nomor rekening."}
            </p>
          </div>

          {/* Pato Mascot Avatar */}
          <div className="shrink-0 animate-fade-up stagger-1">
            <div className="relative h-20 w-20 overflow-hidden rounded-3xl border-2 border-white/60 bg-white p-1.5 shadow-lg shadow-blue-900/20 ring-4 ring-white/20 sm:h-24 sm:w-24 sm:rounded-[28px]">
              <img
                src={patoMascotHelper}
                alt="Pato Mascot"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
