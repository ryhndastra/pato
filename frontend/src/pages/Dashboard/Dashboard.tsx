import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  MagnifyingGlass,
  SpinnerGap,
  Ticket,
  X,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { useDebounce } from "../../hooks/useDebounce";
import { DashboardHero } from "./DashboardHero";
import { DashboardFeatureBanner } from "./DashboardFeatureBanner";
import { QuickHubGrid } from "./QuickHubGrid";
import { DashboardStatsBento } from "./DashboardStatsBento";
import { RoomList } from "./RoomList";
import { RoomStatusFilter } from "./RoomStatusFilter";
import { useMyRooms } from "./useMyRooms";
import { WhatsAppNudgeModal, type NudgeInitialData } from "./WhatsAppNudgeModal";
import type { RoomStatus } from "./roomStatus";

export function Dashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { rooms, error, removeRoom } = useMyRooms(token);
  const { copied, copy } = useCopyToClipboard();

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 120);
  const [statusFilter, setStatusFilter] = useState<"ALL" | RoomStatus>("ALL");

  const isDebouncing = searchQuery !== debouncedSearchQuery;

  function handleFilterWithScroll(status: "ALL" | RoomStatus) {
    setStatusFilter(status);
    const element = document.getElementById("room-list-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // WhatsApp Nudge Tool State
  const [nudgeModalOpen, setNudgeModalOpen] = useState(false);
  const [nudgeData, setNudgeData] = useState<NudgeInitialData | null>(null);

  const spentThisMonth = useMemo(() => {
    if (!rooms) return 0;
    const now = new Date();
    return rooms
      .filter((room) => {
        const created = new Date(room.created_at);
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, room) => sum + room.grand_total, 0);
  }, [rooms]);

  const activeCount = useMemo(
    () => rooms?.filter((room) => room.status !== "CLOSED").length ?? 0,
    [rooms],
  );

  const statusCounts = useMemo(() => {
    if (!rooms) return { ALL: 0, CLAIMING: 0, LOCKED: 0, DRAFT: 0, CLOSED: 0 };
    return {
      ALL: rooms.length,
      CLAIMING: rooms.filter((r) => r.status === "CLAIMING").length,
      LOCKED: rooms.filter((r) => r.status === "LOCKED").length,
      DRAFT: rooms.filter((r) => r.status === "DRAFT").length,
      CLOSED: rooms.filter((r) => r.status === "CLOSED").length,
    };
  }, [rooms]);

  function handleJoinSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;
    navigate(`/room/${clean}`);
  }

  function handleOpenNudge(data?: NudgeInitialData) {
    setNudgeData(data ?? null);
    setNudgeModalOpen(true);
  }

  function handleResetFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pb-12 sm:gap-7 sm:pb-16 lg:gap-8">
      {/* Curved gradient header and quick action cards */}
      <DashboardHero
        name={user?.name ?? "Host"}
        avatarUrl={user?.avatarUrl}
        onCreateRoom={() => navigate("/create")}
        onToggleJoin={() => setShowJoin((v) => !v)}
        joinActive={showJoin}
        onOpenNudge={() => handleOpenNudge()}
        onShare={() => copy(window.location.origin)}
        shared={copied}
        onProfile={() => navigate("/profile")}
      />

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 sm:px-6 lg:px-8">
        {/* Join code drawer */}
        {showJoin && (
          <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm sm:p-5">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Ticket size={18} weight="bold" className="text-blue-600" />
                <p className="text-xs font-bold text-ink">
                  Gabung Meja dengan Kode
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJoin(false)}
                className="text-xs font-bold text-ink-muted hover:text-ink"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                autoCapitalize="characters"
                placeholder="Ketik kode meja (contoh: PA-8291)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="h-11 min-w-0 flex-1 rounded-full border border-hairline bg-white px-4 font-mono text-xs font-bold tracking-wider text-ink uppercase placeholder:font-sans placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-muted focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Masuk ke meja"
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-blue-600 px-5 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                <span>Masuk</span>
                <ArrowRight size={15} weight="bold" />
              </button>
            </form>
          </div>
        )}

        {/* Search bar */}
        <div className="relative flex items-center rounded-full border border-slate-200/90 bg-white py-1 pl-4 pr-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 sm:py-1.5 sm:pl-5 sm:pr-2">
          <input
            type="text"
            placeholder="Cari resto atau kode meja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full bg-transparent pr-2 text-xs text-ink placeholder:text-slate-400 focus:outline-none sm:text-sm"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs transition-transform"
          >
            {isDebouncing ? (
              <SpinnerGap size={16} weight="bold" className="animate-spin" />
            ) : (
              <MagnifyingGlass size={16} weight="bold" />
            )}
          </span>
        </div>

        {/* Dynamic Search Results vs Normal Dashboard Sections */}
        {searchQuery.trim() ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-slate-500">
                Hasil pencarian untuk <strong className="text-slate-900">&quot;{searchQuery}&quot;</strong>
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Reset Pencarian
              </button>
            </div>
            {isDebouncing ? (
              <div className="flex items-center justify-center gap-2.5 rounded-3xl border border-slate-100 bg-white py-10 text-xs font-medium text-slate-400 shadow-xs">
                <SpinnerGap size={18} weight="bold" className="animate-spin text-blue-600" />
                <span>Mencari meja patungan...</span>
              </div>
            ) : (
              <RoomList
                rooms={rooms}
                error={error}
                searchQuery={debouncedSearchQuery}
                statusFilter="ALL"
                onOpenNudge={handleOpenNudge}
                onResetFilters={handleResetFilters}
                onDeleted={removeRoom}
              />
            )}
          </div>
        ) : (
          <>
            {/* Feature banner */}
            <DashboardFeatureBanner />

            {/* Feature presets and tools grid */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  Akses Cepat & Template
                </h2>
                <span className="text-[11px] font-medium text-ink-muted">
                  Pilih menu
                </span>
              </div>
              <QuickHubGrid
                onOpenNudge={() => handleOpenNudge()}
                onToggleJoin={() => setShowJoin((v) => !v)}
              />
            </div>

            {/* Financial summary cards */}
            <DashboardStatsBento
              spentThisMonth={spentThisMonth}
              activeCount={activeCount}
              totalRooms={rooms?.length ?? 0}
              onFilterActive={(status) => handleFilterWithScroll(status)}
            />

            {/* Room list section with status filters */}
            <div id="room-list-section" className="mt-2 flex flex-col gap-4 scroll-mt-20">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-ink sm:text-base">
                  Meja Patungan Kamu
                </h2>
                <span className="text-xs text-ink-muted">
                  {rooms ? `${rooms.length} room terdaftar` : "Memuat..."}
                </span>
              </div>

              {/* Status filter tabs */}
              <RoomStatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
                counts={statusCounts}
              />

              {/* Room grid */}
              <RoomList
                rooms={rooms}
                error={error}
                searchQuery={debouncedSearchQuery}
                statusFilter={statusFilter}
                onOpenNudge={handleOpenNudge}
                onResetFilters={handleResetFilters}
                onDeleted={removeRoom}
              />
            </div>
          </>
        )}
      </div>

      {/* WhatsApp nudge generator modal */}
      <WhatsAppNudgeModal
        isOpen={nudgeModalOpen}
        onClose={() => setNudgeModalOpen(false)}
        initialData={nudgeData}
      />
    </div>
  );
}
