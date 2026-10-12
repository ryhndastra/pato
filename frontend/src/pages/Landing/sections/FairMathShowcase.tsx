const EXAMPLE_ROWS = [
  { name: "Kevin", item: "Wagyu Steak", subtotal: 150000, tax: 15000 },
  { name: "Siti", item: "Es Teh Manis", subtotal: 15000, tax: 1500 },
];

function formatIDR(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export function FairMathShowcase() {
  return (
    <section className="flex flex-col gap-10 px-6 py-14 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:grid lg:grid-cols-[1fr_440px] lg:items-center lg:gap-16 lg:px-12 lg:py-20">
      <div className="flex flex-col gap-3">
        <h2 className="max-w-[18ch] text-2xl font-bold tracking-[-0.01em] text-ink lg:text-[32px]">
          Pajak dihitung sesuai porsi, bukan dibagi rata.
        </h2>
        <p className="max-w-[48ch] text-[15px] leading-relaxed text-ink-soft">
          Kalau Kevin makan Wagyu dan Siti cuma minum es teh, Siti gak perlu
          ikut nanggung pajak dagingnya Kevin. PaTo ngitung pajak dan service
          proporsional ke nilai makanan masing-masing orang.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline bg-shell p-5">
        <p className="mb-4 text-[11px] font-bold tracking-wide text-ink-muted uppercase">
          Contoh Hitungan
        </p>
        <div className="flex flex-col divide-y divide-hairline">
          {EXAMPLE_ROWS.map((row) => (
            <div key={row.name} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tint text-sm font-bold text-brand">
                {row.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-ink">{row.name}</p>
                <p className="truncate text-[12px] text-ink-soft">
                  {row.item} · {formatIDR(row.subtotal)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-ink-muted">Pajak (10%)</p>
                <p className="font-mono text-[14px] font-bold text-ink">
                  {formatIDR(row.tax)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
