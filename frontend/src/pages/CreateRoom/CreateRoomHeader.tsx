import { ArrowLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import patoLogo from "../../assets/pato.png";

interface CreateRoomHeaderProps {
  hasQris: boolean;
}

export function CreateRoomHeader({ hasQris }: CreateRoomHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="relative w-full overflow-hidden rounded-b-[40px] bg-linear-to-br from-blue-700 via-blue-600 to-blue-500 px-5 pt-[calc(max(env(safe-area-inset-top,0px),0px)+1.5rem)] pb-20 sm:rounded-b-[54px] sm:px-8 sm:pt-9 sm:pb-24 lg:rounded-b-[64px] lg:px-12 lg:pt-11 lg:pb-28">
      <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/15 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-float-reverse" />

      <div className="relative z-10 mx-auto max-w-280">
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

        {/* Hero content: Title, Tip & Brand Badge */}
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

          {/* PaTo Brand Badge */}
          <div className="shrink-0 animate-fade-up stagger-1">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-white/40 bg-white/20 p-2.5 shadow-lg shadow-blue-950/20 backdrop-blur-md ring-4 ring-white/10 sm:h-20 sm:w-20">
              <img
                src={patoLogo}
                alt="PaTo Logo"
                className="h-full w-full object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
