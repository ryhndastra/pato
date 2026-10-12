export interface MyRoom {
  room_code: string;
  title: string;
  status: "DRAFT" | "CLAIMING" | "LOCKED" | "CLOSED";
  grand_total: number;
  created_at: string;
}

export type RoomStatus = MyRoom["status"];

export interface StatusStyleConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  pulse?: boolean;
  desc: string;
}

export const STATUS_STYLE: Record<RoomStatus, StatusStyleConfig> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    dotClass: "bg-amber-500",
    desc: "Menunggu finalisasi struk",
  },
  CLAIMING: {
    label: "Live Klaim",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    dotClass: "bg-emerald-500",
    pulse: true,
    desc: "Teman sedang klaim pesanan",
  },
  LOCKED: {
    label: "Terkunci",
    badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
    dotClass: "bg-blue-600",
    desc: "Nominal siap dibayar via QRIS",
  },
  CLOSED: {
    label: "Selesai",
    badgeClass: "bg-slate-100 text-slate-600 ring-1 ring-slate-300/40",
    dotClass: "bg-slate-400",
    desc: "Semua tagihan telah lunas",
  },
};

export const STATUS_FILTERS: { id: "ALL" | RoomStatus; label: string }[] = [
  { id: "ALL", label: "Semua" },
  { id: "CLAIMING", label: "Live Klaim" },
  { id: "LOCKED", label: "Terkunci" },
  { id: "DRAFT", label: "Draft" },
  { id: "CLOSED", label: "Selesai" },
];

export function formatRoomDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
