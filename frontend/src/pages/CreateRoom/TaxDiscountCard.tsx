import { Percent } from "@phosphor-icons/react";
import { digitsOnly } from "../../lib/format";

interface TaxDiscountCardProps {
  taxAmount: string;
  setTaxAmount: (value: string) => void;
  onApplyTaxPercent: (percent: number) => void;
  serviceAmount: string;
  setServiceAmount: (value: string) => void;
  onApplyServicePercent: (percent: number) => void;
  discountAmount: string;
  setDiscountAmount: (value: string) => void;
}

export function TaxDiscountCard({
  taxAmount,
  setTaxAmount,
  onApplyTaxPercent,
  serviceAmount,
  setServiceAmount,
  onApplyServicePercent,
  discountAmount,
  setDiscountAmount,
}: TaxDiscountCardProps) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_32px_rgba(37,99,235,0.06)] sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 aspect-square items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Percent size={22} weight="bold" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Pajak, Service & Diskon
          </h2>
          <p className="text-xs text-slate-500">
            Biaya ekstra akan dibagi adil secara proporsional sesuai nominal pesanan masing-masing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Pajak (Tax) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="tax-field" className="text-xs font-bold text-slate-700">
              Pajak Resto
            </label>
            <span className="text-xs text-slate-400">Rp</span>
          </div>
          <input
            id="tax-field"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={taxAmount ? Number(taxAmount).toLocaleString("id-ID") : ""}
            onChange={(e) => setTaxAmount(digitsOnly(e.target.value))}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 font-mono text-sm font-medium text-slate-900 placeholder:font-sans placeholder:text-slate-400 transition-all focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
          />
          {/* Quick Tax Percentage Chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onApplyTaxPercent(10)}
              className="shrink-0 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
            >
              PB1 10%
            </button>
            <button
              type="button"
              onClick={() => onApplyTaxPercent(11)}
              className="shrink-0 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
            >
              PPN 11%
            </button>
            <button
              type="button"
              onClick={() => setTaxAmount("")}
              className="shrink-0 rounded-xl border border-slate-200/60 bg-transparent px-2 py-1 text-xs text-slate-400 hover:text-rose-600"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Service Charge */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="service-field" className="text-xs font-bold text-slate-700">
              Service Charge
            </label>
            <span className="text-xs text-slate-400">Rp</span>
          </div>
          <input
            id="service-field"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={serviceAmount ? Number(serviceAmount).toLocaleString("id-ID") : ""}
            onChange={(e) => setServiceAmount(digitsOnly(e.target.value))}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 font-mono text-sm font-medium text-slate-900 placeholder:font-sans placeholder:text-slate-400 transition-all focus:border-blue-600 focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] focus:outline-none"
          />
          {/* Quick Service Percentage Chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onApplyServicePercent(5)}
              className="shrink-0 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
            >
              5%
            </button>
            <button
              type="button"
              onClick={() => onApplyServicePercent(7)}
              className="shrink-0 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
            >
              7%
            </button>
            <button
              type="button"
              onClick={() => onApplyServicePercent(10)}
              className="shrink-0 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95"
            >
              10%
            </button>
            <button
              type="button"
              onClick={() => setServiceAmount("")}
              className="shrink-0 rounded-xl border border-slate-200/60 bg-transparent px-2 py-1 text-xs text-slate-400 hover:text-rose-600"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Diskon / Voucher */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="discount-field" className="text-xs font-bold text-slate-700">
              Diskon / Potongan
            </label>
            <span className="text-xs text-slate-400">Rp</span>
          </div>
          <input
            id="discount-field"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={discountAmount ? Number(discountAmount).toLocaleString("id-ID") : ""}
            onChange={(e) => setDiscountAmount(digitsOnly(e.target.value))}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 font-mono text-sm font-medium text-emerald-700 placeholder:font-sans placeholder:text-slate-400 transition-all focus:border-emerald-600 focus:bg-white focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] focus:outline-none"
          />
          <p className="mt-2.5 text-xs text-slate-400">
            Mengurangi total tagihan secara adil
          </p>
        </div>
      </div>
    </section>
  );
}
