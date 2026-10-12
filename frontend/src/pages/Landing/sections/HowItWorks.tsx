import {
  NumberCircleOne,
  NumberCircleThree,
  NumberCircleTwo,
} from "@phosphor-icons/react";

const STEPS = [
  {
    icon: NumberCircleOne,
    title: "Buat Room & Isi Menu",
    body: "Kasih nama acara, masukin daftar makanan beserta harganya.",
  },
  {
    icon: NumberCircleTwo,
    title: "Bagikan Link ke Teman",
    body: "Kirim link lewat WhatsApp, teman tinggal buka dan pilih porsinya.",
  },
  {
    icon: NumberCircleThree,
    title: "Semua Bayar Pas",
    body: "Pajak dan diskon kehitung sesuai porsi, tinggal transfer nominalnya.",
  },
];

export function HowItWorks() {
  return (
    <section className="flex flex-col gap-8 px-6 py-12 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:px-12 lg:py-20">
      <h2 className="max-w-[20ch] text-2xl font-bold tracking-[-0.01em] text-ink lg:text-[32px]">
        Cara kerjanya cuma 3 langkah.
      </h2>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-3">
            <Icon size={32} weight="fill" className="text-brand" />
            <p className="text-[15px] font-bold text-ink">{title}</p>
            <p className="text-[13px] leading-relaxed text-ink-soft">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
