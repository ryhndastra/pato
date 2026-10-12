import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  LockKey,
  User,
} from "@phosphor-icons/react";
import wordmark from "../../assets/pato-withtext.png";
import authFriendsCafe from "../../assets/auth_friends_cafe.jpg";
import { GoogleSignInButton } from "./GoogleSignInButton";
import type { AuthViewProps } from "./types";

export function DesktopLogin({
  isRegister,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
  setError,
  submitting,
  setMode,
  handleSubmit,
  handleGoogleSuccess,
  onBack,
}: AuthViewProps) {
  return (
    <div className="relative flex h-screen max-h-screen w-full items-center justify-center overflow-hidden bg-[#f8fafc] px-6 lg:px-12 xl:px-16 text-ink selection:bg-brand selection:text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-50/90 blur-3xl" />

      {/* Split container */}
      <div className="relative z-10 grid h-[740px] xl:h-[780px] max-h-[94vh] w-full max-w-[1280px] xl:max-w-[1360px] 2xl:max-w-[1400px] grid-cols-[1fr_1.1fr] overflow-hidden rounded-[40px] border border-hairline bg-white shadow-[0_28px_60px_-15px_rgba(15,23,42,0.1),0_4px_20px_-4px_rgba(37,99,235,0.06)]">
        {/* Brand showcase */}
        <aside className="relative flex h-full flex-col justify-between overflow-hidden bg-brand p-12 xl:p-14 text-white">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-28 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

          {/* Back navigation */}
          <div className="relative z-10">
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
            >
              <ArrowLeft
                size={16}
                weight="bold"
                className="transition-transform group-hover:-translate-x-0.5"
              />
              <span>Kembali ke Beranda</span>
            </button>
          </div>

          {/* Main content */}
          <div className="relative z-10 my-auto py-2">
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white">
              {isRegister
                ? "Bikin meja baru, pantau pembayaran lebih tenang."
                : "Balik lagi buat lanjutin meja kamu."}
            </h2>
            <p className="mt-3 text-sm xl:text-base leading-relaxed text-white/85">
              Semua riwayat room, bukti transfer, dan rekap belanja tersimpan
              rapi di satu akun.
            </p>

            {/* Photo illustration */}
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl">
              <img
                src={authFriendsCafe}
                alt="Teman Nongkrong Santai"
                className="h-[220px] xl:h-[250px] w-full object-contain p-2"
              />
            </div>

            {/* Features list */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-white/95">
                <CheckCircle size={20} weight="fill" className="shrink-0 text-white" />
                <span>Hitungan otomatis adil hingga ke pecahan desimal</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/95">
                <CheckCircle size={20} weight="fill" className="shrink-0 text-white" />
                <span>Tamu bayar via QRIS tanpa wajib download aplikasi</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/95">
                <CheckCircle size={20} weight="fill" className="shrink-0 text-white" />
                <span>Riwayat nota belanja & mutasi tersimpan rapi</span>
              </div>
            </div>
          </div>

          {/* Footer text */}
          <div className="relative z-10">
            <p className="text-xs text-white/60">
              PaTo • Pay Together — Hangout seru tanpa drama patungan.
            </p>
          </div>
        </aside>

        {/* Form column */}
        <main className="flex h-full flex-col justify-between bg-white p-12 xl:p-14">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <img
              src={wordmark}
              alt="PaTo"
              className="h-8 w-auto object-contain"
            />
            <div className="flex items-center gap-2 text-xs xl:text-sm text-ink-soft">
              <span>{isRegister ? "Sudah punya akun?" : "Belum punya akun?"}</span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode(isRegister ? "login" : "register");
                }}
                className="font-bold text-brand transition-colors hover:underline"
              >
                {isRegister ? "Masuk ke Akun" : "Daftar Akun Host"}
              </button>
            </div>
          </div>

          {/* Form section */}
          <div className="my-auto mx-auto w-full max-w-[460px] xl:max-w-[480px] py-2">
            <h1 className="text-3xl xl:text-[34px] font-bold tracking-tight text-ink">
              {isRegister ? "Buat Akun Host Meja" : "Masuk ke Akun Kamu"}
            </h1>
            <p className="mt-2 text-sm xl:text-base text-ink-soft">
              {isRegister
                ? "Kelola tagihan resto dan pantau siapa saja yang sudah bayar."
                : "Masukkan email dan kata sandi yang telah terdaftar."}
            </p>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isRegister && (
                <div>
                  <label
                    htmlFor="desktop-user-name"
                    className="block pb-1.5 text-xs xl:text-sm font-semibold text-ink-soft"
                  >
                    Nama Lengkap / Panggilan
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted">
                      <User size={20} />
                    </div>
                    <input
                      id="desktop-user-name"
                      type="text"
                      required
                      placeholder="Contoh: Reyhan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-[52px] w-full rounded-2xl border border-hairline bg-shell pl-11 pr-4 text-sm xl:text-base text-ink placeholder:text-ink-muted transition-all focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="desktop-user-email"
                  className="block pb-1.5 text-xs xl:text-sm font-semibold text-ink-soft"
                >
                  Alamat Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted">
                    <EnvelopeSimple size={20} />
                  </div>
                  <input
                    id="desktop-user-email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-[52px] w-full rounded-2xl border border-hairline bg-shell pl-11 pr-4 text-sm xl:text-base text-ink placeholder:text-ink-muted transition-all focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="desktop-user-password"
                  className="block pb-1.5 text-xs xl:text-sm font-semibold text-ink-soft"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted">
                    <LockKey size={20} />
                  </div>
                  <input
                    id="desktop-user-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-[52px] w-full rounded-2xl border border-hairline bg-shell pl-11 pr-12 text-sm xl:text-base text-ink placeholder:text-ink-muted transition-all focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-muted transition-colors hover:text-ink"
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-sm xl:text-base font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? "Memproses..."
                    : isRegister
                    ? "Daftar Akun Host"
                    : "Masuk Sekarang"}
                </span>
                <ArrowRight size={18} weight="bold" />
              </button>
            </form>

            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-hairline" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-semibold uppercase text-ink-muted">
                atau lanjutkan dengan
              </span>
            </div>

            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              isRegister={isRegister}
            />

            <p className="mt-5 text-center text-xs text-ink-muted">
              Dengan melanjutkan, kamu menyetujui Ketentuan Layanan PaTo.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-ink-muted">
            © 2026 PaTo. Pay Together. All rights reserved.
          </div>
        </main>
      </div>
    </div>
  );
}
