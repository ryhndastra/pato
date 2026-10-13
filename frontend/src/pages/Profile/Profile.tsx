import { useState } from "react";
import {
  Bank,
  BellRinging,
  Check,
  CheckCircle,
  Copy,
  CurrencyCircleDollar,
  FloppyDisk,
  Heart,
  PencilSimple,
  ShieldCheck,
  SignOut,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { useMyRooms } from "../Dashboard/useMyRooms";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { formatIDR } from "../../lib/format";
import mascotHelper from "../../assets/pato_mascot_helper.jpg";

const PAYOUT_STORAGE_KEY = "pato_default_payout_info";
const PREFS_STORAGE_KEY = "pato_user_app_preferences";

const BANK_OPTIONS = [
  "BCA",
  "Bank Mandiri",
  "BRI",
  "BNI",
  "Bank Jago",
  "SeaBank",
  "BCA Digital (blu)",
  "GoPay",
  "OVO",
  "DANA",
];

export function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const { rooms } = useMyRooms(token);
  const { copied, copy } = useCopyToClipboard();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [payoutSaved, setPayoutSaved] = useState(false);

  // Default Payout State
  const [bankName, setBankName] = useState(() => {
    try {
      const saved = localStorage.getItem(PAYOUT_STORAGE_KEY);
      if (saved) return JSON.parse(saved).bankName ?? "BCA";
    } catch {
      // fallback
    }
    return "BCA";
  });

  const [accountNo, setAccountNo] = useState(() => {
    try {
      const saved = localStorage.getItem(PAYOUT_STORAGE_KEY);
      if (saved) return JSON.parse(saved).accountNo ?? "8820192811";
    } catch {
      // fallback
    }
    return "8820192811";
  });

  const [accountName, setAccountName] = useState(() => {
    try {
      const saved = localStorage.getItem(PAYOUT_STORAGE_KEY);
      if (saved) return JSON.parse(saved).accountName ?? (user?.name ?? "Host Patungan");
    } catch {
      // fallback
    }
    return user?.name ?? "Host Patungan";
  });

  // App Preferences State
  const [roundMode, setRoundMode] = useState<"none" | "hundred" | "thousand">(() => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) return JSON.parse(saved).roundMode ?? "hundred";
    } catch {
      // fallback
    }
    return "hundred";
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) return JSON.parse(saved).soundEnabled ?? true;
    } catch {
      // fallback
    }
    return true;
  });

  // Computed Room Stats
  const totalRooms = rooms?.length ?? 0;
  const closedRooms = rooms?.filter((r) => r.status === "CLOSED").length ?? 0;
  const activeRooms = Math.max(0, totalRooms - closedRooms);
  const totalSettledMoney =
    rooms
      ?.filter((r) => r.status === "CLOSED")
      .reduce((sum, r) => sum + r.grand_total, 0) ?? 0;

  function handleSavePayout(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem(
        PAYOUT_STORAGE_KEY,
        JSON.stringify({ bankName, accountNo, accountName }),
      );
      setPayoutSaved(true);
      setIsEditingPayout(false);
      setTimeout(() => setPayoutSaved(false), 2500);
    } catch {
      // ignore
    }
  }

  function handleUpdateRoundMode(mode: "none" | "hundred" | "thousand") {
    setRoundMode(mode);
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      const prev = saved ? JSON.parse(saved) : {};
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({ ...prev, roundMode: mode }),
      );
    } catch {
      // ignore
    }
  }

  function handleToggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      const prev = saved ? JSON.parse(saved) : {};
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({ ...prev, soundEnabled: next }),
      );
    } catch {
      // ignore
    }
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  const displayName = user?.name ?? "Host Patungan";
  const userEmail = user?.email ?? "host@pato.id";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-1 flex-col gap-6 pb-20 sm:gap-7 sm:pb-24 lg:gap-8 bg-slate-50/60 min-h-dvh">
      {/* 1. Curved Gradient Header (EXACT MATCH to DashboardHero) */}
      <div className="relative w-full">
        <div className="relative overflow-hidden rounded-b-[44px] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-5 pt-12 pb-24 sm:rounded-b-[56px] sm:px-8 sm:pt-16 sm:pb-32 lg:rounded-b-[68px] lg:px-12 lg:pt-20 lg:pb-38">
          {/* Ambient glow orbs */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/80 sm:text-sm lg:text-base">
                Profil Akun Kamu
              </p>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-white capitalize sm:text-3xl lg:text-4xl">
                {displayName}
              </h1>
            </div>

            {/* Profile Avatar matching Dashboard */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white/80 bg-white/20 text-sm font-bold text-white shadow-lg sm:h-14 sm:w-14 lg:h-16 lg:w-16">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
          </div>
        </div>

        {/* 2. Floating Overlapping Card (EXACT MATCH to Dashboard floating layout) */}
        <div className="relative z-10 mx-auto -mt-12 w-full max-w-[1120px] px-4 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_16px_40px_rgba(37,99,235,0.09)] sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 sm:text-base">
                    {displayName}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                    <ShieldCheck size={12} weight="fill" className="text-emerald-600" />
                    <span>Host Terverifikasi</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{userEmail}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex h-9 items-center gap-1.5 self-start sm:self-auto rounded-xl bg-rose-50 px-3.5 text-xs font-bold text-rose-600 hover:bg-rose-100 active:scale-95 transition-all"
              >
                <SignOut size={14} weight="bold" />
                <span>Keluar Akun</span>
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="mt-3.5 grid grid-cols-3 divide-x divide-slate-100 text-center">
              <div className="px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">
                  Total Meja
                </span>
                <p className="mt-0.5 font-mono text-base font-black text-slate-900 sm:text-xl">
                  {totalRooms}
                </p>
              </div>

              <div className="px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">
                  Meja Aktif
                </span>
                <p className="mt-0.5 font-mono text-base font-black text-blue-600 sm:text-xl">
                  {activeRooms}
                </p>
              </div>

              <div className="px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">
                  Selesai Lunas
                </span>
                <p className="mt-0.5 font-mono text-base font-black text-emerald-600 sm:text-xl">
                  {closedRooms}
                </p>
              </div>
            </div>

            {totalSettledMoney > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-50/70 px-3.5 py-2 border border-emerald-100 text-xs">
                <span className="text-emerald-800 font-semibold">Total Ditalangi Selesai:</span>
                <span className="font-mono font-black text-emerald-900">
                  {formatIDR(totalSettledMoney)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Bento Settings Grid */}
      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-4 sm:px-6 lg:px-8">
        {/* Section: Rekening Payout Default */}
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Bank size={18} weight="bold" />
              </span>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 sm:text-sm">
                  Rekening Payout Default
                </h2>
                <p className="text-[11px] text-slate-400">
                  Otomatis terisi saat kamu membuat meja patungan baru
                </p>
              </div>
            </div>

            {!isEditingPayout && (
              <button
                type="button"
                onClick={() => setIsEditingPayout(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
              >
                <PencilSimple size={13} weight="bold" />
                <span>Ubah</span>
              </button>
            )}
          </div>

          {payoutSaved && (
            <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-100">
              <CheckCircle size={14} weight="fill" className="text-emerald-600" />
              <span>Rekening default berhasil disimpan!</span>
            </div>
          )}

          {isEditingPayout ? (
            <form onSubmit={handleSavePayout} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[10.5px] font-bold uppercase text-slate-400">
                  Pilihan Bank / Dompet Digital
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {BANK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10.5px] font-bold uppercase text-slate-400">
                    Nomor Rekening / Ponsel
                  </label>
                  <input
                    type="text"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    required
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10.5px] font-bold uppercase text-slate-400">
                    Atas Nama Pemilik
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPayout(false)}
                  className="h-8 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex h-8 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
                >
                  <FloppyDisk size={13} weight="bold" />
                  <span>Simpan Rekening</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-mono text-xs font-black text-white shadow-2xs">
                  {bankName.slice(0, 3).toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-slate-900">{bankName}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700">
                      Utama
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs font-bold text-slate-700">
                    {accountNo}{" "}
                    <span className="font-sans font-normal text-slate-500">
                      (a.n. {accountName})
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copy(`${bankName} ${accountNo} a.n. ${accountName}`)}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle size={14} weight="fill" className="text-emerald-600" />
                    <span>Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    <span>Salin Rekening</span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Section: Preferensi Pembagian & Kalkulasi */}
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <CurrencyCircleDollar size={18} weight="bold" />
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 sm:text-sm">
                Preferensi Pembagian Tagihan
              </h2>
              <p className="text-[11px] text-slate-400">
                Kustomisasi cara PaTo membulatkan nominal patungan
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "hundred", label: "Bulat Ratusan", sample: "Rp14.300" },
                { id: "thousand", label: "Bulat Ribuan", sample: "Rp15.000" },
                { id: "none", label: "Pas Nominal", sample: "Rp14.285" },
              ].map((m) => {
                const active = roundMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleUpdateRoundMode(m.id as "none" | "hundred" | "thousand")}
                    className={`flex flex-col items-center justify-center rounded-2xl p-2.5 text-center transition-all ${
                      active
                        ? "border border-blue-600 bg-blue-50/80 shadow-2xs ring-1 ring-blue-500"
                        : "border border-slate-200/70 bg-slate-50 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-black ${active ? "text-blue-600" : "text-slate-800"}`}>
                        {m.label}
                      </span>
                      {active && <Check size={11} weight="bold" className="text-blue-600" />}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">{m.sample}</span>
                  </button>
                );
              })}
            </div>

            {/* Audio Celebration Toggle */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/80 text-slate-700">
                  <BellRinging size={15} weight="bold" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Suara Efek Selebrasi Patungan
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Efek audio saat meja ditutup lunas 100%
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleSound}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  soundEnabled ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    soundEnabled ? "translate-x-4" : "translate-x-0.5"
                  } mt-0.5`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Section: Maskot PaTo Info Card */}
        <section className="flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 p-5 shadow-2xs">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-xs ring-2 ring-blue-100">
            <img src={mascotHelper} alt="Pato Mascot" className="h-full w-full object-cover" />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-xs">
              <Sparkle size={12} weight="fill" />
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <h3 className="text-xs font-black text-slate-900">PaTo (Pay Together)</h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[9px] font-bold text-blue-700">
                v1.2.0
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 leading-snug">
              Bagi rata transparan tanpa drama kasir & rasa canggung.
            </p>
            <p className="mt-1 flex items-center justify-center sm:justify-start gap-1 text-[10px] font-bold text-slate-400">
              <Heart size={11} weight="fill" className="text-rose-500" />
              <span>Dibuat dengan cinta untuk anak nongkrong</span>
            </p>
          </div>
        </section>
      </main>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="flex w-full max-w-xs flex-col items-center rounded-3xl bg-white p-5 text-center shadow-2xl ring-1 ring-slate-900/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <WarningCircle size={24} weight="bold" />
            </div>

            <h3 className="text-sm font-extrabold text-slate-900">Yakin Mau Keluar?</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Kamu bisa login kembali kapan pun untuk mengakses meja patungan kamu.
            </p>

            <div className="mt-4 flex w-full gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 h-9 rounded-xl bg-rose-600 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition-all"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
