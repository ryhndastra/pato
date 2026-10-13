import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { apiPost, ApiError } from "../../lib/api";
import { compressImageFile } from "../../lib/imageCompression";
import { setHostGuestToken } from "../RoomJoin/guestToken";
import type { DraftItem, CreateRoomResponse } from "./types";

export function useCreateRoomForm() {
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();

  const [title, setTitle] = useState(() => searchParams.get("event") ?? "");
  const [hostName, setHostName] = useState(
    () => searchParams.get("host") ?? user?.name ?? "",
  );
  const [bankName, setBankName] = useState(() => {
    try {
      const saved = localStorage.getItem("pato_default_payout_info");
      if (saved) return JSON.parse(saved).bankName ?? "";
    } catch {
      // ignore
    }
    return "";
  });
  const [bankAccountNo, setBankAccountNo] = useState(() => {
    try {
      const saved = localStorage.getItem("pato_default_payout_info");
      if (saved) return JSON.parse(saved).accountNo ?? "";
    } catch {
      // ignore
    }
    return "";
  });
  const [bankAccountName, setBankAccountName] = useState(() => {
    try {
      const saved = localStorage.getItem("pato_default_payout_info");
      if (saved) return JSON.parse(saved).accountName ?? "";
    } catch {
      // ignore
    }
    return user?.name ?? "";
  });
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [isProcessingQris, setIsProcessingQris] = useState(false);
  const [qrisError, setQrisError] = useState<string | null>(null);

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

  function handleOcrExtracted(result: {
    title?: string;
    items: Array<{ name: string; unitPrice: number; quantity: number }>;
    taxAmount?: number;
    serviceAmount?: number;
  }) {
    if (result.title && !title) setTitle(result.title);
    if (result.items?.length > 0) {
      setItems(result.items.map((it) => ({ ...it, id: crypto.randomUUID() })));
    }
    if (result.taxAmount !== undefined) setTaxAmount(String(result.taxAmount));
    if (result.serviceAmount !== undefined) setServiceAmount(String(result.serviceAmount));
  }

  function addItem(item: Omit<DraftItem, "id">) {
    setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  }

  function updateItemQuantity(id: string, delta: number) {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is DraftItem => item !== null),
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleQrisFile(file: File) {
    setQrisError(null);
    setIsProcessingQris(true);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setQrisImageUrl(compressedDataUrl);
    } catch (err) {
      setQrisError(err instanceof Error ? err.message : "Gagal memproses gambar QRIS");
    } finally {
      setIsProcessingQris(false);
    }
  }

  function removeQris() {
    setQrisImageUrl(null);
    setQrisError(null);
  }

  function applyTaxPercent(percent: number) {
    const calculated = Math.round((subtotal * percent) / 100);
    setTaxAmount(String(calculated));
  }

  function applyServicePercent(percent: number) {
    const calculated = Math.round((subtotal * percent) / 100);
    setServiceAmount(String(calculated));
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
          qris_image_url: qrisImageUrl ?? undefined,
          receipt_image_url: receiptImageUrl ?? undefined,
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
      setHostGuestToken(res.room_code, res.host_token);
      setCreated(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal terhubung ke server.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    title,
    setTitle,
    hostName,
    setHostName,
    bankName,
    setBankName,
    bankAccountNo,
    setBankAccountNo,
    bankAccountName,
    setBankAccountName,
    qrisImageUrl,
    isProcessingQris,
    qrisError,
    handleQrisFile,
    removeQris,
    receiptImageUrl,
    setReceiptImageUrl,
    handleOcrExtracted,
    items,
    addItem,
    updateItemQuantity,
    removeItem,
    taxAmount,
    setTaxAmount,
    applyTaxPercent,
    serviceAmount,
    setServiceAmount,
    applyServicePercent,
    discountAmount,
    setDiscountAmount,
    subtotal,
    grandTotal,
    error,
    submitting,
    canSubmit,
    created,
    handleSubmit,
  };
}

