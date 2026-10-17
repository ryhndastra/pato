import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ClockCounterClockwise,
  Coins,
  MagnifyingGlass,
  Plus,
  Receipt,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { useMyRooms } from "../Dashboard/useMyRooms";
import { RoomCard } from "../Dashboard/RoomCard";
import { WhatsAppNudgeModal, type NudgeInitialData } from "../Dashboard/WhatsAppNudgeModal";
import { formatIDR } from "../../lib/format";

export function History() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { rooms, error, removeRoom } = useMyRooms(token);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 120);
  const [filterType, setFilterType] = useState<"CLOSED" | "ALL" | "ACTIVE">("CLOSED");

  const [nudgeModalOpen, setNudgeModalOpen] = useState(false);
  const [nudgeData, setNudgeData] = useState<NudgeInitialData | null>(null);

  const isDebouncing = searchQuery !== debouncedSearchQuery;

  const closedRooms = useMemo(
    () => rooms?.filter((r) => r.status === "CLOSED") ?? [],
    [rooms],
  );

  const totalSpentSettled = useMemo(
    () => closedRooms.reduce((sum, r) => sum + r.grand_total, 0),
    [closedRooms],
  );

  // Search matches title and room_code; if query is active, search across all statuses
  const filteredRooms = useMemo(() => {
    if (!rooms) return null;

    const query = debouncedSearchQuery.trim().toLowerCase();

    return rooms.filter((room) => {
      // 1. Search Query Check
      if (query) {
        const cleanQuery = query.replace(/[^a-z0-9]/gi, "").toLowerCase();
        const cleanCode = room.room_code.replace(/[^a-z0-9]/gi, "").toLowerCase();
        const words = query.split(/\s+/).filter(Boolean);

        const matchesTitle = words.every((w) => room.title.toLowerCase().includes(w));
        const matchesCode =
          room.room_code.toLowerCase().includes(query) ||
          (cleanQuery.length >= 2 && cleanCode.includes(cleanQuery));
        const matchesStatus =
          (query.includes("selesai") || query.includes("lunas")) && room.status === "CLOSED" ||
          query.includes("klaim") && room.status === "CLAIMING" ||
          query.includes("kunci") && room.status === "LOCKED" ||
          query.includes("draft") && room.status === "DRAFT";

        return matchesTitle || matchesCode || matchesStatus;
      }

      // 2. Status filter when not searching
      if (filterType === "CLOSED" && room.status !== "CLOSED") return false;
      if (filterType === "ACTIVE" && room.status === "CLOSED") return false;

      return true;
    });
  }, [rooms, filterType, debouncedSearchQuery]);

  function handleOpenNudge(data: NudgeInitialData) {
    setNudgeData(data);
    setNudgeModalOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pb-20 sm:gap-7 lg:gap-8 bg-slate-50/60 min-h-dvh">
      {/* 1. Curved Blue Gradient Header matching Dashboard */}
      <div className="relative w-full">
        <div className="relative overflow-hidden rounded-b-[44px] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-5 pt-[calc(max(env(safe-area-inset-top,0px),0px)+2rem)] pb-20 sm:rounded-b-[56px] sm:px-8 sm:pt-14 sm:pb-28 lg:rounded-b-[68px] lg:px-12 lg:pt-16 lg:pb-32">
          {/* Ambient glow orbs */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/15 blur-3xl animate-float-slow" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-float-reverse" />

          <div className="relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between">
            <div className="animate-fade-up">
              <p className="text-xs font-medium text-white/80 sm:text-sm lg:text-base">
                Arsip & Riwayat
              </p>
              <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white capitalize sm:text-3xl lg:text-4xl">
                Riwayat Patungan
              </h1>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 animate-fade-up"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Beranda</span>
            </button>
          </div>
        </div>

        {/* Floating Quick Summary Cards overlapping header */}
        <div className="relative z-10 mx-auto -mt-10 w-full max-w-[1120px] px-4 sm:-mt-14 sm:px-6 lg:px-8 animate-fade-up stagger-1">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Total Settled */}
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_16px_40px_rgba(37,99,235,0.08)] sm:p-5">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider sm:text-xs">
                <Coins size={16} weight="bold" className="text-blue-600" />
                <span>Total Selesai Lunas</span>
              </span>
              <p className="mt-2 font-mono tabular-nums text-xl font-black text-slate-900 sm:text-2xl">
                {formatIDR(totalSpentSettled)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Semua tagihan tanpa selisih</p>
            </div>

            {/* Room Count */}
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_16px_40px_rgba(37,99,235,0.08)] sm:p-5">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider sm:text-xs">
                <Receipt size={16} weight="bold" className="text-emerald-600" />
                <span>Meja Selesai</span>
              </span>
              <p className="mt-2 font-mono tabular-nums text-xl font-black text-emerald-600 sm:text-2xl">
                {closedRooms.length} <span className="text-xs font-sans font-bold text-slate-400">meja</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-400">dari {rooms?.length ?? 0} total meja</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Canvas */}
      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-4 sm:px-6 lg:px-8">
        {/* Search Bar matching Dashboard */}
        <div className="relative flex items-center rounded-full border border-slate-200/90 bg-white py-1 pl-4 pr-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 sm:py-1.5 sm:pl-5 sm:pr-2">
          <input
            type="text"
            placeholder="Cari riwayat meja patungan (nama resto atau kode meja)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full bg-transparent text-xs text-ink placeholder:text-ink-muted focus:outline-none sm:text-sm"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mr-2 text-ink-muted hover:text-ink"
              aria-label="Bersihkan pencarian"
            >
              <X size={15} weight="bold" />
            </button>
          ) : null}
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs"
          >
            {isDebouncing ? (
              <SpinnerGap size={16} weight="bold" className="animate-spin" />
            ) : (
              <MagnifyingGlass size={16} weight="bold" />
            )}
          </span>
        </div>

        {/* Status Filter Segmented Controls */}
        {!searchQuery && (
          <div className="flex w-full rounded-2xl bg-slate-200/80 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterType("CLOSED")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                filterType === "CLOSED"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClockCounterClockwise size={14} weight="bold" />
              <span>Selesai ({closedRooms.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("ACTIVE")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                filterType === "ACTIVE"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Aktif ({rooms ? rooms.length - closedRooms.length : 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                filterType === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Semua ({rooms?.length ?? 0})</span>
            </button>
          </div>
        )}

        {/* Search Results Notice */}
        {searchQuery && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-slate-500">
              Hasil pencarian untuk <strong className="text-slate-900">&quot;{searchQuery}&quot;</strong>
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Hapus Filter
            </button>
          </div>
        )}

        {/* Room Grid or Empty State */}
        {error ? (
          <div className="rounded-2xl bg-rose-50 p-4 text-center text-xs font-bold text-rose-700">
            {error}
          </div>
        ) : isDebouncing ? (
          <div className="flex items-center justify-center gap-2.5 rounded-3xl border border-slate-100 bg-white py-12 text-xs font-medium text-slate-400 shadow-xs">
            <SpinnerGap size={18} weight="bold" className="animate-spin text-blue-600" />
            <span>Mencari riwayat meja...</span>
          </div>
        ) : !filteredRooms ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-3xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xs sm:p-12">
            <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 text-slate-400 shadow-2xs">
              <ClockCounterClockwise size={32} weight="duotone" className="text-slate-400" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {searchQuery ? "Tidak Ada Riwayat yang Cocok" : "Belum Ada Riwayat Selesai"}
            </h3>
            <p className="mt-1 max-w-[320px] text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? `Tidak ditemukan riwayat dengan pencarian "${searchQuery}". Coba kata kunci nama resto atau kode meja.`
                : "Meja yang telah kamu selesaikan (status Selesai/Closed) akan otomatis tersimpan rapi di halaman ini."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/create")}
              className="mt-4 flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Plus size={14} weight="bold" />
              <span>Buat Meja Baru</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.room_code}
                room={room}
                onOpenNudge={handleOpenNudge}
                onDeleted={removeRoom}
              />
            ))}
          </div>
        )}
      </main>

      {/* WhatsApp Nudge Modal */}
      <WhatsAppNudgeModal
        isOpen={nudgeModalOpen}
        onClose={() => setNudgeModalOpen(false)}
        initialData={nudgeData}
      />
    </div>
  );
}
