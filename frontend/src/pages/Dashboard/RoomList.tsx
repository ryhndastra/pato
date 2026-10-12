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
}

export function RoomList({
  rooms,
  error,
  searchQuery,
  statusFilter,
  onOpenNudge,
  onResetFilters,
}: RoomListProps) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="rounded-[1.75rem] bg-rose-50/80 p-1.5 ring-1 ring-rose-200 sm:rounded-[2rem]">
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-white p-5 text-center shadow-xs sm:rounded-[calc(2rem-0.5rem)]">
          <p className="text-xs font-bold text-rose-700 sm:text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!rooms) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 rounded-[1.75rem] bg-slate-200/50 p-1 ring-1 ring-black/5 animate-pulse sm:h-44 sm:rounded-[2rem] sm:p-1.5"
          >
            <div className="h-full rounded-[calc(1.75rem-0.25rem)] bg-white sm:rounded-[calc(2rem-0.375rem)]" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state when no rooms exist
  if (rooms.length === 0) {
    return (
      <div className="rounded-[2rem] bg-slate-200/60 p-1.5 ring-1 ring-black/5 sm:rounded-[2.25rem] sm:p-2">
        <div className="flex flex-col items-center rounded-[calc(2rem-0.375rem)] bg-white px-5 py-8 text-center shadow-xs sm:rounded-[calc(2.25rem-0.5rem)] sm:px-6 sm:py-12">
          {/* Mascot illustration */}
          <div className="relative mb-4 rounded-2xl bg-blue-50/80 p-1.5 ring-1 ring-blue-100 shadow-xs sm:mb-5 sm:rounded-[2rem] sm:p-2">
            <div className="h-24 w-24 overflow-hidden rounded-[calc(1rem-0.25rem)] bg-white p-1 sm:h-28 sm:w-28 sm:rounded-[calc(2rem-0.5rem)]">
              <img
                src={mascotCelebrating}
                alt="Pato Mascot Celebrating"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs sm:h-7 sm:w-7">
              <Sparkle size={13} weight="fill" />
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-ink sm:text-xl">Belum Ada Meja Patungan</h3>
          <p className="mt-1.5 max-w-[40ch] text-xs leading-relaxed text-ink-muted sm:mt-2">
            Buat meja patungan pertamamu, upload foto struk kasir atau input menu langsung, lalu bagikan tautan unik ke temanmu.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:mt-6 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/create")}
              className="group flex h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.98] sm:h-11 sm:px-5 sm:gap-2.5"
            >
              <span>Buat Meja Sekarang</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white transition-transform group-hover:rotate-90 sm:h-6 sm:w-6">
                <Plus size={13} weight="bold" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/create?event=Makan+Siang+Kantor")}
              className="h-10 rounded-full border border-hairline bg-slate-50 px-3.5 text-xs font-bold text-ink transition-all hover:bg-slate-100 sm:h-11 sm:px-4"
            >
              Makan Siang Kantor
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered rooms
  const filtered = rooms.filter((room) => {
    const matchesStatus = statusFilter === "ALL" || room.status === statusFilter;
    const matchesSearch = room.title
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Empty state when search or filter returns no results
  if (filtered.length === 0) {
    return (
      <div className="rounded-[1.75rem] bg-slate-200/50 p-1 ring-1 ring-black/5 sm:rounded-[2rem] sm:p-1.5">
        <div className="flex flex-col items-center rounded-[calc(1.75rem-0.25rem)] bg-white px-5 py-8 text-center shadow-xs sm:rounded-[calc(2rem-0.375rem)] sm:px-6 sm:py-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-ink-muted sm:h-12 sm:w-12">
            <MagnifyingGlass size={22} weight="bold" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-ink sm:text-base">Tidak Ada Room Ditemukan</h3>
          <p className="mt-1 max-w-[32ch] text-xs text-ink-muted">
            Tidak ada room yang sesuai dengan pencarian &quot;{searchQuery}&quot; atau filter yang dipilih.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-3.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-slate-200 sm:mt-4 sm:px-4 sm:py-2"
          >
            Reset Pencarian & Filter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {filtered.map((room) => (
        <RoomCard key={room.room_code} room={room} onOpenNudge={onOpenNudge} />
      ))}
    </div>
  );
}
