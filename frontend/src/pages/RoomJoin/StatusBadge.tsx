import type { RoomStatus } from "./types";

const STATUS_STYLE: Record<RoomStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-warning/10 text-warning" },
  CLAIMING: { label: "Live", className: "bg-success-bg text-success" },
  LOCKED: { label: "Terkunci", className: "bg-tint text-brand" },
  CLOSED: { label: "Selesai", className: "bg-haze text-ink-muted" },
};

export function StatusBadge({ status }: { status: RoomStatus }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.className}`}>
      {style.label}
    </span>
  );
}
