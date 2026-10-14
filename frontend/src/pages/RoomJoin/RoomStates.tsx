import { ArrowLeft, CircleNotch, Receipt } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import patoPlain from "../../assets/pato.png";

interface RoomStatesProps {
  variant: "loading" | "notfound";
  message?: string;
}

export function RoomStates({ variant, message }: RoomStatesProps) {
  const navigate = useNavigate();

  if (variant === "loading") {
    return (
      <div className="flex min-h-dvh w-full flex-col bg-slate-100/70">
        {/* Top Header Placeholder (Matches RoomHeader styling) */}
        <header className="sticky top-0 z-30 w-full bg-blue-600 shadow-xs">
          <div className="mx-auto max-w-2xl px-4 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  aria-label="Kembali"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform active:scale-90 hover:bg-white/30"
                >
                  <ArrowLeft size={16} weight="bold" />
                </button>
                <div className="flex items-center gap-2">
                  <img src={patoPlain} alt="PaTo" className="h-5 w-5 object-contain" />
                  <span className="text-sm font-extrabold tracking-tight text-white">PaTo</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-blue-500/50 px-2.5 py-1 text-[11px] font-semibold text-blue-100">
                <CircleNotch size={13} className="animate-spin text-white" />
                <span>Menghubungkan...</span>
              </div>
            </div>
          </div>
        </header>

        {/* Skeleton Canvas */}
        <main className="mx-auto w-full max-w-md sm:max-w-xl lg:max-w-3xl flex-1 px-4 pt-4 pb-20 sm:px-6">
          {/* Card 1: Header / Status shimmer */}
          <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-36 animate-pulse rounded-md bg-slate-200" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-blue-100" />
            </div>
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100 mb-4" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>

          {/* Card 2: Participants Shimmer */}
          <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200 mb-3" />
            <div className="flex gap-2">
              <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
              <div className="h-7 w-16 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>

          {/* Card 3: Items List Shimmer */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200 mb-2" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-slate-50 border border-slate-100" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-slate-50 border border-slate-100" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-slate-50 border border-slate-100" />
          </div>

          {/* Animated Centered Spinner Badge */}
          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center text-slate-500">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-2xs ring-4 ring-blue-50/50">
              <CircleNotch size={20} className="animate-spin text-blue-600" />
            </div>
            <p className="text-xs font-bold text-slate-700">Menyiapkan Meja Patungan</p>
            <p className="text-[11px] text-slate-400">Sinkronisasi pesanan & porsi...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-slate-100/70">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full bg-blue-600 shadow-xs">
        <div className="mx-auto max-w-2xl px-4 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              aria-label="Kembali ke Beranda"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform active:scale-90 hover:bg-white/30"
            >
              <ArrowLeft size={16} weight="bold" />
            </button>
            <div className="flex items-center gap-2">
              <img src={patoPlain} alt="PaTo" className="h-5 w-5 object-contain" />
              <span className="text-sm font-extrabold tracking-tight text-white">PaTo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Not Found Container */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/60 shadow-2xs mb-4">
            <Receipt size={32} weight="duotone" />
          </span>
          <h1 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            Meja Tidak Ditemukan
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
            {message ?? "Kode meja salah atau sudah kedaluwarsa/dihapus oleh host. Pastikan kode sudah sesuai atau hubungi host pembuat room."}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-98"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Kembali ke Beranda</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-98"
            >
              <span>Coba Muat Ulang</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

