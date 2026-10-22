import { useState, useRef, useId } from "react";
import {
  CaretDown,
  CaretUp,
  Camera,
  CheckCircle,
  CircleNotch,
  Plus,
  Receipt,
  Trash,
  UploadSimple,
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

  // Progressive disclosure accordions
  const [showPayoutDetails, setShowPayoutDetails] = useState(false);
  const [showTaxDetails, setShowTaxDetails] = useState(false);

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

      if (typeof extracted?.taxAmount === "number" && extracted.taxAmount > 0) {
        setTaxAmount(extracted.taxAmount);
        setShowTaxDetails(true);
      }
      if (typeof extracted?.serviceAmount === "number" && extracted.serviceAmount > 0) {
        setServiceAmount(extracted.serviceAmount);
        setShowTaxDetails(true);
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
      setShowPayoutDetails(true);
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
      const customHeaders: Record<string, string> = {};
      if (guestToken) {
        customHeaders["x-guest-token"] = guestToken;
      }

      await apiPost(
        `/api/rooms/${encodeURIComponent(roomCode)}/receipts`,
        {
          title: cleanTitle,
          receipt_image_url: receiptImageUrl || undefined,
          payer_member_id: payerMemberId || undefined,
          payer_name: payerName,
          bank_name: bankName.trim() || undefined,
          bank_account_no: bankAccountNo.trim() || undefined,
          bank_account_name: bankAccountName.trim() || undefined,
          qris_image_url: qrisImageUrl || undefined,
          tax_amount: Math.round(typeof taxAmount === "number" ? taxAmount : 0),
          service_amount: Math.round(typeof serviceAmount === "number" ? serviceAmount : 0),
          discount_amount: Math.round(typeof discountAmount === "number" ? discountAmount : 0),
          items: validItems.map((item) => ({
            ...item,
            unit_price: Math.round(item.unit_price),
          })),
        },
        authToken,
        Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
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
        className="relative flex flex-col w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden animate-dialog-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
              <Receipt size={18} weight="bold" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Tambah Struk Tempat Baru
              </h2>
              <p className="text-[11px] text-slate-500">
                Pindah spot nongkrong? Gabungkan struk ke room ini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-90 transition-all"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
          {/* AI Scan Prompt Banner */}
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                <Sparkle size={16} weight="fill" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">Scan Struk Otomatis (AI)</p>
                <p className="text-[11px] text-blue-100 leading-tight truncate">
                  {receiptImageUrl ? "Foto struk terpasang" : "Menu & harga otomatis terisi"}
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
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-60"
            >
              {isOcrProcessing ? (
                <>
                  <CircleNotch size={14} weight="bold" className="animate-spin text-blue-600" />
                  <span>{ocrStep || "Membaca..."}</span>
                </>
              ) : (
                <>
                  <Camera size={15} weight="bold" />
                  <span>{receiptImageUrl ? "Ganti Foto" : "Foto Struk"}</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Spot Title */}
          <div>
            <label htmlFor={titleInputId} className="block text-xs font-bold text-slate-800 mb-1">
              Nama Tempat / Lokasi <span className="text-rose-500">*</span>
            </label>
            <input
              id={titleInputId}
              type="text"
              required
              placeholder="Contoh: Kopi Kenangan, Lawson, Bakso Solo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
            />
          </div>

          {/* Who Paid Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Siapa yang Nalangin di Kasir?
              </label>
              <span className="text-[11px] text-slate-400">Penerima transfer spot ini</span>
            </div>

            {/* Member selector chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
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
                    className={`inline-flex h-8.5 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{member.display_name}</span>
                    {isMe && <span className="text-[10px] opacity-75">(Kamu)</span>}
                    {member.is_host && !isMe && <span className="text-[10px] opacity-75">(Host)</span>}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedPayerId("custom")}
                className={`inline-flex h-8.5 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-bold transition-all ${
                  selectedPayerId === "custom"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Plus size={12} weight="bold" />
                <span>Orang Lain</span>
              </button>
            </div>

            {selectedPayerId === "custom" && (
              <div className="mt-2">
                <input
                  id={payerCustomInputId}
                  type="text"
                  placeholder="Ketik nama yang nalangin (misal: Budi)"
                  value={customPayerName}
                  onChange={(e) => setCustomPayerName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
              </div>
            )}
          </div>

          {/* Payer Payout Info (Rekening / QRIS) - Progressive Disclosure Accordion */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3 transition-all">
            <button
              type="button"
              onClick={() => setShowPayoutDetails(!showPayoutDetails)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Bank size={15} weight="bold" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    Rekening & QRIS Nalangin
                    <span className="ml-1 text-[10px] font-normal text-slate-500">(Opsional)</span>
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {bankName || qrisImageUrl
                      ? `${bankName || "QRIS"} sudah terpasang`
                      : "Klik untuk tambah nomor rekening / upload QRIS"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 shrink-0 inline-flex items-center gap-1 ml-2">
                {showPayoutDetails ? (
                  <>
                    <span>Tutup</span>
                    <CaretUp size={12} weight="bold" />
                  </>
                ) : (
                  <>
                    <Plus size={12} weight="bold" />
                    <span>Atur Rekening</span>
                    <CaretDown size={12} weight="bold" />
                  </>
                )}
              </span>
            </button>

            {showPayoutDetails && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
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
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
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
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* QRIS Upload */}
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
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
            )}
          </div>

          {/* Items Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Daftar Menu ({items.length})
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex h-8 items-center gap-1 rounded-xl bg-blue-50 px-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 active:scale-95 transition-all"
              >
                <Plus size={13} weight="bold" />
                <span>Tambah Menu</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-3 shadow-2xs space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 w-5 shrink-0 text-center">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Nama Menu (cth: Es Americano)"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      className="flex-1 h-9.5 rounded-xl border border-slate-200 bg-slate-50/40 px-3 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(item.id)}
                        aria-label="Hapus menu"
                        className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pl-7">
                    <div className="flex-1 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
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
                        className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50/40 pl-7 pr-2.5 text-xs font-bold font-mono text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">Qty:</span>
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
                        className="w-11 h-9 rounded-xl border border-slate-200 bg-slate-50/40 text-center text-xs font-bold font-mono text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { is_shared: !item.is_shared })}
                      className={`inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-[11px] font-bold transition-all shrink-0 ${
                        item.is_shared
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title="Makan bareng dibagi rata"
                    >
                      <UsersThree size={13} weight="bold" />
                      <span>{item.is_shared ? "Bareng" : "Pribadi"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax, Service, Discount - Progressive Disclosure Accordion */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3 transition-all">
            <button
              type="button"
              onClick={() => setShowTaxDetails(!showTaxDetails)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Pajak, Service & Diskon
                  <span className="ml-1 text-[10px] font-normal text-slate-500">(Opsional)</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  {tax > 0 || service > 0 || discount > 0
                    ? `Total penyesuaian: ${safeIDR(tax + service - discount)}`
                    : "PB1, service charge, atau potongan diskon"}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 inline-flex items-center gap-1">
                {showTaxDetails ? (
                  <>
                    <span>Tutup</span>
                    <CaretUp size={12} weight="bold" />
                  </>
                ) : (
                  <>
                    <Plus size={12} weight="bold" />
                    <span>Atur Pajak</span>
                    <CaretDown size={12} weight="bold" />
                  </>
                )}
              </span>
            </button>

            {showTaxDetails && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor={taxInputId} className="block text-[10px] font-bold text-slate-600 mb-1">
                    Pajak (PB1)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      id={taxInputId}
                      type="number"
                      value={taxAmount}
                      onChange={(e) =>
                        setTaxAmount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full h-8.5 rounded-xl border border-slate-200 bg-white pl-6 pr-1.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={serviceInputId} className="block text-[10px] font-bold text-slate-600 mb-1">
                    Service
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      id={serviceInputId}
                      type="number"
                      value={serviceAmount}
                      onChange={(e) =>
                        setServiceAmount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full h-8.5 rounded-xl border border-slate-200 bg-white pl-6 pr-1.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={discountInputId} className="block text-[10px] font-bold text-slate-600 mb-1">
                    Diskon
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      id={discountInputId}
                      type="number"
                      value={discountAmount}
                      onChange={(e) =>
                        setDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full h-8.5 rounded-xl border border-slate-200 bg-white pl-6 pr-1.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Modal Sticky Footer */}
        <div className="border-t border-slate-100 bg-white px-5 py-3.5 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Struk
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
              className="h-10.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex h-10.5 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={15} weight="bold" className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} weight="bold" />
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
