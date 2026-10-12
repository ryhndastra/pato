import type { RoomDetail } from "./types";
import { safeIDR } from "./money";

interface RoomSummaryProps {
  room: RoomDetail;
}

export function RoomSummary({ room }: RoomSummaryProps) {
  const hasExtra =
    (room.tax_amount ?? 0) !== 0 ||
    (room.service_amount ?? 0) !== 0 ||
    (room.discount_amount ?? 0) !== 0;

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-haze px-4 py-4">
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>Subtotal</span>
        <span className="font-mono">{safeIDR(room.subtotal)}</span>
      </div>

      {hasExtra && (
        <div className="flex items-center justify-between text-sm text-ink-soft">
          <span>Pajak, Service & Diskon</span>
          <span className="font-mono">
            {safeIDR((room.tax_amount ?? 0) + (room.service_amount ?? 0) - (room.discount_amount ?? 0))}
          </span>
        </div>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-hairline pt-2">
        <span className="text-[15px] font-bold text-ink">Total Tagihan</span>
        <span className="font-mono text-[17px] font-bold text-ink">
          {safeIDR(room.grand_total)}
        </span>
      </div>
    </section>
  );
}
