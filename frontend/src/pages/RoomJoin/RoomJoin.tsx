import { useEffect, useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router";
import { apiGet, apiPost, ApiError } from "../../lib/api";
import { StatusBadge } from "./StatusBadge";
import { ItemList } from "./ItemList";
import { RoomSummary } from "./RoomSummary";
import { JoinForm } from "./JoinForm";
import { JoinedPanel } from "./JoinedPanel";
import { RoomStates } from "./RoomStates";
import { getGuestToken } from "./guestToken";
import type { JoinResult, RoomDetail } from "./types";

export function RoomJoin() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joined, setJoined] = useState<JoinResult | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setLoadError(null);

    apiGet<RoomDetail>(`/api/rooms/${encodeURIComponent(code)}`)
      .then((res) => {
        if (!cancelled) setRoom(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.message.includes("tidak ditemukan")) {
          setNotFound(true);
        } else {
          setLoadError(err instanceof ApiError ? err.message : "Gagal memuat meja.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleJoin(displayName: string) {
    if (!code) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await apiPost<JoinResult>(`/api/rooms/${encodeURIComponent(code)}/join`, {
        guest_token: getGuestToken(),
        display_name: displayName,
      });
      setJoined(res);
    } catch (err) {
      setJoinError(err instanceof ApiError ? err.message : "Gagal gabung ke meja.");
    } finally {
      setJoining(false);
    }
  }

  if (loading) return <RoomStates variant="loading" />;
  if (notFound) return <RoomStates variant="notfound" message={loadError ?? undefined} />;

  if (loadError || !room) {
    return (
      <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-center lg:px-0">
        <p className="rounded-xl bg-danger-bg px-4 py-3 text-[13px] font-semibold text-danger">
          {loadError ?? "Gagal memuat meja."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 flex h-[52px] w-full items-center justify-center rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_2px_4px_rgba(37,99,235,0.15)]"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-canvas">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-hairline bg-shell px-5 py-3 lg:px-12 lg:py-4">
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          aria-label="Kembali ke beranda"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-haze text-ink active:bg-hairline"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>
        <span className="text-[15px] font-bold text-ink">Gabung Meja</span>
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-5 px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+28px)] lg:px-0 lg:py-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[22px] leading-[1.25] font-bold tracking-[-0.01em] text-ink">
              {room.title}
            </h1>
            <StatusBadge status={room.status} />
          </div>
          <p className="font-mono text-[13px] font-bold tracking-wide text-ink-soft">
            {room.room_code}
          </p>
        </div>

        {joined ? (
          <JoinedPanel join={joined} roomCode={room.room_code} />
        ) : (
          <JoinForm
            roomCode={room.room_code}
            submitting={joining}
            error={joinError}
            onSubmit={handleJoin}
          />
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink-muted">Rincian Tagihan</h2>
          <RoomSummary room={room} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink-muted">Menu di Meja</h2>
          <ItemList items={room.items ?? []} />
        </section>
      </main>
    </div>
  );
}
