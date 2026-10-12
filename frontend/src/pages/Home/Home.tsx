import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  HandCoins,
  Lock,
  Plus,
  Receipt,
  Ticket,
  UsersThree,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import mascot from "../../assets/pato_mascot.jpg";
import wordmark from "../../assets/pato-withtext.png";

const VALUE_PROPS = [
  {
    icon: UsersThree,
    title: "Tanpa Install & Login",
    body: "Teman tinggal buka link dari WhatsApp, isi nama, langsung ikut klaim.",
  },
  {
    icon: Receipt,
    title: "Hitung Pajak Otomatis",
    body: "Pajak, service, dan diskon dibagi sesuai porsi makan masing-masing.",
  },
  {
    icon: Lock,
    title: "Transparan dari Struk Asli",
    body: "Foto struk kasir bisa dilihat semua orang di room, gak ada yang ditutupi.",
  },
];

export function Home() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleJoin(event: FormEvent) {
    event.preventDefault();
    // room join handled by router once wired up
  }

  function handleCreateRoom() {
    if (!user) {
      navigate("/login", { state: { from: "/create" } });
      return;
    }
    navigate("/create");
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-shell">
      <header className="flex items-center justify-between px-5 pt-[18px] pb-2 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:px-12 lg:pt-7 lg:pb-3">
        <img src={wordmark} alt="PaTo" className="block h-[18px] w-auto lg:h-6" />
        <div className="flex items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={logout}
              aria-label={`Keluar dari akun ${user.name}`}
              title="Keluar"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-tint text-xs font-bold text-brand active:bg-brand-soft active:text-white lg:h-8 lg:w-8"
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          )}
          <button
            type="button"
            className="rounded-full bg-haze px-3 py-1.5 text-xs font-bold tracking-wide text-ink-soft active:bg-hairline lg:px-4 lg:py-2 lg:text-[13px]"
          >
            ID
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center px-6 pt-3 pb-8 text-center lg:mx-auto lg:w-full lg:max-w-[1120px] lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-16 lg:px-12 lg:pt-[72px] lg:pb-24 lg:text-left">
          {/* Mascot badge: a plain white disc sits behind the duck so its
              own white matte never shows up as a seam against the glow. */}
          <div className="relative mb-[22px] flex h-[180px] w-[180px] items-center justify-center lg:order-2 lg:mb-0 lg:h-[420px] lg:w-full lg:justify-self-end">
            <div
              aria-hidden="true"
              className="absolute inset-0 m-auto h-[180px] w-[180px] rounded-full bg-[radial-gradient(circle_at_38%_32%,rgba(96,165,250,0.30),rgba(96,165,250,0)_68%)] lg:h-[380px] lg:w-[380px]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 m-auto h-[150px] w-[150px] rounded-full bg-shell shadow-[0_12px_28px_-8px_rgba(37,99,235,0.28),0_4px_10px_-2px_rgba(15,23,42,0.06)] lg:h-[300px] lg:w-[300px]"
            />
            <img
              src={mascot}
              alt=""
              className="relative h-[94px] w-[94px] -rotate-[4deg] object-contain motion-safe:animate-fade-up lg:h-[188px] lg:w-[188px]"
            />
          </div>

          <div className="flex w-full flex-col items-center lg:order-1 lg:w-auto lg:items-start">
            <h1 className="mb-[10px] max-w-[22ch] text-[28px] leading-[1.2] font-bold tracking-[-0.02em] text-ink motion-safe:animate-fade-up lg:mb-4 lg:max-w-[14ch] lg:text-[48px]">
              Bagi Tagihan Tanpa Ribet.
            </h1>
            <p className="mb-6 max-w-[34ch] text-[15px] leading-[1.55] text-ink-soft motion-safe:animate-fade-up [animation-delay:110ms] lg:mb-8 lg:max-w-[42ch] lg:text-[17px]">
              Split bill bareng teman, pajak dan diskon kehitung otomatis
              sesuai porsi makan masing-masing.
            </p>

            <div className="flex w-full flex-col gap-2.5 motion-safe:animate-fade-up [animation-delay:160ms] lg:w-auto lg:flex-row lg:flex-wrap lg:items-start">
              <button
                type="button"
                onClick={handleCreateRoom}
                className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_2px_4px_rgba(37,99,235,0.15)] lg:w-auto lg:px-7"
              >
                <Plus size={20} weight="bold" />
                Buat Room Baru
              </button>

              {!joinOpen && (
                <button
                  type="button"
                  onClick={() => setJoinOpen(true)}
                  className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-shell text-[15px] font-bold text-ink active:bg-canvas lg:w-auto lg:px-7"
                >
                  <Ticket size={20} weight="regular" />
                  Punya Kode Room?
                </button>
              )}

              {joinOpen && (
                <form
                  onSubmit={handleJoin}
                  className="flex w-full flex-col gap-1.5 text-left motion-safe:animate-fade-up-fast lg:basis-full"
                >
                  <label
                    htmlFor="room-code"
                    className="pl-0.5 text-[13px] font-semibold text-ink-soft"
                  >
                    Kode Room
                  </label>
                  <div className="flex gap-2 lg:max-w-[420px]">
                    <input
                      id="room-code"
                      name="room-code"
                      type="text"
                      inputMode="text"
                      autoCapitalize="characters"
                      placeholder="Contoh: SUSHITEI-492"
                      value={roomCode}
                      onChange={(e) =>
                        setRoomCode(e.target.value.toUpperCase())
                      }
                      className="h-[52px] flex-1 rounded-xl border border-hairline bg-shell px-4 font-mono text-[15px] tracking-wide text-ink uppercase placeholder:font-sans placeholder:text-ink-muted placeholder:tracking-normal placeholder:normal-case focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      aria-label="Gabung room"
                      disabled={roomCode.trim().length === 0}
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-brand text-white disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      <ArrowRight size={20} weight="bold" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        <section
          aria-label="Kenapa pakai PaTo"
          className="flex flex-col px-6 pt-1 pb-2 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:flex-row lg:gap-10 lg:border-t lg:border-hairline lg:px-12 lg:pt-14 lg:pb-20"
        >
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex items-start gap-3.5 py-4 [&+&]:border-t [&+&]:border-hairline lg:flex-1 lg:flex-col lg:items-start lg:gap-4 lg:py-0 lg:[&+&]:border-t-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-tint text-brand lg:h-11 lg:w-11">
                <Icon size={22} weight="regular" />
              </span>
              <div>
                <p className="mb-0.5 text-sm font-bold text-ink lg:text-[15px]">
                  {title}
                </p>
                <p className="text-[13px] leading-relaxed text-ink-soft lg:max-w-[32ch] lg:text-sm">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-auto flex items-start gap-2 border-t border-hairline px-6 pt-4 pb-7 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:items-center lg:px-12 lg:pt-6 lg:pb-10">
          <HandCoins size={18} weight="regular" className="mt-px shrink-0 text-ink-muted" />
          <p className="text-xs leading-relaxed text-ink-muted">
            20% dari setiap tip yang kamu kasih dialokasikan untuk bantuan
            korban bencana alam.
          </p>
        </footer>
      </main>
    </div>
  );
}
