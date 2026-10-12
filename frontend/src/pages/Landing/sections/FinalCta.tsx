import { Plus } from "@phosphor-icons/react";

interface FinalCtaProps {
  onCreateRoom: () => void;
}

export function FinalCta({ onCreateRoom }: FinalCtaProps) {
  return (
    <section className="border-t border-hairline px-6 py-14 text-center lg:px-12 lg:py-20">
      <div className="mx-auto flex max-w-[480px] flex-col items-center gap-5">
        <h2 className="text-2xl font-bold tracking-[-0.01em] text-ink lg:text-[32px]">
          Nongkrong lagi minggu ini?
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Bikin room-nya sebelum pesen makanan, biar gak lupa siapa pesan apa.
        </p>
        <button
          type="button"
          onClick={onCreateRoom}
          className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-brand px-7 text-[15px] font-bold text-white shadow-[0_2px_4px_rgba(37,99,235,0.15)]"
        >
          <Plus size={20} weight="bold" />
          Buat Room Baru
        </button>
      </div>
    </section>
  );
}
