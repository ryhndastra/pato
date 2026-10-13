import {
  ArrowLeft,
  ArrowRight,
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

export function MobileLogin({
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
    <div className="flex min-h-dvh w-full flex-col justify-between overflow-x-hidden overflow-y-auto bg-white text-ink selection:bg-brand selection:text-white">
      {/* Header and illustration */}
      <div className="flex w-full flex-1 shrink-0 flex-col items-center justify-between px-5 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-4 sm:px-8">
        {/* Navigation bar */}
        <div className="flex w-full max-w-[420px] items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke Beranda"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-white text-ink transition-colors hover:bg-haze active:scale-[0.98]"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>

          <img src={wordmark} alt="PaTo" className="h-6 w-auto object-contain" />

          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode(isRegister ? "login" : "register");
            }}
            className="text-xs font-bold text-brand transition-colors hover:underline"
          >
            {isRegister ? "Masuk" : "Daftar"}
          </button>
        </div>

        {/* Illustration */}
        <div className="relative mx-auto my-auto w-full max-w-[260px] py-2">
          <div className="absolute inset-2 -z-10 rounded-full bg-tint blur-xl" />
          <div className="overflow-hidden rounded-[28px] border border-hairline bg-white shadow-sm">
            <img
              src={authFriendsCafe}
              alt="Teman Nongkrong Santai"
              className="h-[175px] w-full object-contain p-1"
            />
          </div>
        </div>

        {/* Headings */}
        <div className="pb-2 text-center">
          <h1 className="text-center text-[22px] font-bold tracking-tight text-ink sm:text-2xl">
            {isRegister ? "Buat Akun Host Meja" : "Masuk ke Akun Kamu"}
          </h1>
          <p className="mt-1 max-w-[320px] text-center text-xs text-ink-soft sm:text-sm">
            {isRegister
              ? "Kelola tagihan resto dan pantau siapa saja yang sudah bayar."
              : "Masukkan email dan kata sandi yang telah terdaftar."}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="w-full shrink-0 rounded-t-[36px] bg-brand px-6 pt-6 pb-7 shadow-[0_-8px_30px_rgba(37,99,235,0.18)] sm:px-8 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-[420px]">
          {error && (
            <div className="mb-3.5 rounded-2xl bg-white p-3 text-xs font-semibold text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label
                  htmlFor="mobile-user-name"
                  className="block pb-1 text-xs font-semibold text-white/90"
                >
                  Nama Lengkap / Panggilan
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted">
                    <User size={18} />
                  </div>
                  <input
                    id="mobile-user-name"
                    type="text"
                    required
                    placeholder="Contoh: Reyhan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-transparent bg-white pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted focus:border-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="mobile-user-email"
                className="block pb-1 text-xs font-semibold text-white/90"
              >
                Alamat Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted">
                  <EnvelopeSimple size={18} />
                </div>
                <input
                  id="mobile-user-email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-transparent bg-white pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mobile-user-password"
                className="block pb-1 text-xs font-semibold text-white/90"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted">
                  <LockKey size={18} />
                </div>
                <input
                  id="mobile-user-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-transparent bg-white pl-10 pr-11 text-sm text-ink placeholder:text-ink-muted focus:border-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-muted transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-brand shadow-sm transition-all hover:bg-blue-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <span className="relative bg-brand px-3 text-[11px] font-semibold uppercase text-white/75">
              atau lanjutkan dengan
            </span>
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            isRegister={isRegister}
            themeOnDark
          />

          <p className="mt-4 text-center text-[11px] text-white/65">
            Dengan melanjutkan, kamu menyetujui Ketentuan Layanan PaTo.
          </p>
        </div>
      </div>
    </div>
  );
}
