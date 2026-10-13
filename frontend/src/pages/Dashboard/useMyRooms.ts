import { useCallback, useEffect, useState } from "react";
import { apiGet, ApiError } from "../../lib/api";
import type { MyRoom } from "./roomStatus";

export function useMyRooms(token: string | null) {
  const [rooms, setRooms] = useState<MyRoom[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ rooms: MyRoom[] }>("/api/rooms/mine", token)
      .then((res) => {
        if (!cancelled) setRooms(res.rooms);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Gagal memuat room.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  /** Dipanggil setelah delete room sukses, biar list langsung update tanpa refetch. */
  const removeRoom = useCallback((roomCode: string) => {
    setRooms((prev) => (prev ? prev.filter((r) => r.room_code !== roomCode) : prev));
  }, []);

  return { rooms, error, removeRoom };
}
