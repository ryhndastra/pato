import { MagnifyingGlass, Plus, Sparkle } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import mascotCelebrating from "../../assets/pato_mascot_celebrating.jpg";
import { RoomCard } from "./RoomCard";
import type { MyRoom, RoomStatus } from "./roomStatus";
import type { NudgeInitialData } from "./WhatsAppNudgeModal";

interface RoomListProps {
  rooms: MyRoom[] | null;
  error: string | null;
  searchQuery: string;
  statusFilter: "ALL" | RoomStatus;
  onOpenNudge: (data: NudgeInitialData) => void;
  onResetFilters: () => void;
  onDeleted: (roomCode: string) => void;
}

export function RoomList({
  rooms,
  error,
  searchQuery,
  statusFilter,
  onOpenNudge,
  onResetFilters,
  onDeleted,
}: RoomListProps) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/70 p-5 text-center shadow-2xs">
        <p className="text-xs font-bold text-rose-700 sm:text-sm">{error}</p>
      </div>
    );
  }

  if (!rooms) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 rounded-3xl border border-slate-100 bg-white p-5 shadow-2xs animate-pulse"
          >
            <div className="h-4 w-24 rounded-full bg-slate-100" />
            <div className="mt-4 h-5 w-3/4 rounded-lg bg-slate-100" />
            <div className="mt-6 h-12 w-full rounded-2xl bg-slate-50" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state when no rooms exist
  if (rooms.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)] sm:p-10 animate-fade-up">
        {/* Mascot illustration */}
        <div className="relative mx-auto mb-4 inline-block">
          <div className="relative h-28 w-28 overflow-hidden rounded-3xl border-2 border-blue-100 bg-white p-1.5 shadow-sm sm:h-32 sm:w-32">
            <img
              src={mascotCelebrating}
              alt="Pato Mascot Celebrating"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <Sparkle size={14} weight="fill" />
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Belum Ada Meja Patungan</h3>
        <p className="mx-auto mt-1.5 max-w-[42ch] text-xs leading-relaxed text-slate-500 sm:text-sm sm:mt-2">
          Buat meja patungan pertamamu, upload foto struk kasir atau input menu langsung, lalu bagikan tautan unik ke temanmu.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate("/create")}
            className="group flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-700 active:scale-95 sm:gap-2.5"
          >
            <span>Buat Meja Sekarang</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white transition-transform group-hover:rotate-90">
              <Plus size={13} weight="bold" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/create?event=Makan+Siang+Kantor")}
            className="h-11 rounded-full border border-slate-200/80 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
          >
            Makan Siang Kantor
          </button>
        </div>
      </div>
    );
  }

  // Filtered rooms
  const filtered = rooms.filter((room) => {
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const cleanQuery = query.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const cleanCode = room.room_code.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const words = query.split(/\s+/).filter(Boolean);

      // Multi-word title match
      const matchesTitle = words.every((w) => room.title.toLowerCase().includes(w));

      // Code match (exact, substring, or stripped of punctuation)
      const matchesCode =
        room.room_code.toLowerCase().includes(query) ||
        (cleanQuery.length >= 2 && cleanCode.includes(cleanQuery));

      // Status label alias match
      const matchesStatus =
        ((query.includes("selesai") || query.includes("lunas")) && room.status === "CLOSED") ||
        (query.includes("klaim") && room.status === "CLAIMING") ||
        (query.includes("kunci") && room.status === "LOCKED") ||
        (query.includes("draft") && room.status === "DRAFT");

      return matchesTitle || matchesCode || matchesStatus;
    }
    return statusFilter === "ALL" || room.status === statusFilter;
  });

  // Empty state when search or filter returns no results
  if (filtered.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)] sm:p-10 animate-fade-up">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          <MagnifyingGlass size={24} weight="bold" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-900 sm:text-base">Tidak Ada Room Ditemukan</h3>
        <p className="mx-auto mt-1 max-w-[34ch] text-xs text-slate-400">
          Tidak ada room yang sesuai dengan pencarian &quot;{searchQuery}&quot; atau filter yang dipilih.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-4 rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 active:scale-95"
        >
          Reset Pencarian & Filter
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {filtered.map((room, idx) => (
        <RoomCard
          key={room.room_code}
          room={room}
          index={idx}
          onOpenNudge={onOpenNudge}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
}
