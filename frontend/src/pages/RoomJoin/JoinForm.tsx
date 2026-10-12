import { useState, type FormEvent } from "react";
import { SignIn } from "@phosphor-icons/react";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="guest-name" className="pl-0.5 text-[13px] font-semibold text-ink-soft">
          Nama kamu
        </label>
        <input
          id="guest-name"
          type="text"
          required
          maxLength={40}
          autoComplete="name"
          placeholder="Contoh: Sho"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-[52px] rounded-xl border border-hairline bg-shell px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-danger-bg px-4 py-3 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        aria-label={`Gabung ke meja ${roomCode}`}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_2px_4px_rgba(37,99,235,0.15)] disabled:cursor-not-allowed disabled:bg-brand-soft"
      >
        <SignIn size={20} weight="bold" />
        {submitting ? "Menghubungkan..." : "Gabung ke Meja"}
      </button>

      <p className="text-center text-[12px] text-ink-muted">
        Tanpa daftar akun. Nama dipakai biar temenmu tahu siapa yang klaim.
      </p>
    </form>
  );
}
