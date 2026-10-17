import { useCallback, useEffect, useRef, useState } from "react";
import { soundFX } from "../../lib/soundFx";
import { haptic } from "../../lib/haptic";
import {
  getNotificationPermissionState,
  sendBrowserNotification,
} from "../../lib/notifications";
import type { InAppToastPayload, ToastType } from "../../components/InAppToast";
import type { RoomDetail } from "./types";

interface UseRoomNotificationsOptions {
  room: RoomDetail | null;
  joinedMemberId: string | null;
  isHost: boolean;
}

export function useRoomNotifications({
  room,
  joinedMemberId,
  isHost,
}: UseRoomNotificationsOptions) {
  const [showNotificationPrimer, setShowNotificationPrimer] = useState(false);
  const [activeToast, setActiveToast] = useState<InAppToastPayload | null>(null);
  const prevRoomRef = useRef<RoomDetail | null>(null);

  const showNotification = useCallback(
    (type: ToastType, title: string, message: string) => {
      setActiveToast({
        id: Math.random().toString(),
        type,
        title,
        message,
      });
      soundFX.playNotification();
      haptic.medium();

      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        sendBrowserNotification({
          title,
          body: message,
          url: window.location.pathname,
        });
      }
    },
    [],
  );

  const hasRoom = Boolean(room);

  // Show custom native permission primer modal when appropriate
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissedKey = "pato_notif_primer_dismissed";
    const dismissed = sessionStorage.getItem(dismissedKey);
    const perm = getNotificationPermissionState();

    if (perm === "default" && !dismissed && (joinedMemberId || hasRoom)) {
      const timer = window.setTimeout(() => {
        setShowNotificationPrimer(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [joinedMemberId, hasRoom]);

  // Compares previous room state with new room state to emit notifications
  const handleRoomDiff = useCallback(
    (newRoom: RoomDetail) => {
      const prev = prevRoomRef.current;
      if (prev && prev.room_code === newRoom.room_code) {
        // 1. Room status transitions
        if (prev.status !== newRoom.status) {
          if (newRoom.status === "LOCKED") {
            showNotification(
              "lock",
              "Meja Telah Dikunci!",
              "Host telah mengunci pesanan. Silakan periksa rincian tagihan kamu.",
            );
          } else if (newRoom.status === "CLOSED") {
            showNotification(
              "success",
              "Meja Selesai!",
              "Semua tagihan telah diselesaikan. Terima kasih sudah patungan!",
            );
          } else if (prev.status === "LOCKED" && newRoom.status === "CLAIMING") {
            showNotification(
              "info",
              "Meja Dibuka Kembali",
              "Host membuka kembali meja untuk perubahan pesanan.",
            );
          }
        }

        // 2. Personal payment verification status
        if (joinedMemberId) {
          const prevMe = prev.members?.find((m) => m.id === joinedMemberId);
          const newMe = newRoom.members?.find((m) => m.id === joinedMemberId);
          if (prevMe && newMe && prevMe.payment_status !== newMe.payment_status) {
            if (newMe.payment_status === "VERIFIED") {
              showNotification(
                "success",
                "Pembayaran Terverifikasi! 🎉",
                "Host telah mengonfirmasi pembayaran kamu lunas. Terima kasih!",
              );
            } else if (newMe.payment_status === "REJECTED") {
              showNotification(
                "warning",
                "Bukti Pembayaran Ditolak",
                `Host meminta upload ulang: "${newMe.rejection_reason || "Nominal tidak sesuai"}"`,
              );
            }
          }
        }

        // 3. For Host: New pending proof uploaded by friends
        if (isHost) {
          const prevPending =
            prev.members?.filter((m) => !m.is_host && m.payment_status === "PENDING").length || 0;
          const newPending =
            newRoom.members?.filter((m) => !m.is_host && m.payment_status === "PENDING").length || 0;
          if (newPending > prevPending) {
            showNotification(
              "info",
              "Bukti Transfer Baru!",
              "Ada teman meja yang baru saja mengunggah bukti transfer untuk dicek.",
            );
          }
        }
      }

      prevRoomRef.current = newRoom;
    },
    [joinedMemberId, isHost, showNotification],
  );

  return {
    showNotificationPrimer,
    setShowNotificationPrimer,
    activeToast,
    setActiveToast,
    showNotification,
    handleRoomDiff,
  };
}
