import { HostPaymentTargetCard } from "./HostPaymentTargetCard";
import { ReceiptImageModal } from "./ReceiptImageModal";
import { ReceiptExportModal } from "./ReceiptExportModal";
import { RoomClosedCelebrationModal } from "./RoomClosedCelebrationModal";
import { AddReceiptModal } from "./AddReceiptModal";
import type { RoomDetail, RoomMember } from "./types";

interface RoomModalsProps {
  room: RoomDetail;
  members: RoomMember[];
  me: RoomMember | null;
  showPaymentInfoModal: boolean;
  onClosePaymentInfoModal: () => void;
  receiptImageOpen: boolean;
  onCloseReceiptImageModal: () => void;
  activeReceiptImageUrl: string | null;
  onCloseActiveReceiptImageUrl: () => void;
  addReceiptOpen: boolean;
  onCloseAddReceipt: () => void;
  onReceiptAdded: () => void;
  aestheticReceiptOpen: boolean;
  onCloseAestheticReceipt: () => void;
  celebrationOpen: boolean;
  onCloseCelebration: () => void;
  onOpenAestheticReceipt: () => void;
}

export function RoomModals({
  room,
  members,
  me,
  showPaymentInfoModal,
  onClosePaymentInfoModal,
  receiptImageOpen,
  onCloseReceiptImageModal,
  activeReceiptImageUrl,
  onCloseActiveReceiptImageUrl,
  addReceiptOpen,
  onCloseAddReceipt,
  onReceiptAdded,
  aestheticReceiptOpen,
  onCloseAestheticReceipt,
  celebrationOpen,
  onCloseCelebration,
  onOpenAestheticReceipt,
}: RoomModalsProps) {
  return (
    <>
      {/* 1. Modal for viewing Bank Account & QRIS preview anytime */}
      {showPaymentInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-backdrop-fade"
          role="dialog"
          aria-modal="true"
          onClick={onClosePaymentInfoModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl animate-dialog-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Rekening & QRIS Host
              </span>
              <button
                type="button"
                onClick={onClosePaymentInfoModal}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <HostPaymentTargetCard room={room} />
          </div>
        </div>
      )}

      {/* 2. Modal for viewing original restaurant receipt photo */}
      {receiptImageOpen && room.receipt_image_url && (
        <ReceiptImageModal
          imageUrl={room.receipt_image_url}
          onClose={onCloseReceiptImageModal}
        />
      )}

      {/* 3. Modal for viewing spot-specific receipt photo */}
      {activeReceiptImageUrl && (
        <ReceiptImageModal
          imageUrl={activeReceiptImageUrl}
          onClose={onCloseActiveReceiptImageUrl}
        />
      )}

      {/* 4. Modal for adding multi-receipt from another spot */}
      <AddReceiptModal
        isOpen={addReceiptOpen}
        onClose={onCloseAddReceipt}
        roomCode={room.room_code}
        members={members}
        currentMember={me}
        onReceiptAdded={onReceiptAdded}
      />

      {/* 5. Modal for viewing aesthetic digital split bill receipt */}
      {aestheticReceiptOpen && (
        <ReceiptExportModal
          room={room}
          onClose={onCloseAestheticReceipt}
        />
      )}

      {/* 6. Modal for celebrating closed room completion */}
      <RoomClosedCelebrationModal
        room={room}
        isOpen={celebrationOpen}
        onClose={onCloseCelebration}
        onOpenReceipt={onOpenAestheticReceipt}
      />
    </>
  );
}
