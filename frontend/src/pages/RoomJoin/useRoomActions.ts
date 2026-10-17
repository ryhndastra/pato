import { useState } from "react";
import { apiDelete, apiPost, ApiError } from "../../lib/api";
import { getGuestToken, saveJoinedSession } from "./guestToken";
import { soundFX } from "../../lib/soundFx";
import { haptic } from "../../lib/haptic";
import type { JoinResult, RoomDetail, RoomMember } from "./types";

interface UseRoomActionsOptions {
  code: string;
  authToken: string | null;
  fetchRoom: () => Promise<RoomDetail | undefined>;
  setRoom: React.Dispatch<React.SetStateAction<RoomDetail | null>>;
  setJoined: React.Dispatch<React.SetStateAction<JoinResult | null>>;
  setNameNotice: (notice: string | null) => void;
  setActiveTab: (tab: "settlement" | "menu") => void;
  setCelebrationOpen: (open: boolean) => void;
}

export function useRoomActions({
  code,
  authToken,
  fetchRoom,
  setRoom,
  setJoined,
  setNameNotice,
  setActiveTab,
  setCelebrationOpen,
}: UseRoomActionsOptions) {
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

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
      haptic.success();
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
      haptic.medium();
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
      haptic.celebrate();
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

  return {
    joining,
    joinError,
    pendingItemId,
    claimError,
    locking,
    lockError,
    unlocking,
    unlockError,
    closing,
    closeError,
    handleJoin,
    handleClaim,
    handleUnclaim,
    handleLock,
    handleUnlock,
    handleClose,
    handleSplitUnclaimed,
    handleSubmitProof,
    handleVerifyPayment,
    handleRejectPayment,
  };
}
