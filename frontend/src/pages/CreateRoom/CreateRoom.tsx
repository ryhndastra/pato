import { CreateRoomHeader } from "./CreateRoomHeader";
import { RoomDetailsCard } from "./RoomDetailsCard";
import { ReceiptOcrScannerCard } from "./ReceiptOcrScannerCard";
import { PaymentQrisCard } from "./PaymentQrisCard";
import { ItemEntrySection } from "./ItemEntrySection";
import { TaxDiscountCard } from "./TaxDiscountCard";
import { BillSummaryCard } from "./BillSummaryCard";
import { CreateRoomSuccess } from "./CreateRoomSuccess";
import { useCreateRoomForm } from "./useCreateRoomForm";
import { formatIDR } from "../../lib/format";
import { CircleNotch, ShareNetwork } from "@phosphor-icons/react";

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

  if (created) {
    return (
      <CreateRoomSuccess
        roomCode={created.room_code}
        shareUrl={created.share_url}
        title={title}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-28 lg:pb-16">
      {/* Curved Blue Header matching Dashboard */}
      <CreateRoomHeader hasQris={Boolean(qrisImageUrl)} />

      {/* Floating Main Form Content overlapping header */}
      <main className="relative z-10 mx-auto -mt-10 max-w-[1120px] px-4 sm:-mt-12 sm:px-6 lg:-mt-14 lg:px-8">
        <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Left Column: Form Details & Items */}
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            {/* Event Title & Host */}
            <RoomDetailsCard
              title={title}
              setTitle={setTitle}
              hostName={hostName}
              setHostName={setHostName}
            />

            {/* AI OCR Receipt Scanner: Scan first, then manual edit */}
            <ReceiptOcrScannerCard
              receiptImageUrl={receiptImageUrl}
              onReceiptImageChange={setReceiptImageUrl}
              onOcrExtracted={handleOcrExtracted}
            />

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
            />

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
          </div>

          {/* Right Column: Live Bill Summary & Action (Sticky on Desktop) */}
          <div className="mt-6 lg:sticky lg:top-20 lg:col-span-5 lg:mt-0 xl:col-span-4">
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
            />
          </div>

          {/* Mobile Bottom Floating Bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-slate-400">
                  Total ({items.length} menu)
                </span>
                <span className="truncate font-mono text-base font-extrabold text-blue-600">
                  {formatIDR(grandTotal)}
                </span>
              </div>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-600/20 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
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
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
