import { useState, type FormEvent } from "react";
import { SignIn, User } from "@phosphor-icons/react";

interface JoinFormProps {
  roomCode: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (displayName: string) => void;
}

export function JoinForm({ roomCode, submitting, error, onSubmit }: JoinFormProps) {
  const [name, setName] = useState("");
  const canSubmit = name.trim().length >= 1 && !submitting;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(name.trim());
  }

  return (
    <section className="flex flex-col gap-3.5 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-brand">
          <User size={20} weight="bold" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-ink sm:text-base">Gabung ke Meja</h2>
          <p className="text-xs text-ink-muted">
            Tanpa perlu buat akun. Masukkan nama panggilanmu untuk mulai klaim menu.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-1">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="guest-name" className="text-xs font-semibold text-ink-soft">
            Nama Panggilan Kamu
          </label>
          <input
            id="guest-name"
            type="text"
            required
            maxLength={40}
            autoComplete="name"
            placeholder="Contoh: Budi, Sarah, Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl border border-hairline bg-slate-50 px-3.5 text-sm text-ink placeholder:text-ink-muted focus:border-focus focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          aria-label={`Gabung ke meja ${roomCode}`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-xs font-bold text-white shadow-sm transition-all hover:bg-brand/95 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <SignIn size={16} weight="bold" />
          <span>{submitting ? "Menghubungkan ke Meja..." : "Gabung & Mulai Klaim"}</span>
        </button>
      </form>
    </section>
  );
}
