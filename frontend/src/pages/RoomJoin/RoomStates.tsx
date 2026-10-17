import { ArrowLeft, Receipt } from "@phosphor-icons/react";
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
      <div className="relative min-h-dvh w-full overflow-x-hidden bg-slate-50/90 text-slate-900">
        {/* Ambient background glows (matches RoomJoin) */}
        <div className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 h-96 w-full max-w-2xl bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_70%)]" />
        <div className="pointer-events-none fixed top-48 -right-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none fixed top-96 -left-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

        {/* 1. NATIVE TOP NAVIGATION BAR SKELETON (Matches RoomHeader) */}
        <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto max-w-md sm:max-w-xl lg:max-w-3xl px-4 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-2.5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  aria-label="Kembali"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-2xs transition-all active:scale-90"
                >
                  <ArrowLeft size={16} weight="bold" />
                </button>
                <div className="min-w-0 space-y-1">
                  <div className="h-4 w-32 sm:w-44 rounded-md bg-slate-200 animate-pulse" />
                  <div className="h-3 w-24 sm:w-32 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>

              {/* Action Buttons Placeholder */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="h-8 w-8 rounded-full border border-slate-200/80 bg-slate-50 animate-pulse" />
                <div className="h-8 w-8 rounded-full border border-slate-200/80 bg-slate-50 animate-pulse" />
                <div className="h-8 w-8 rounded-full border border-slate-200/80 bg-slate-50 animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        {/* 2. MAIN APP CANVAS SKELETON */}
        <main className="relative z-10 mx-auto w-full max-w-md sm:max-w-xl lg:max-w-3xl flex-1 px-4 pt-3.5 pb-36 sm:px-6">
          {/* SKELETON 1: RoomHeroCard (Dining Pass Ticket) */}
          <div className="mb-3.5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-5 text-white shadow-[0_12px_36px_rgba(37,99,235,0.22)] border border-blue-400/30">
            {/* Ambient glows */}
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-indigo-400/25 blur-2xl" />
            <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />

            {/* Top row pills */}
            <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-6 w-24 rounded-full bg-white/20 backdrop-blur-md animate-pulse border border-white/20" />
                <div className="h-6 w-28 rounded-full bg-white/20 backdrop-blur-md animate-pulse border border-white/20" />
              </div>
              <div className="h-6 w-20 rounded-full bg-white/20 backdrop-blur-md animate-pulse border border-white/20" />
            </div>

            {/* Middle: Title & Meta */}
            <div className="relative z-10 mt-3.5 space-y-2">
              <div className="h-6 w-3/5 rounded-lg bg-white/30 backdrop-blur-md animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-16 rounded bg-white/20 animate-pulse" />
                <span className="text-white/40">·</span>
                <div className="h-3.5 w-20 rounded bg-white/20 animate-pulse" />
              </div>
            </div>

            {/* Grand Total Kasir Strip */}
            <div className="relative z-10 mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/10 backdrop-blur-md px-3.5 py-2.5 border border-white/15 shadow-2xs">
              <div className="h-3 w-16 rounded bg-white/20 animate-pulse" />
              <div className="h-6 w-28 rounded-lg bg-white/30 animate-pulse" />
            </div>

            {/* Bottom Quick Action Pills */}
            <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 flex items-center gap-2">
              <div className="h-8 w-28 rounded-full bg-white/15 backdrop-blur-md animate-pulse border border-white/20" />
              <div className="h-8 w-24 rounded-full bg-white/15 backdrop-blur-md animate-pulse border border-white/20" />
            </div>
          </div>

          {/* SKELETON 2: StepProgressCard */}
          <div className="mb-3.5 flex w-full items-center justify-between gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/60 shadow-2xs">
            <div className="flex-1 h-7 rounded-lg bg-white/90 shadow-2xs animate-pulse" />
            <div className="flex-1 h-7 rounded-lg bg-slate-200/50 animate-pulse" />
            <div className="flex-1 h-7 rounded-lg bg-slate-200/50 animate-pulse" />
          </div>

          {/* SKELETON 3: MemberList */}
          <div className="mb-3.5 flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
            <div className="h-8 w-11 shrink-0 rounded-full border border-slate-200/80 bg-white shadow-2xs animate-pulse" />
            <div className="h-8 w-24 shrink-0 rounded-full border border-slate-200/80 bg-white shadow-2xs animate-pulse" />
            <div className="h-8 w-28 shrink-0 rounded-full border border-slate-200/80 bg-white shadow-2xs animate-pulse" />
            <div className="h-8 w-20 shrink-0 rounded-full border border-slate-200/80 bg-white shadow-2xs animate-pulse" />
            <div className="h-8 w-26 shrink-0 rounded-full border border-slate-200/80 bg-white shadow-2xs animate-pulse" />
          </div>

          {/* SKELETON 4: ItemList Menu Cards */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 rounded-md bg-slate-200 animate-pulse" />
              <div className="h-3 w-28 rounded bg-slate-100 animate-pulse" />
            </div>

            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4.5 w-44 rounded-md bg-slate-200 animate-pulse" />
                  <div className="h-4.5 w-20 rounded-md bg-slate-200 animate-pulse" />
                </div>
                <div className="h-3 w-28 rounded bg-slate-100 animate-pulse" />
                <div className="h-2 w-full rounded-full bg-slate-100 animate-pulse" />
                <div className="flex items-center justify-between pt-1">
                  <div className="h-6 w-20 rounded-full bg-slate-100 animate-pulse" />
                  <div className="h-7 w-24 rounded-xl bg-blue-50 border border-blue-100/80 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* 3. STICKY BOTTOM DOCK SKELETON (Matches MobilePaymentDock) */}
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 pb-[calc(max(env(safe-area-inset-bottom,0px),0px)+0.75rem)] shadow-lg">
          <div className="mx-auto max-w-md sm:max-w-xl lg:max-w-3xl flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="h-2.5 w-16 rounded bg-slate-200 animate-pulse" />
              <div className="h-5 w-28 rounded bg-slate-300 animate-pulse" />
            </div>
            <div className="h-11 w-36 rounded-2xl bg-blue-600/30 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-slate-50/90 text-slate-900 flex flex-col">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 h-96 w-full max-w-2xl bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_70%)]" />
      <div className="pointer-events-none fixed top-48 -right-20 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />

      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-md sm:max-w-xl lg:max-w-3xl px-4 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              aria-label="Kembali ke Beranda"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-2xs transition-all active:scale-90 hover:bg-slate-100"
            >
              <ArrowLeft size={16} weight="bold" />
            </button>
            <div className="flex items-center gap-2">
              <img src={patoPlain} alt="PaTo" className="h-6 w-6 object-contain" />
              <span className="text-sm font-extrabold tracking-tight text-slate-900">PaTo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Not Found Container */}
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-98"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Kembali ke Beranda</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-98"
            >
              <span>Coba Muat Ulang</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
