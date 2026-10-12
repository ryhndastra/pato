import { ArrowLeft, Receipt } from "@phosphor-icons/react";
import { useNavigate } from "react-router";

interface RoomStatesProps {
  variant: "loading" | "notfound";
  message?: string;
}

export function RoomStates({ variant, message }: RoomStatesProps) {
  const navigate = useNavigate();

  if (variant === "loading") {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-4 px-5 py-6 lg:px-0 lg:py-10" aria-hidden="true">
        <div className="h-6 w-3/5 animate-pulse rounded-lg bg-haze" />
        <div className="h-4 w-2/5 animate-pulse rounded-lg bg-haze" />
        <div className="h-[92px] animate-pulse rounded-xl bg-haze" />
        <div className="h-[180px] animate-pulse rounded-xl bg-haze" />
        <div className="h-[220px] animate-pulse rounded-xl bg-haze" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-center lg:px-0">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
        <Receipt size={26} weight="regular" />
      </span>
      <h1 className="text-[19px] font-bold tracking-[-0.01em] text-ink">Meja tidak ditemukan</h1>
      <p className="max-w-[32ch] text-[13px] leading-relaxed text-ink-soft">
        {message ?? "Kode meja salah atau sudah kedaluwarsa. Cek ulang kode dari host."}
      </p>
      <button
        type="button"
        onClick={() => navigate("/", { replace: true })}
        className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_2px_4px_rgba(37,99,235,0.15)]"
      >
        <ArrowLeft size={20} weight="bold" />
        Kembali ke Beranda
      </button>
    </div>
  );
}
