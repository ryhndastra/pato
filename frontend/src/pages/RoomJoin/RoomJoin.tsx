import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreditCard,
  ForkKnife,
  Info,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router";
import { apiDelete, apiGet, apiPost, ApiError } from "../../lib/api";
import { useAuth } from "../../auth/useAuth";
import { RoomHeader } from "./RoomHeader";
import { MemberList } from "./MemberList";
import { ItemList } from "./ItemList";
import { RoomSummary } from "./RoomSummary";
import { JoinForm } from "./JoinForm";
import { HostGodModeCard } from "./HostGodModeCard";
import { PersonalSettlementCard } from "./PersonalSettlementCard";
import { HostPaymentTargetCard } from "./HostPaymentTargetCard";
import { HostPaymentMonitorCard } from "./HostPaymentMonitorCard";
import { ConfirmModal } from "../../components/ConfirmModal";
import { StepProgressCard } from "./StepProgressCard";
import { TippingCard } from "./TippingCard";
import { ChatDrawer } from "./ChatDrawer";
import { ReceiptExportModal } from "./ReceiptExportModal";
import { ReceiptImageModal } from "./ReceiptImageModal";
import { RoomClosedCelebrationModal } from "./RoomClosedCelebrationModal";
import { MobilePaymentDock } from "./MobilePaymentDock";
import { RoomStates } from "./RoomStates";
import {
  getGuestToken,
  hasGuestToken,
  getJoinedSession,
  saveJoinedSession,
} from "./guestToken";
import { useRoomWebSocket } from "../../hooks/useRoomWebSocket";
import { RoomMediaGalleryCard } from "./RoomMediaGalleryCard";
import { soundFX } from "../../lib/soundFx";
import type { JoinResult, RoomDetail, RoomMember, RoomEvent } from "./types";

export function RoomJoin() {
  const navigate = useNavigate();
  const { code: rawCode } = useParams<{ code: string }>();
  const code = rawCode?.trim().toUpperCase() ?? "";
  const { user, token: authToken } = useAuth();

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joined, setJoined] = useState<JoinResult | null>(() => {
    if (!code) return null;
    return getJoinedSession(code);
  });
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string | null>(null);
  const [nameNotice, setNameNotice] = useState<string | null>(null);

  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [receiptImageOpen, setReceiptImageOpen] = useState(false);
  const [aestheticReceiptOpen, setAestheticReceiptOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessageIds, setUnreadMessageIds] = useState<string[]>([]);
  const unreadChatCount = unreadMessageIds.length;

  const handleOpenChat = useCallback(() => {
    setChatOpen(true);
    setUnreadMessageIds([]);
  }, []);

  const handleNewChatActivity = useCallback((ev: RoomEvent) => {
    if (!ev || !ev.id) return;
    setChatOpen((open) => {
      if (!open) {
        setUnreadMessageIds((prev) => (prev.includes(ev.id) ? prev : [...prev, ev.id]));
      }
      return open;
    });
  }, []);

  const handleResetUnread = useCallback(() => {
    setUnreadMessageIds([]);
  }, []);

  // Native Segmented Control state: settlement vs menu
  const [activeTab, setActiveTab] = useState<"settlement" | "menu">("settlement");

  const joinSectionRef = useRef<HTMLDivElement | null>(null);

  const fetchRoom = useCallback(() => {
    if (!code) return;
    return apiGet<RoomDetail>(`/api/rooms/${encodeURIComponent(code)}`).then((res) => {
      setRoom(res);
      return res;
    });
  }, [code]);

  // Auto-celebration for ALL members when room is officially CLOSED
  useEffect(() => {
    if (room?.status === "CLOSED" && code) {
      const celebratedKey = `pato_celebrated_${code}`;
      if (!sessionStorage.getItem(celebratedKey)) {
        sessionStorage.setItem(celebratedKey, "true");
        setCelebrationOpen(true);
        soundFX.playCelebration();
      }
    }
  }, [room?.status, code]);

  useRoomWebSocket({
    roomCode: code,
    onRoomUpdated: fetchRoom,
  });

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    const hasStoredGuest = hasGuestToken(code);
    const roomPromise = apiGet<RoomDetail>(`/api/rooms/${encodeURIComponent(code)}`);
    const joinPromise = (hasStoredGuest || Boolean(authToken))
      ? apiPost<JoinResult>(
          `/api/rooms/${encodeURIComponent(code)}/join`,
          {
            guest_token: getGuestToken(code),
            display_name: "",
          },
          authToken,
        ).catch(() => null)
      : Promise.resolve(null);

    Promise.all([roomPromise, joinPromise])
      .then(([roomRes, joinRes]) => {
        if (cancelled) return;
        setRoom(roomRes);
        setNotFound(false);
        setLoadError(null);

        // Validasi dan simpan sesi aktif
        if (joinRes) {
          saveJoinedSession(code, joinRes);
          setJoined(joinRes);
        } else {
          // Jika reconnect API mengembalikan null, cek apakah sesi lokal masih valid di dalam room.members
          const savedSession = getJoinedSession(code);
          if (savedSession && roomRes.members.some((m) => m.id === savedSession.member_id)) {
            setJoined(savedSession);
          }
        }
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
  }, [code, authToken]);

  async function handleJoin(displayName: string) {
    if (!code) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await apiPost<JoinResult>(`/api/rooms/${encodeURIComponent(code)}/join`, {
        guest_token: getGuestToken(code),
        display_name: displayName,
      });

      // 1. Simpan sesi permanen ke localStorage
      saveJoinedSession(code, res);
      setJoined(res);

      // 2. Optimistic update: langsung masukkan nama ke daftar room.members seketika (0ms delay!)
      setRoom((prev) => {
        if (!prev) return prev;
        if (prev.members.some((m) => m.id === res.member_id)) return prev;
        const newMember: RoomMember = {
          id: res.member_id,
          display_name: res.display_name,
          is_host: res.is_host,
          subtotal_share: 0,
          share_amount: 0,
          claimed_item_ids: [],
          payment_status: "UNPAID",
        };
        return {
          ...prev,
          members: [...prev.members, newMember],
        };
      });

      if (res.display_name.trim().toLowerCase() !== displayName.trim().toLowerCase()) {
        setNameNotice(
          `Nama "${displayName}" sudah ada di meja ini. Kamu otomatis dinamai "${res.display_name}" agar pesanan & tagihan tidak tertukar.`,
        );
      }
      await fetchRoom();
    } catch (err) {
      setJoinError(err instanceof ApiError ? err.message : "Gagal gabung ke meja.");
    } finally {
      setJoining(false);
    }
  }

  async function handleClaim(itemId: string) {
    if (!code) return;
    setPendingItemId(itemId);
    setClaimError(null);
    try {
      await apiPost(`/api/rooms/${encodeURIComponent(code)}/items/${itemId}/claim`, {
        guest_token: getGuestToken(code),
      });
      await fetchRoom();
    } catch (err) {
      setClaimError(err instanceof ApiError ? err.message : "Gagal klaim item.");
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleUnclaim(itemId: string) {
    if (!code) return;
    setPendingItemId(itemId);
    setClaimError(null);
    try {
      await apiDelete(`/api/rooms/${encodeURIComponent(code)}/items/${itemId}/claim`, {
        guest_token: getGuestToken(code),
      });
      await fetchRoom();
    } catch (err) {
      setClaimError(err instanceof ApiError ? err.message : "Gagal batal klaim.");
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleLock() {
    if (!code) return;
    setLocking(true);
    setLockError(null);
    try {
      await apiPost(
        `/api/rooms/${encodeURIComponent(code)}/lock`,
        { guest_token: getGuestToken(code) },
        authToken,
      );
      setActiveTab("settlement");
      await fetchRoom();
    } catch (err) {
      setLockError(err instanceof ApiError ? err.message : "Gagal mengunci room.");
    } finally {
      setLocking(false);
    }
  }

  async function handleUnlock() {
    if (!code) return;
    setUnlocking(true);
    setUnlockError(null);
    try {
      await apiPost(
        `/api/rooms/${encodeURIComponent(code)}/unlock`,
        { guest_token: getGuestToken(code) },
        authToken,
      );
      setActiveTab("menu");
      await fetchRoom();
    } catch (err) {
      setUnlockError(err instanceof ApiError ? err.message : "Gagal membuka meja kembali.");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleClose() {
    if (!code) return;
    setClosing(true);
    setCloseError(null);
    try {
      await apiPost(
        `/api/rooms/${encodeURIComponent(code)}/close`,
        { guest_token: getGuestToken(code) },
        authToken,
      );
      await fetchRoom();
      const celebratedKey = `pato_celebrated_${code}`;
      sessionStorage.setItem(celebratedKey, "true");
      setCelebrationOpen(true);
      soundFX.playCelebration();
    } catch (err) {
      setCloseError(err instanceof ApiError ? err.message : "Gagal menutup meja.");
    } finally {
      setClosing(false);
    }
  }

  async function handleSplitUnclaimed() {
    if (!code) return;
    await apiPost(
      `/api/rooms/${encodeURIComponent(code)}/split-unclaimed`,
      { guest_token: getGuestToken(code) },
      authToken,
    );
    await fetchRoom();
  }

  async function handleSubmitProof(proofBase64: string) {
    if (!code) return;
    await apiPost(`/api/rooms/${encodeURIComponent(code)}/payments/proof`, {
      guest_token: getGuestToken(code),
      proof_image_url: proofBase64,
    });
    await fetchRoom();
  }

  async function handleVerifyPayment(memberId: string) {
    if (!code) return;
    await apiPost(
      `/api/rooms/${encodeURIComponent(code)}/payments/${memberId}/verify`,
      { guest_token: getGuestToken(code) },
      authToken,
    );
    await fetchRoom();
  }

  async function handleRejectPayment(memberId: string, reason: string) {
    if (!code) return;
    await apiPost(
      `/api/rooms/${encodeURIComponent(code)}/payments/${memberId}/reject`,
      { reason, guest_token: getGuestToken(code) },
      authToken,
    );
    await fetchRoom();
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function handleConfirmDeleteRoom() {
    if (!code) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete(
        `/api/rooms/${encodeURIComponent(code)}`,
        { guest_token: getGuestToken(code) },
        authToken,
      );
      setShowDeleteModal(false);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Gagal menghapus room.");
      setDeleting(false);
    }
  }

  function scrollToJoin() {
    joinSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) return <RoomStates variant="loading" />;
  if (notFound) return <RoomStates variant="notfound" message={loadError ?? undefined} />;

  if (loadError || !room) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-center">
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 border border-rose-100">
          {loadError ?? "Gagal memuat meja."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 active:scale-95 transition-all"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const members = room.members ?? [];
  const currentMemberId = joined?.member_id ?? null;
  const me = members.find((m) => m.id === currentMemberId) ?? null;
  const isHost =
    Boolean(joined?.is_host) ||
    Boolean(me?.is_host) ||
    Boolean(user?.id && room.host_user_id && user.id === room.host_user_id);
  const isSettlement = room.status === "LOCKED" || room.status === "CLOSED";

  const hostMember = members.find((m) => m.is_host);
  const friends = members.filter((m) => !m.is_host);
  const hostShare = hostMember?.share_amount ?? 0;
  const friendsTarget = Math.max(0, room.grand_total - hostShare);

  const verifiedFromFriends = friends
    .filter((m) => m.payment_status === "VERIFIED")
    .reduce((sum, m) => sum + m.share_amount, 0);

  const pendingVerificationCount = friends.filter((m) => m.payment_status === "PENDING").length;

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#f8fafc]">
      {/* 1. NATIVE TOP NAVIGATION BAR & HERO */}
      <RoomHeader
        room={room}
        chatCount={unreadChatCount}
        onOpenChat={handleOpenChat}
        onOpenReceiptImage={room.receipt_image_url ? () => setReceiptImageOpen(true) : undefined}
        onOpenAestheticReceipt={() => setAestheticReceiptOpen(true)}
      />

      {/* 2. MAIN NATIVE APP CANVAS */}
      <main className="mx-auto w-full max-w-md sm:max-w-xl lg:max-w-3xl flex-1 px-4 pt-3.5 pb-36 sm:px-6">
        {/* Slim native horizontal step progress indicator */}
        <div className="mb-3">
          <StepProgressCard status={room.status} />
        </div>

        {/* F01: Smart duplicate name notification banner */}
        {nameNotice && (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-900 border border-amber-200/90 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Info size={18} weight="bold" className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Nama Panggilan Disesuaikan</p>
                <p className="mt-0.5 text-amber-800">{nameNotice}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNameNotice(null)}
              className="shrink-0 rounded-lg p-1 text-amber-600 hover:bg-amber-100 hover:text-amber-800 transition-colors"
              title="Tutup pemberitahuan"
            >
              <X size={15} weight="bold" />
            </button>
          </div>
        )}

        {/* Room Visual Hub: Struk Kasir, QRIS Host, Foto Barengan */}
        <div className="mb-3.5">
          <RoomMediaGalleryCard room={room} onPhotoUpdated={fetchRoom} />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* A. SETTLEMENT STAGE (LOCKED OR CLOSED)                        */}
        {/* ------------------------------------------------------------- */}
        {isSettlement ? (
          <div className="flex flex-col gap-3.5">
            {/* Native iOS/Android Segmented Control */}
            <div className="flex w-full rounded-2xl bg-slate-100/90 p-1 border border-slate-200/70 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("settlement")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  activeTab === "settlement"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60 font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <CreditCard size={15} weight="bold" />
                <span>{isHost ? "Kas & Pelunasan" : "Bayar Tagihan"}</span>
                {isHost && pendingVerificationCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 font-mono text-[9px] font-black text-white">
                    {pendingVerificationCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("menu")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  activeTab === "menu"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60 font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <ForkKnife size={15} weight="bold" />
                <span>Menu Pesanan</span>
              </button>
            </div>

            {/* TAB 1: KAS & PELUNASAN / BAYAR KE HOST */}
            {activeTab === "settlement" && (
              <div className="flex flex-col gap-3.5">
                {isHost ? (
                  /* HOST COMMAND CENTER (Unified single screen: hero stats + friends list + host food disclosure) */
                  <>
                    <HostPaymentMonitorCard
                      room={room}
                      onVerifyPayment={handleVerifyPayment}
                      onRejectPayment={handleRejectPayment}
                      onUnlockRoom={handleUnlock}
                      onCloseRoom={handleClose}
                      unlocking={unlocking}
                      closing={closing}
                      unlockError={unlockError}
                      closeError={closeError}
                    />

                    <TippingCard />

                    {/* Delete room action link */}
                    <div className="flex flex-col items-center gap-1 pt-3">
                      {deleteError && (
                        <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                          {deleteError}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-50"
                      >
                        <Trash size={14} weight="bold" />
                        <span>{deleting ? "Menghapus Meja..." : "Hapus Meja Permanen"}</span>
                      </button>
                    </div>
                  </>
                ) : me ? (
                  /* GUEST PAYMENT CARD */
                  <div className="flex flex-col gap-3.5">
                    <PersonalSettlementCard
                      room={room}
                      me={me}
                      onSubmitProof={handleSubmitProof}
                    />
                    <TippingCard />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-2xs">
                    <p className="text-xs font-semibold text-slate-600">
                      Kamu belum bergabung dalam meja ini.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("menu")}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      Buka Tab Menu untuk Gabung
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MENU PESANAN & STRUK KASIR */}
            {activeTab === "menu" && (
              <div className="flex flex-col gap-3.5">
                {isHost && room.status === "LOCKED" && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 shadow-2xs">
                    <div>
                      <p className="text-xs font-bold text-amber-900">Tagihan Sedang Dikunci</p>
                      <p className="text-[11px] text-amber-700">
                        Buka meja kembali jika ingin mengedit atau menyesuaikan porsi menu.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                    >
                      {unlocking ? "Membuka..." : "Buka Kunci"}
                    </button>
                  </div>
                )}
                <MemberList
                  members={members}
                  currentMemberId={currentMemberId}
                  roomStatus={room.status}
                  selectedMemberId={selectedMemberFilter}
                  onSelectMember={setSelectedMemberFilter}
                />

                <section className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Menu Pesanan ({room.items?.length ?? 0})
                    </h2>
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      Klaim Dikunci
                    </span>
                  </div>

                  <ItemList
                    items={room.items ?? []}
                    members={members}
                    currentMemberId={currentMemberId}
                    roomStatus={room.status}
                    pendingItemId={pendingItemId}
                    onClaim={handleClaim}
                    onUnclaim={handleUnclaim}
                    onJoinPrompt={scrollToJoin}
                    selectedMemberId={selectedMemberFilter}
                    onClearMemberFilter={() => setSelectedMemberFilter(null)}
                  />
                </section>

                <RoomSummary room={room} />
              </div>
            )}
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* B. CLAIMING STAGE (OPEN MEJA)                                 */
          /* ------------------------------------------------------------- */
          <div className="flex flex-col gap-3.5">
            <MemberList
              members={members}
              currentMemberId={currentMemberId}
              roomStatus={room.status}
              selectedMemberId={selectedMemberFilter}
              onSelectMember={setSelectedMemberFilter}
            />

            {!joined && (
              <div ref={joinSectionRef}>
                <JoinForm
                  roomCode={room.room_code}
                  submitting={joining}
                  error={joinError}
                  onSubmit={handleJoin}
                />
              </div>
            )}

            {isHost && (
              <HostGodModeCard
                room={room}
                onLock={handleLock}
                onSplitUnclaimed={handleSplitUnclaimed}
                locking={locking}
                lockError={lockError}
              />
            )}

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Menu Pesanan ({room.items?.length ?? 0})
                </h2>
                <span className="text-[11px] font-semibold text-blue-600">
                  Pilih porsi kamu di bawah
                </span>
              </div>

              {claimError && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 border border-rose-100">
                  {claimError}
                </p>
              )}

              <ItemList
                items={room.items ?? []}
                members={members}
                currentMemberId={currentMemberId}
                roomStatus={room.status}
                pendingItemId={pendingItemId}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
                onJoinPrompt={scrollToJoin}
                selectedMemberId={selectedMemberFilter}
                onClearMemberFilter={() => setSelectedMemberFilter(null)}
              />
            </section>

            <RoomSummary room={room} />

            {isHost && (
              <div className="flex flex-col items-center gap-1 pt-4 pb-2">
                {deleteError && (
                  <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                    {deleteError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-50"
                >
                  <Trash size={14} weight="bold" />
                  <span>{deleting ? "Menghapus Meja..." : "Hapus Meja Permanen"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. NATIVE BOTTOM ACTION DOCK */}
      <MobilePaymentDock
        me={me}
        roomStatus={room.status}
        isHost={isHost}
        activeTab={activeTab}
        verifiedFromFriends={verifiedFromFriends}
        friendsTarget={friendsTarget}
        pendingCount={pendingVerificationCount}
        onScrollToClaim={() => setActiveTab("menu")}
        onScrollToPayment={() => setActiveTab("settlement")}
        onCloseRoom={handleClose}
        onJoinClick={scrollToJoin}
        onLockClick={handleLock}
      />

      {/* In-Room Live Chat Slide-over Drawer / Bottom Sheet */}
      <ChatDrawer
        roomCode={room.room_code}
        isJoined={Boolean(joined)}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onNewActivity={handleNewChatActivity}
        onResetUnread={handleResetUnread}
      />

      {/* Modal for viewing Bank Account & QRIS preview anytime */}
      {showPaymentInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowPaymentInfoModal(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Rekening & QRIS Host
              </span>
              <button
                type="button"
                onClick={() => setShowPaymentInfoModal(false)}
                className="rounded-full bg-slate-100 p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <HostPaymentTargetCard room={room} />
          </div>
        </div>
      )}

      {/* Modal for viewing original restaurant receipt photo */}
      {receiptImageOpen && room.receipt_image_url && (
        <ReceiptImageModal
          imageUrl={room.receipt_image_url}
          onClose={() => setReceiptImageOpen(false)}
        />
      )}

      {/* Modal for viewing aesthetic digital split bill receipt */}
      {aestheticReceiptOpen && (
        <ReceiptExportModal
          room={room}
          onClose={() => setAestheticReceiptOpen(false)}
        />
      )}

      {/* Modal for celebrating closed room completion */}
      <RoomClosedCelebrationModal
        room={room}
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        onOpenReceipt={() => setAestheticReceiptOpen(true)}
      />

      {/* Delete Room Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!deleting) setShowDeleteModal(false);
        }}
        onConfirm={handleConfirmDeleteRoom}
        title="Hapus Meja Permanen?"
        description={
          <span>
            Hapus meja <strong className="font-bold text-slate-800">"{room.title}"</strong> ({room.room_code})? Semua klaim dan data pembayaran di dalamnya akan ikut terhapus permanen dan tidak bisa dikembalikan.
          </span>
        }
        confirmText="Hapus Meja"
        cancelText="Batal"
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
}
