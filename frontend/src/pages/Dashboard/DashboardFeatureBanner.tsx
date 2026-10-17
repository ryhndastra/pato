import { ArrowUpRight, Sparkle } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import patoLogo from "../../assets/pato.png";

export function DashboardFeatureBanner() {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-5 text-white shadow-md sm:p-7 animate-fade-up stagger-3">
      {/* Subtle ambient lighting orbs */}
      <div className="pointer-events-none absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-white/15 blur-2xl animate-float-slow" />
      <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-indigo-400/20 blur-2xl animate-float-reverse" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left Column: Headline & Value Prop */}
        <div className="max-w-[480px]">
          <h2 className="text-lg font-black tracking-tight sm:text-2xl">
            0% Nombok, Tagihan Terbagi Adil
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-blue-100/90 sm:text-sm">
            Pajak resto (PB1) dan promo kasir otomatis dihitung proporsional sesuai pesanan masing-masing, bukan dipukul rata.
          </p>

          <button
            type="button"
            onClick={() => navigate("/create")}
            className="group mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-50 active:scale-95"
          >
            <span>Buat Room Baru</span>
            <ArrowUpRight size={13} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Right Column: Clean Native PaTo Card */}
        <div className="relative shrink-0 hidden sm:flex">
          <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-3xl border border-white/30 bg-white/15 p-3 backdrop-blur-md shadow-lg shadow-blue-950/20 ring-4 ring-white/10 sm:h-28 sm:w-28">
            <img
              src={patoLogo}
              alt="PaTo Logo"
              className="h-12 w-12 object-contain drop-shadow-sm sm:h-14 sm:w-14"
            />
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
              <Sparkle size={10} weight="fill" />
              <span>Split Adil</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

