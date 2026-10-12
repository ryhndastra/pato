import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { apiPost, ApiError } from "../../lib/api";
import { digitsOnly, formatIDR } from "../../lib/format";
import { ItemForm } from "./ItemForm";
import { ItemRow } from "./ItemRow";
import { CreateRoomSuccess } from "./CreateRoomSuccess";
import type { DraftItem } from "./types";

interface CreateRoomResponse {
  room_code: string;
  share_url: string;
}

export function CreateRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();

  const [title, setTitle] = useState(() => searchParams.get("event") ?? "");
  const [hostName, setHostName] = useState(
    () => searchParams.get("host") ?? user?.name ?? "",
  );
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [taxAmount, setTaxAmount] = useState("");
  const [serviceAmount, setServiceAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreateRoomResponse | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );
  const grandTotal = Math.max(
    0,
    subtotal + Number(taxAmount || 0) + Number(serviceAmount || 0) - Number(discountAmount || 0),
  );

  const canSubmit = title.trim().length >= 3 && items.length > 0 && !submitting;

  function addItem(item: Omit<DraftItem, "id">) {
    setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setSubmitting(true);
    try {
      const res = await apiPost<CreateRoomResponse>(
        "/api/rooms",
        {
          title: title.trim(),
          host_name: hostName.trim() || user?.name || "Host",
          bank_name: bankName.trim() || undefined,
          bank_account_no: bankAccountNo.trim() || undefined,
          bank_account_name: bankAccountName.trim() || undefined,
          items: items.map((item) => ({
            name: item.name,
            unit_price: item.unitPrice,
            quantity: item.quantity,
          })),
          tax_amount: Number(taxAmount || 0),
          service_amount: Number(serviceAmount || 0),
          discount_amount: Number(discountAmount || 0),
        },
        token,
      );
      setCreated(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal terhubung ke server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="flex min-h-dvh w-full flex-col bg-shell">
        <CreateRoomSuccess
          roomCode={created.room_code}
          shareUrl={created.share_url}
          title={title}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-shell">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-hairline bg-shell px-5 py-3 lg:px-12 lg:py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-haze text-ink active:bg-hairline"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>
        <h1 className="text-[17px] font-bold text-ink">Room Baru</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-8 px-5 py-6 lg:px-0 lg:py-10"
      >
        {/* Room basics */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-ink-muted">Detail Acara</h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="pl-0.5 text-[13px] font-semibold text-ink-soft">
              Nama Acara
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="Contoh: Makan Sushi Tei Senopati"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-[52px] rounded-xl border border-hairline bg-shell px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="host-name" className="pl-0.5 text-[13px] font-semibold text-ink-soft">
              Nama Kamu (Host)
            </label>
            <input
              id="host-name"
              type="text"
              required
              placeholder="Nama yang kelihatan di room"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="h-[52px] rounded-xl border border-hairline bg-shell px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
            />
          </div>
        </section>

        {/* Payment info */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-ink-muted">
            Info Transfer <span className="font-normal normal-case">(opsional, bisa diisi nanti)</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
              <label htmlFor="bank-name" className="pl-0.5 text-[13px] font-semibold text-ink-soft">
                Bank / E-wallet
              </label>
              <input
                id="bank-name"
                type="text"
                placeholder="BCA"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="h-[52px] rounded-xl border border-hairline bg-shell px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
              <label htmlFor="bank-no" className="pl-0.5 text-[13px] font-semibold text-ink-soft">
                Nomor Rekening
              </label>
              <input
                id="bank-no"
                type="text"
                inputMode="numeric"
                placeholder="5410982711"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(digitsOnly(e.target.value))}
                className="h-[52px] rounded-xl border border-hairline bg-shell px-4 font-mono text-[15px] text-ink placeholder:font-sans placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bank-account-name" className="pl-0.5 text-[13px] font-semibold text-ink-soft">
              Nama Pemilik Rekening
            </label>
            <input
              id="bank-account-name"
              type="text"
              placeholder="Sesuai nama di buku tabungan"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className="h-[52px] rounded-xl border border-hairline bg-shell px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
            />
          </div>
        </section>

        {/* Items */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-ink-muted">Daftar Menu</h2>

          <ItemForm onAdd={addItem} />

          {items.length > 0 && (
            <div className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline px-4">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} onRemove={removeItem} />
              ))}
            </div>
          )}
        </section>

        {/* Tax / service / discount */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-ink-muted">Pajak & Biaya Lain</h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "tax", label: "Pajak", value: taxAmount, setValue: setTaxAmount },
              { id: "service", label: "Service", value: serviceAmount, setValue: setServiceAmount },
              { id: "discount", label: "Diskon", value: discountAmount, setValue: setDiscountAmount },
            ].map(({ id, label, value, setValue }) => (
              <div key={id} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="pl-0.5 text-[13px] font-semibold text-ink-soft">
                  {label}
                </label>
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={value ? Number(value).toLocaleString("id-ID") : ""}
                  onChange={(e) => setValue(digitsOnly(e.target.value))}
                  className="h-[48px] rounded-xl border border-hairline bg-shell px-3 font-mono text-[14px] text-ink placeholder:font-sans placeholder:text-ink-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)] focus:outline-none"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Summary */}
        <section className="flex flex-col gap-2 rounded-xl bg-haze px-4 py-4">
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <span>Subtotal</span>
            <span className="font-mono">{formatIDR(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <span>Pajak + Service - Diskon</span>
            <span className="font-mono">
              {formatIDR(Number(taxAmount || 0) + Number(serviceAmount || 0) - Number(discountAmount || 0))}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-hairline pt-2">
            <span className="text-[15px] font-bold text-ink">Total Tagihan</span>
            <span className="font-mono text-[17px] font-bold text-ink">
              {formatIDR(grandTotal)}
            </span>
          </div>
        </section>

        {error && (
          <p className="rounded-xl bg-danger-bg px-4 py-3 text-[13px] font-semibold text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="sticky bottom-4 flex h-[52px] w-full items-center justify-center rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_2px_4px_rgba(37,99,235,0.15)] disabled:cursor-not-allowed disabled:bg-brand-soft"
        >
          {submitting ? "Membuat Room..." : "Buka Room & Bagikan"}
        </button>
      </form>
    </div>
  );
}
