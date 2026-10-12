import { Check } from "@phosphor-icons/react";
import type { JoinResult } from "./types";

interface JoinedPanelProps {
  join: JoinResult;
  roomCode: string;
}

export function JoinedPanel({ join, roomCode }: JoinedPanelProps) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-shell px-5 py-8 text-center">
      <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
        <Check size={28} weight="bold" />
      </span>
      <h2 className="text-[18px] font-bold tracking-[-0.01em] text-ink">
        Kamu sudah gabung
      </h2>
      <p className="max-w-[30ch] text-[13px] leading-relaxed text-ink-soft">
        Terdaftar sebagai <span className="font-semibold text-ink">{join.display_name}</span> di
        meja <span className="font-mono font-bold text-ink">{roomCode}</span>.
      </p>
      <p className="max-w-[30ch] text-[12px] text-ink-muted">
        Simpan halaman ini. Kamu bisa mulai klaim makanan begitu host membuka sesi klaim.
      </p>
    </section>
  );
}
