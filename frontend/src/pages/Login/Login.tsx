import { useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  ShieldCheck,
  Stack,
} from "@phosphor-icons/react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { useGoogleButton } from "../../auth/useGoogleButton";
import { ApiError } from "../../lib/api";
import mascot from "../../assets/pato_mascot.jpg";
import wordmark from "../../assets/pato-withtext.png";

type Mode = "login" | "register";

const PANEL_POINTS = [
  { icon: Stack, label: "Semua room yang kamu bikin tersimpan rapi." },
  { icon: ShieldCheck, label: "Cuma kamu yang bisa buka dashboard Host." },
  { icon: ArrowsClockwise, label: "Lanjut dari HP atau laptop, sama aja." },
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const isRegister = mode === "register";

  function goAfterLogin() {
    navigate(from, { replace: true });
  }

  function errorMessage(err: unknown) {
    return err instanceof ApiError ? err.message : "Gagal terhubung ke server.";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await registerWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      goAfterLogin();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleConfigured = useGoogleButton(
    googleButtonRef,
    async (idToken) => {
      setError(null);
      setSubmitting(true);
      try {
        await loginWithGoogle(idToken);
        goAfterLogin();
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    isRegister ? "signup_with" : "continue_with",
  );

  return (
    <div className="flex min-h-dvh w-full flex-col bg-shell lg:flex-row">
      {/* Brand panel - desktop only, mirrors Home's recurring glow+mascot motif */}
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(165deg,#f8fafc_0%,#eef4fb_55%,#e2edfa_100%)] lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:px-14 lg:py-14">
        <img
          src={wordmark}
          alt="PaTo"
          className="relative z-10 h-8 w-auto object-contain object-left"
        />

        <div className="relative z-10 max-w-[30ch]">
          <h2 className="mb-7 text-[34px] leading-[1.2] font-bold tracking-[-0.02em] text-ink">
            Satu akun, semua room gampang dibuka lagi.
          </h2>
          <ul className="flex flex-col gap-4">
            {PANEL_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-tint text-brand">
                  <Icon size={18} weight="regular" />
                </span>
                <span className="pt-1.5 text-sm leading-relaxed text-ink-soft">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex h-[180px] w-[180px] items-center justify-center self-end">
          <div
            aria-hidden="true"
            className="absolute inset-0 m-auto h-[180px] w-[180px] rounded-full bg-[radial-gradient(circle_at_38%_32%,rgba(96,165,250,0.30),rgba(96,165,250,0)_68%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 m-auto h-[150px] w-[150px] rounded-full bg-shell shadow-[0_12px_28px_-8px_rgba(37,99,235,0.28),0_4px_10px_-2px_rgba(15,23,42,0.06)]"
          />
          <img
            src={mascot}
            alt=""
            className="relative h-[94px] w-[94px] -rotate-[4deg] object-contain"
          />
        </div>
      </aside>

      {/* Form column */}
      <div className="relative flex w-full flex-1 flex-col lg:w-[58%]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="absolute top-[18px] left-5 flex h-9 w-9 items-center justify-center rounded-full bg-haze text-ink active:bg-hairline lg:top-10 lg:left-12"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 lg:px-12">
          <div className="flex w-full max-w-[380px] flex-col items-center text-center">
            <img
              src={wordmark}
              alt="PaTo"
              className="mb-6 h-9 w-auto object-contain lg:hidden"
            />

            <h1 className="mb-2 max-w-[22ch] text-[22px] leading-[1.25] font-bold tracking-[-0.01em] text-ink lg:text-left lg:text-2xl">
              {isRegister ? "Daftar jadi Host baru" : "Masuk ke akun Host"}
            </h1>
            <p className="mb-6 max-w-[32ch] text-sm leading-relaxed text-ink-soft lg:max-w-none lg:text-left">
              Biar room yang kamu bikin tersimpan rapi dan gampang dibuka lagi
              kapan pun.
            </p>

            <div className="mb-6 flex w-full rounded-full bg-haze p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                  !isRegister ? "bg-shell text-ink shadow-sm" : "text-ink-soft"
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                  isRegister ? "bg-shell text-ink shadow-sm" : "text-ink-soft"
                }`}
              >
                Daftar
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-4 text-left"
            >
              {isRegister && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="name"
                    className="pl-0.5 text-[13px] font-semibold text-ink-soft"
                  >
                    Nama
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Nama kamu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-[52px] rounded-xl border border-hairline bg-shell px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="pl-0.5 text-[13px] font-semibold text-ink-soft"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[52px] rounded-xl border border-hairline bg-shell px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="pl-0.5 text-[13px] font-semibold text-ink-soft"
                  >
                    Kata Sandi
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      className="pr-0.5 text-[13px] font-semibold text-brand"
                    >
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-[52px] w-full rounded-xl border border-hairline bg-shell px-4 pr-12 text-[15px] text-ink placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                    }
                    className="absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-ink-muted"
                  >
                    {showPassword ? (
                      <EyeSlash size={20} weight="regular" />
                    ) : (
                      <Eye size={20} weight="regular" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-danger-bg px-4 py-3 text-[13px] font-semibold text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 flex h-[52px] w-full items-center justify-center rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_2px_4px_rgba(37,99,235,0.15)] disabled:bg-brand-soft"
              >
                {submitting
                  ? "Memproses..."
                  : isRegister
                    ? "Daftar Sekarang"
                    : "Masuk"}
              </button>
            </form>

            <div className="my-6 flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-hairline" />
              <span className="text-xs font-semibold text-ink-muted">
                atau
              </span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            {googleConfigured ? (
              <div
                ref={googleButtonRef}
                className={`flex w-full justify-center ${submitting ? "pointer-events-none opacity-50" : ""}`}
              />
            ) : (
              <p className="text-center text-[13px] text-ink-muted">
                Google sign-in belum dikonfigurasi di server.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
