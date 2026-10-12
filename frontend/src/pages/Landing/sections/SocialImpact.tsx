import { HeartStraight } from "@phosphor-icons/react";

export function SocialImpact() {
  return (
    <section className="bg-tint px-6 py-14 lg:py-16">
      <div className="flex flex-col items-start gap-4 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:flex-row lg:items-center lg:gap-6 lg:px-12">
        <HeartStraight size={36} weight="fill" className="shrink-0 text-brand" />
        <div>
          <p className="mb-1 text-[15px] font-bold text-ink">
            20% dari setiap tip kamu, disalurkan ke korban bencana alam.
          </p>
          <p className="max-w-[56ch] text-[13px] leading-relaxed text-ink-soft">
            Kalau abis nongkrong kamu mau traktir pengembang es kopi susu,
            seperlima dari tip itu otomatis dialokasikan buat bantuan
            kemanusiaan. Bukan cuma split bill, ada dampaknya juga.
          </p>
        </div>
      </div>
    </section>
  );
}
