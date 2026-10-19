import { useState } from "react";
import { CreateRoomHeader } from "./CreateRoomHeader";
import { RoomDetailsCard } from "./RoomDetailsCard";
import { ReceiptOcrScannerCard } from "./ReceiptOcrScannerCard";
import { VoiceNoteRecorderCard } from "./VoiceNoteRecorderCard";
import { PaymentQrisCard } from "./PaymentQrisCard";
import { ItemEntrySection } from "./ItemEntrySection";
import { TaxDiscountCard } from "./TaxDiscountCard";
import { BillSummaryCard } from "./BillSummaryCard";
import { CreateRoomSuccess } from "./CreateRoomSuccess";
import { useCreateRoomForm } from "./useCreateRoomForm";
import { formatIDR } from "../../lib/format";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  CircleNotch,
  Microphone,
  PencilSimple,
  ShareNetwork,
} from "@phosphor-icons/react";

type WizardStep = 1 | 2 | 3;
type BillInputTab = "ocr" | "voice" | "manual";

export function CreateRoom() {
  const {
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
    roundMode,
    setRoundMode,
    syncFromProfile,
    isProfilePayoutAvailable,
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
  } = useCreateRoomForm();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [billInputTab, setBillInputTab] = useState<BillInputTab>("ocr");

  if (created) {
    return (
      <CreateRoomSuccess
        roomCode={created.room_code}
        shareUrl={created.share_url}
        title={title}
      />
    );
  }

  const isStep1Valid = title.trim().length >= 3 && hostName.trim().length >= 2;
  const isStep2Valid = items.length > 0;

  function goToStep(step: WizardStep) {
    if (step === 2 && !isStep1Valid) return;
    if (step === 3 && (!isStep1Valid || !isStep2Valid)) return;
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-36 lg:pb-16">
      {/* Curved Blue Header */}
      <CreateRoomHeader hasQris={Boolean(qrisImageUrl)} />

      {/* Main Content overlapping header */}
      <main className="relative z-10 mx-auto -mt-10 max-w-[1120px] px-4 sm:-mt-12 sm:px-6 lg:-mt-14 lg:px-8">
        {/* Progressive 3-Step Wizard Progress Bar */}
        <div className="mb-6 rounded-3xl border border-white/80 bg-white/95 p-2 sm:p-3 shadow-lg shadow-blue-900/5 backdrop-blur-md">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => goToStep(1)}
              className={`flex items-center gap-2 sm:gap-3 rounded-2xl px-2.5 py-2 sm:px-4 sm:py-3 transition-all text-left min-w-0 ${
                currentStep === 1
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/20"
                  : isStep1Valid
                    ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span
                className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] sm:text-xs font-black ${
                  currentStep === 1
                    ? "bg-white text-blue-600"
                    : isStep1Valid
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {isStep1Valid && currentStep !== 1 ? (
                  <CheckCircle size={15} weight="fill" />
                ) : (
                  "1"
                )}
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="block text-[8px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80 leading-tight">
                  Langkah 1
                </span>
                <span className="block truncate text-[11px] sm:text-sm font-black leading-tight">
                  Acara & Host
                </span>
              </div>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => isStep1Valid && goToStep(2)}
              disabled={!isStep1Valid}
              className={`flex items-center gap-2 sm:gap-3 rounded-2xl px-2.5 py-2 sm:px-4 sm:py-3 transition-all text-left min-w-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                currentStep === 2
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/20"
                  : isStep2Valid
                    ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span
                className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] sm:text-xs font-black ${
                  currentStep === 2
                    ? "bg-white text-blue-600"
                    : isStep2Valid
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {isStep2Valid && currentStep !== 2 ? (
                  <CheckCircle size={15} weight="fill" />
                ) : (
                  "2"
                )}
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="block text-[8px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80 leading-tight">
                  Langkah 2
                </span>
                <span className="block truncate text-[11px] sm:text-sm font-black leading-tight">
                  Menu & Tagihan
                </span>
              </div>
            </button>

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => isStep1Valid && isStep2Valid && goToStep(3)}
              disabled={!isStep1Valid || !isStep2Valid}
              className={`flex items-center gap-2 sm:gap-3 rounded-2xl px-2.5 py-2 sm:px-4 sm:py-3 transition-all text-left min-w-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                currentStep === 3
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/20"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span
                className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] sm:text-xs font-black ${
                  currentStep === 3
                    ? "bg-white text-blue-600"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                3
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="block text-[8px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80 leading-tight">
                  Langkah 3
                </span>
                <span className="block truncate text-[11px] sm:text-sm font-black leading-tight">
                  Pembayaran
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Wizard Form Layout */}
        <form
          id="create-room-form"
          onSubmit={handleSubmit}
          className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 animate-screen-enter"
        >
          {/* Left Column: Active Step Card Content */}
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            {/* STEP 1: Acara & Host */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-sheet-up">
                <RoomDetailsCard
                  title={title}
                  setTitle={setTitle}
                  hostName={hostName}
                  setHostName={setHostName}
                />

                {/* Step 1 Navigation CTA Card */}
                <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Sudah selesai mengisi info acara?
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Lanjut masukkan tagihan atau scan struk di langkah berikutnya.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    disabled={!isStep1Valid}
                    className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all"
                  >
                    <span>Lanjut ke Tagihan</span>
                    <ArrowRight size={16} weight="bold" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Tagihan & Menu (3-Mode Input Switcher) */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-sheet-up">
                {/* 3-Mode Input Selector Header */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
                  <div className="mb-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pilih Cara Input Tagihan
                    </span>
                    <h2 className="text-sm font-black text-slate-900 sm:text-base">
                      Bagaimana kamu ingin memasukkan menu pesanan?
                    </h2>
                  </div>

                  {/* Segmented 3-Way Tabs */}
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100/80 p-1.5">
                    <button
                      type="button"
                      onClick={() => setBillInputTab("ocr")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                        billInputTab === "ocr"
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Camera size={16} weight="bold" />
                      <span className="hidden sm:inline">Scan Foto Struk</span>
                      <span className="sm:hidden">Struk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBillInputTab("voice")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                        billInputTab === "voice"
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Microphone size={16} weight="bold" />
                      <span className="hidden sm:inline">Voice Note AI</span>
                      <span className="sm:hidden">Suara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBillInputTab("manual")}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                        billInputTab === "manual"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <PencilSimple size={16} weight="bold" />
                      <span className="hidden sm:inline">Ketik Manual</span>
                      <span className="sm:hidden">Manual</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Bill Input Tab Component */}
                {billInputTab === "ocr" && (
                  <ReceiptOcrScannerCard
                    receiptImageUrl={receiptImageUrl}
                    onReceiptImageChange={setReceiptImageUrl}
                    onOcrExtracted={handleOcrExtracted}
                  />
                )}

                {billInputTab === "voice" && (
                  <VoiceNoteRecorderCard onExtracted={handleOcrExtracted} />
                )}

                {/* Menu Items List */}
                <ItemEntrySection
                  items={items}
                  onAddItem={addItem}
                  onUpdateQuantity={updateItemQuantity}
                  onRemoveItem={removeItem}
                />

                {/* Taxes, Service Charges & Discounts */}
                <TaxDiscountCard
                  taxAmount={taxAmount}
                  setTaxAmount={setTaxAmount}
                  onApplyTaxPercent={applyTaxPercent}
                  serviceAmount={serviceAmount}
                  setServiceAmount={setServiceAmount}
                  onApplyServicePercent={applyServicePercent}
                  discountAmount={discountAmount}
                  setDiscountAmount={setDiscountAmount}
                />

                {/* Step 2 Navigation CTA Bar */}
                <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    <ArrowLeft size={16} weight="bold" />
                    <span>Kembali</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    disabled={!isStep2Valid}
                    className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all"
                  >
                    <span>Lanjut ke Pembayaran</span>
                    <ArrowRight size={16} weight="bold" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Pembayaran & Buka Room */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-sheet-up">
                {/* QRIS Photo Upload & Payment Details */}
                <PaymentQrisCard
                  bankName={bankName}
                  setBankName={setBankName}
                  bankAccountNo={bankAccountNo}
                  setBankAccountNo={setBankAccountNo}
                  bankAccountName={bankAccountName}
                  setBankAccountName={setBankAccountName}
                  qrisImageUrl={qrisImageUrl}
                  isProcessingQris={isProcessingQris}
                  qrisError={qrisError}
                  onQrisFile={handleQrisFile}
                  onRemoveQris={removeQris}
                  isProfilePayoutAvailable={isProfilePayoutAvailable}
                  onSyncFromProfile={syncFromProfile}
                />

                {/* Step 3 Navigation CTA Bar */}
                <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    <ArrowLeft size={16} weight="bold" />
                    <span>Edit Menu & Pajak</span>
                  </button>

                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-7 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:opacity-95 active:scale-95 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all"
                  >
                    {submitting ? (
                      <>
                        <CircleNotch size={16} weight="bold" className="animate-spin" />
                        <span>Membuka Room...</span>
                      </>
                    ) : (
                      <>
                        <ShareNetwork size={16} weight="bold" />
                        <span>Buka Room Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Bill Summary & Action (Sticky on Desktop) */}
          <div className="mt-5 lg:sticky lg:top-20 lg:col-span-5 lg:mt-0 xl:col-span-4">
            <BillSummaryCard
              subtotal={subtotal}
              taxAmount={taxAmount}
              serviceAmount={serviceAmount}
              discountAmount={discountAmount}
              grandTotal={grandTotal}
              itemsCount={items.length}
              canSubmit={canSubmit}
              submitting={submitting}
              error={error}
              roundMode={roundMode}
              setRoundMode={setRoundMode}
            />
          </div>
        </form>
      </main>

      {/* Mobile Bottom Frosted Floating Bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-4 pt-3 pb-[calc(max(env(safe-area-inset-bottom,0px),0px)+0.75rem)] shadow-[0_-8px_25px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden animate-sheet-up">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total ({items.length} menu)
            </span>
            <span className="truncate font-mono tabular-nums text-lg font-black text-slate-900">
              {formatIDR(grandTotal)}
            </span>
          </div>

          {currentStep === 1 ? (
            <button
              type="button"
              onClick={() => goToStep(2)}
              disabled={!isStep1Valid}
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            >
              <span>Lanjut</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          ) : currentStep === 2 ? (
            <button
              type="button"
              onClick={() => goToStep(3)}
              disabled={!isStep2Valid}
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            >
              <span>Pembayaran</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          ) : (
            <button
              type="submit"
              form="create-room-form"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.28)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <ShareNetwork size={16} weight="bold" />
                  <span>Buka Room</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
