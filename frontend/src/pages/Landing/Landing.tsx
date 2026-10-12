import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Camera,
  CurrencyCircleDollar,
  HandCoins,
  Plus,
  ShieldCheck,
  Ticket,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import wordmark from "../../assets/pato-withtext.png";
import patoPlain from "../../assets/pato.png";
import { FeatureList, type Feature } from "../../components/FeatureList";
import { FairMathShowcase } from "./sections/FairMathShowcase";
import { SocialImpact } from "./sections/SocialImpact";
import { LandingFooter } from "./sections/LandingFooter";

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Tanpa Simpan Rekening",
    body: "Tamu bisa klaim makanan tanpa daftar akun. Data sesi otomatis dibersihkan saat meja ditutup.",
  },
  {
    icon: Camera,
    title: "Scan Struk Cepat",
    body: "Nama item, kuantitas, subtotal, dan diskon promo langsung terdeteksi dalam hitungan detik.",
  },
  {
    icon: CurrencyCircleDollar,
    title: "Hitungan Proporsional",
    body: "Pajak dan service dihitung adil menurut nilai konsumsi asli tiap orang, bukan bagi rata buta.",
  },
  {
    icon: HandCoins,
    title: "20% Donasi Sosial",
    body: "Setiap apresiasi sukarela yang diberikan disisihkan 20% untuk bantuan tanggap bencana alam.",
  },
];

const STEPS = [
  {
    title: "Foto Struk Pembayaran",
    body: "Ambil foto struk dari kasir resto. Nama hidangan, porsi, dan diskon langsung terbaca otomatis.",
  },
  {
    title: "Klaim Porsi Masing-Masing",
    body: "Kirim link meja ke WhatsApp grup. Temanmu klik porsi yang dimakan, menu sharing terbagi rata.",
  },
  {
    title: "Satu Ketukan QRIS / Transfer",
    body: "Setiap teman melihat nominal bersih dengan tombol cepat salin rekening bank atau QRIS Host.",
  },
];

export function Landing() {
  const navigate = useNavigate();
  const [showJoin, setShowJoin] = useState(false);
  const [roomCode, setRoomCode] = useState("");

  function handleJoinRoom(e: FormEvent) {
    e.preventDefault();
    if (!roomCode.trim()) return;
    navigate(`/room/${roomCode.trim().toUpperCase()}`);
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-shell text-ink selection:bg-brand selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-hairline/60 bg-shell/90 px-4 backdrop-blur-md lg:mx-auto lg:h-[72px] lg:w-full lg:max-w-[1120px] lg:px-8">
        <img src={wordmark} alt="PaTo" className="block h-[32px] w-auto lg:h-[42px]" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex h-10 items-center justify-center rounded-full px-3.5 text-xs font-bold text-ink-soft transition-colors hover:text-ink active:bg-haze sm:px-4"
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => navigate("/login?mode=register")}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-3.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98] sm:px-4"
          >
            <Plus size={16} weight="bold" />
            <span className="hidden min-[380px]:inline">Buka Meja Baru</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* HERO */}
        <section className="px-4 pt-14 pb-16 sm:px-6 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:px-8 lg:pt-24 lg:pb-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* Left Content */}
            <div className="flex flex-col">
              <h1 className="text-[34px] leading-[1.15] font-bold tracking-tight text-ink sm:text-[42px] lg:text-[52px]">
                Bagi Tagihan Resto & Kafe Tanpa Ribet,{" "}
                <span className="text-brand">Adil Hingga Rupiah Terakhir.</span>
              </h1>

              <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-ink-soft sm:text-[16px]">
                Upload foto struk kasir, bagikan tautan room ke WhatsApp grup,
                dan biarkan teman pilih porsi masing-masing secara live.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/login?mode=register")}
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-brand px-7 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
                >
                  <Plus size={18} weight="bold" />
                  <span>Buka Room Baru</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoin((v) => !v)}
                  aria-expanded={showJoin}
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-hairline bg-white px-7 text-sm font-bold text-ink transition-all hover:bg-haze active:scale-[0.98]"
                >
                  <Ticket size={18} weight="bold" />
                  <span>Punya Kode Meja?</span>
                </button>
              </div>

              {showJoin && (
                <form
                  onSubmit={handleJoinRoom}
                  className="mt-4 flex w-full max-w-sm items-center gap-2"
                >
                  <input
                    type="text"
                    autoFocus
                    autoCapitalize="characters"
                    placeholder="Masukkan kode meja"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="h-12 min-w-0 flex-1 rounded-full border border-hairline bg-white px-5 font-mono text-sm font-bold tracking-wider text-ink uppercase placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Masuk ke meja"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
                  >
                    <ArrowRight size={18} weight="bold" />
                  </button>
                </form>
              )}
            </div>

            {/* Right Visual */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-8 -z-10 rounded-full bg-tint blur-3xl" />
              <div className="relative w-full max-w-[380px] overflow-hidden rounded-[32px] border border-hairline bg-white p-3 shadow-md lg:max-w-[420px]">
                <div className="overflow-hidden rounded-[24px] bg-tint">
                  <img
                    src={patoPlain}
                    alt="Simulasi Split Bill di HP"
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value propositions */}
        <section className="border-t border-hairline px-4 py-16 sm:px-6 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:px-8 lg:py-20">
          <h2 className="max-w-[20ch] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Kenapa pakai PaTo?
          </h2>
          <FeatureList features={FEATURES} className="mt-8 lg:mt-12" />
        </section>

        {/* How it works steps */}
        <section className="border-t border-hairline bg-haze/40 px-4 py-16 sm:px-6 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:px-8 lg:py-20">
          <h2 className="max-w-[22ch] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            3 langkah dari struk jadi nominal per orang.
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 lg:gap-10">
            {STEPS.map(({ title, body }, i) => (
              <div key={title} className="flex flex-col gap-3">
                <span className="font-mono text-sm font-bold text-brand">
                  0{i + 1}
                </span>
                <div className="h-px w-full bg-hairline-strong/60" />
                <h3 className="text-base font-bold text-ink">{title}</h3>
                <p className="text-[13px] leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <FairMathShowcase />
        <SocialImpact />

        {/* FINAL CONVERSION BANNER */}
        <section className="px-4 py-12 sm:px-6 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-brand px-6 py-10 text-center text-white sm:flex-row sm:px-10 sm:text-left">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Siap Nongkrong Tanpa Pusing Ngitung Struk?
              </h2>
              <p className="mt-1 text-sm text-blue-100">
                Buka room baru dalam 30 detik, bagikan ke temanmu sekarang.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login?mode=register")}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-brand shadow-sm transition-all hover:bg-blue-50 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={18} weight="bold" />
              <span>Buka Room Baru</span>
            </button>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
