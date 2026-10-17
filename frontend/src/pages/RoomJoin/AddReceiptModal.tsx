import { useState, useRef, useId } from "react";
import {
  Camera,
  CheckCircle,
  CircleNotch,
  Plus,
  Receipt,
  Trash,
  UploadSimple,
  User,
  UsersThree,
  X,
  Bank,
  QrCode,
  Sparkle,
} from "@phosphor-icons/react";
import { apiPost } from "../../lib/api";
import { compressImageFile } from "../../lib/imageCompression";
import { getGuestToken } from "./guestToken";
import { useAuth } from "../../auth/useAuth";
import { safeIDR } from "./money";
import { soundFX } from "../../lib/soundFx";
import type { RoomMember } from "./types";

interface AddReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  members: RoomMember[];
  currentMember: RoomMember | null;
  onReceiptAdded: () => void;
}

interface NewItemRow {
  id: string;
  name: string;
  unit_price: number | "";
  quantity: number;
  is_shared: boolean;
}

interface OcrResult {
  title?: string;
  items: Array<{ name: string; unitPrice: number; quantity: number }>;
  taxAmount?: number;
  serviceAmount?: number;
}

export function AddReceiptModal({
  isOpen,
  onClose,
  roomCode,
  members,
  currentMember,
  onReceiptAdded,
}: AddReceiptModalProps) {
  const { token: authToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  const titleInputId = useId();
  const payerCustomInputId = useId();
  const bankNameInputId = useId();
  const bankAccountNoInputId = useId();
  const bankAccountNameInputId = useId();
  const taxInputId = useId();
  const serviceInputId = useId();
  const discountInputId = useId();

  // Form states
  const [title, setTitle] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [selectedPayerId, setSelectedPayerId] = useState<string>(
    () => currentMember?.id || (members[0]?.id ?? "")
  );
  const [customPayerName, setCustomPayerName] = useState("");

  // Payout info
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);

  // Items
  const [items, setItems] = useState<NewItemRow[]>([
    { id: "item-1", name: "", unit_price: "", quantity: 1, is_shared: false },
  ]);

  // Tax & adjustments
  const [taxAmount, setTaxAmount] = useState<number | "">(0);
  const [serviceAmount, setServiceAmount] = useState<number | "">(0);
  const [discountAmount, setDiscountAmount] = useState<number | "">(0);

  // OCR & Loading states
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStep, setOcrStep] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const price = typeof item.unit_price === "number" ? item.unit_price : 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  const tax = typeof taxAmount === "number" ? taxAmount : 0;
  const service = typeof serviceAmount === "number" ? serviceAmount : 0;
  const discount = typeof discountAmount === "number" ? discountAmount : 0;
  const grandTotal = Math.max(0, subtotal + tax + service - discount);

  // Handle OCR scan
  async function handleOcrScan(file: File) {
    setErrorMessage(null);
    setIsOcrProcessing(true);
    setOcrStep("Mengompresi struk...");

    try {
      const compressed = await compressImageFile(file, 1600, 1600, 0.85);
      setReceiptImageUrl(compressed);

      setOcrStep("AI sedang membaca item struk...");
      const extracted = await apiPost<OcrResult>("/api/rooms/ocr", {
        image: compressed,
      });

      if (extracted?.title && !title) {
        setTitle(extracted.title);
      }

      if (Array.isArray(extracted?.items) && extracted.items.length > 0) {
        setItems(
          extracted.items.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            name: item.name,
            unit_price: item.unitPrice,
            quantity: item.quantity > 0 ? item.quantity : 1,
            is_shared: false,
          }))
        );
      }

      if (typeof extracted?.taxAmount === "number") {
        setTaxAmount(extracted.taxAmount);
      }
      if (typeof extracted?.serviceAmount === "number") {
        setServiceAmount(extracted.serviceAmount);
      }

      soundFX.playClaim();
    } catch (err: unknown) {
      console.error("[AddReceipt OCR Error]", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal memindai struk. Silakan input menu secara manual."
      );
    } finally {
      setIsOcrProcessing(false);
      setOcrStep(null);
    }
  }

  // Handle QRIS upload
  async function handleQrisUpload(file: File) {
    try {
      const compressed = await compressImageFile(file, 1000, 1000, 0.82);
      setQrisImageUrl(compressed);
    } catch (err) {
      console.error("[QRIS compress error]", err);
    }
  }

  // Item list helpers
  function addItemRow() {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        unit_price: "",
        quantity: 1,
        is_shared: false,
      },
    ]);
  }

  function removeItemRow(id: string) {
    if (items.length <= 1) {
      setItems([{ id: "item-1", name: "", unit_price: "", quantity: 1, is_shared: false }]);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateItem(id: string, updates: Partial<NewItemRow>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }

  // Submit new receipt
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage("Beri nama tempat / nama struk (misal: Kopi Kenangan / Lawson).");
      return;
    }

    // Filter valid items
    const validItems = items
      .map((item) => ({
        name: item.name.trim(),
        unit_price: typeof item.unit_price === "number" ? item.unit_price : 0,
        quantity: item.quantity > 0 ? item.quantity : 1,
        is_shared: item.is_shared,
      }))
      .filter((item) => item.name.length > 0 && item.unit_price > 0);

    if (validItems.length === 0) {
      setErrorMessage("Minimal tambahkan 1 menu dengan nama dan harga yang valid.");
      return;
    }

    // Determine payer info
    let payerMemberId: string | undefined = undefined;
    let payerName: string | undefined = undefined;

    if (selectedPayerId === "custom") {
      payerName = customPayerName.trim() || "Teman Lain";
    } else {
      const payer = members.find((m) => m.id === selectedPayerId);
      if (payer) {
        payerMemberId = payer.id;
        payerName = payer.display_name;
      }
    }

    setIsSubmitting(true);
    try {
      const guestToken = getGuestToken(roomCode);
      await apiPost(
        `/api/rooms/${encodeURIComponent(roomCode)}/receipts`,
        {
          title: cleanTitle,
          receipt_image_url: receiptImageUrl || undefined,
          payer_member_id: payerMemberId,
          payer_name: payerName,
          bank_name: bankName.trim() || undefined,
          bank_account_no: bankAccountNo.trim() || undefined,
          bank_account_name: bankAccountName.trim() || undefined,
          qris_image_url: qrisImageUrl || undefined,
          tax_amount: typeof taxAmount === "number" ? taxAmount : 0,
          service_amount: typeof serviceAmount === "number" ? serviceAmount : 0,
          discount_amount: typeof discountAmount === "number" ? discountAmount : 0,
          items: validItems,
        },
        authToken,
        {
          "x-guest-token": guestToken,
        }
      );

      soundFX.playCelebration();
      onReceiptAdded();
      onClose();
    } catch (err: unknown) {
      console.error("[AddReceipt Submit Error]", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal menambahkan struk. Coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-backdrop-fade overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Tambah Struk Tempat Baru"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden animate-dialog-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xs">
              <Receipt size={20} weight="bold" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Tambah Struk Tempat Baru
              </h2>
              <p className="text-[11px] text-slate-500">
                Pindah spot nongkrong? Gabungkan struk ke room ini!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          {/* AI Scan Prompt Banner */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white mt-0.5">
                  <Sparkle size={16} weight="fill" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    Scan Struk Kasir Otomatis (AI)
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Foto struk tempat baru agar menu & harga terisi otomatis
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleOcrScan(file);
                }}
              />

              <button
                type="button"
                disabled={isOcrProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shrink-0"
              >
                {isOcrProcessing ? (
                  <>
                    <CircleNotch size={16} weight="bold" className="animate-spin" />
                    <span>{ocrStep || "Membaca..."}</span>
                  </>
                ) : (
                  <>
                    <Camera size={16} weight="bold" />
                    <span>Ambil Foto Struk</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Spot Title */}
          <div>
            <label htmlFor={titleInputId} className="block text-xs font-bold text-slate-800 mb-1.5">
              Nama Tempat / Nama Struk <span className="text-rose-500">*</span>
            </label>
            <input
              id={titleInputId}
              type="text"
              required
              placeholder="Contoh: Kopi Kenangan, Lawson, Bakso Solo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all"
            />
          </div>

          {/* Who Paid Section */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <User size={15} weight="bold" />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900">
                  Siapa yang nalangin di kasir?
                </h3>
                <p className="text-[10px] text-slate-500">
                  Anggota lain akan mentransfer bagian mereka ke orang ini
                </p>
              </div>
            </div>

            {/* Member selector chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {members.map((member) => {
                const isSelected = selectedPayerId === member.id;
                const isMe = currentMember?.id === member.id;

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSelectedPayerId(member.id);
                      setCustomPayerName("");
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white border border-slate-200/80 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span>{member.display_name}</span>
                    {isMe && <span className="text-[10px] opacity-80">(Kamu)</span>}
                    {member.is_host && <span className="text-[10px] opacity-80">(Host)</span>}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedPayerId("custom")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  selectedPayerId === "custom"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white border border-slate-200/80 text-slate-700 hover:border-slate-300"
                }`}
              >
                <span>+ Orang Lain</span>
              </button>
            </div>

            {selectedPayerId === "custom" && (
              <div className="pt-2">
                <label htmlFor={payerCustomInputId} className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nama yang nalangin:
                </label>
                <input
                  id={payerCustomInputId}
                  type="text"
                  placeholder="Ketik nama (misal: Budi)"
                  value={customPayerName}
                  onChange={(e) => setCustomPayerName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Payer Payout Info (Rekening / QRIS) */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Bank size={15} weight="bold" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    Tujuan Transfer / QRIS Nalangin
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Opsional, agar teman langsung tahu nomor rekening / scan QRIS
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label htmlFor={bankNameInputId} className="block text-[11px] font-bold text-slate-600 mb-1">
                  Bank / E-Wallet
                </label>
                <input
                  id={bankNameInputId}
                  type="text"
                  placeholder="BCA / GoPay / Dana"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor={bankAccountNoInputId} className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nomor Rekening / HP
                </label>
                <input
                  id={bankAccountNoInputId}
                  type="text"
                  placeholder="1234567890"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor={bankAccountNameInputId} className="block text-[11px] font-bold text-slate-600 mb-1">
                  Atas Nama
                </label>
                <input
                  id={bankAccountNameInputId}
                  type="text"
                  placeholder="Nama Pemilik"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* QRIS Upload */}
            <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 mt-2">
              <div className="flex items-center gap-2">
                <QrCode size={16} weight="bold" className="text-slate-500" />
                <span className="text-xs font-medium text-slate-700">QRIS Nalangin</span>
              </div>

              <input
                ref={qrisInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleQrisUpload(file);
                }}
              />

              {qrisImageUrl ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    <CheckCircle size={12} weight="fill" />
                    Terpasang
                  </span>
                  <button
                    type="button"
                    onClick={() => setQrisImageUrl(null)}
                    className="text-xs font-bold text-rose-500 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => qrisInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <UploadSimple size={13} weight="bold" />
                  <span>Upload QRIS</span>
                </button>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Daftar Menu ({items.length} Menu)
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 active:scale-95 transition-all"
              >
                <Plus size={14} weight="bold" />
                <span>Tambah Menu</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 w-5">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Nama Menu (cth: Es Americano)"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => removeItemRow(item.id)}
                      aria-label="Hapus menu"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pl-7">
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          Rp
                        </span>
                        <input
                          type="number"
                          placeholder="Harga satuan"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(item.id, {
                              unit_price: e.target.value === "" ? "" : Number(e.target.value),
                            })
                          }
                          className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs font-bold font-mono text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-bold text-slate-500">Qty:</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, {
                            quantity: Math.max(1, parseInt(e.target.value || "1", 10)),
                          })
                        }
                        className="w-14 h-10 rounded-xl border border-slate-200 bg-slate-50/50 text-center text-xs font-bold font-mono text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { is_shared: !item.is_shared })}
                      className={`inline-flex h-10 items-center gap-1 rounded-xl px-2.5 text-[11px] font-bold transition-all ${
                        item.is_shared
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title="Makan bareng dibagi rata"
                    >
                      <UsersThree size={14} weight="bold" />
                      <span>{item.is_shared ? "Bareng" : "Pribadi"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax, Service, Discount */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Pajak & Penyesuaian Struk (Opsional)
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor={taxInputId} className="block text-[11px] font-bold text-slate-600 mb-1">
                  Pajak (PB1)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    id={taxInputId}
                    type="number"
                    value={taxAmount}
                    onChange={(e) =>
                      setTaxAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-7 pr-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={serviceInputId} className="block text-[11px] font-bold text-slate-600 mb-1">
                  Service
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    id={serviceInputId}
                    type="number"
                    value={serviceAmount}
                    onChange={(e) =>
                      setServiceAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-7 pr-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={discountInputId} className="block text-[11px] font-bold text-slate-600 mb-1">
                  Diskon
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    id={discountInputId}
                    type="number"
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-7 pr-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Sticky Footer */}
        <div className="border-t border-slate-100 bg-white p-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Struk Baru
            </span>
            <span className="font-mono text-base sm:text-lg font-black text-slate-900 tabular-nums">
              {safeIDR(grandTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} weight="bold" />
                  <span>Gabungkan ke Room</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
