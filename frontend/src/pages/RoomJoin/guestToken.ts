import type { JoinResult } from "./types";

const KEY_PREFIX = "pato_guest_token_";
const SESSION_PREFIX = "pato_joined_session_";

/** Cek tanpa membuat token baru - dipakai buat tahu apakah device ini
 *  sudah pernah gabung/jadi host room ini sebelumnya, supaya kita bisa
 *  auto-restore sesi tanpa nanya nama lagi (lihat F01_ROOM_MANAGEMENT). */
export function hasGuestToken(roomCode: string): boolean {
  return localStorage.getItem(`${KEY_PREFIX}${roomCode.toUpperCase()}`) !== null;
}

/** Token tamu persisten per room code; dipakai ulang saat reconnect supaya
 *  join mengembalikan member yang sama. Di-scope per room (bukan satu token
 *  global) supaya device yang jadi host di satu room dan tamu di room lain
 *  tidak ketuker identitasnya. */
export function getGuestToken(roomCode: string): string {
  const key = `${KEY_PREFIX}${roomCode.toUpperCase()}`;
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

/** Dipanggil sekali setelah CreateRoom sukses, supaya saat host buka
 *  room-nya sendiri dia dikenali sebagai host (member yang sudah ada),
 *  bukan dibuatkan member tamu baru. */
export function setHostGuestToken(roomCode: string, hostToken: string): void {
  localStorage.setItem(`${KEY_PREFIX}${roomCode.toUpperCase()}`, hostToken);
}

/** Simpan data JoinResult (member_id, display_name, is_host) ke localStorage
 *  agar sesi langsung aktif seketika tanpa perlu daftar ulang saat web ditutup/refresh. */
export function saveJoinedSession(roomCode: string, result: JoinResult): void {
  try {
    localStorage.setItem(`${SESSION_PREFIX}${roomCode.toUpperCase()}`, JSON.stringify(result));
  } catch {
    // Abaikan jika storage quota penuh
  }
}

/** Ambil data sesi join yang tersimpan untuk room ini */
export function getJoinedSession(roomCode: string): JoinResult | null {
  try {
    const raw = localStorage.getItem(`${SESSION_PREFIX}${roomCode.toUpperCase()}`);
    return raw ? (JSON.parse(raw) as JoinResult) : null;
  } catch {
    return null;
  }
}

/** Hapus data sesi join saat keluar room */
export function clearJoinedSession(roomCode: string): void {
  localStorage.removeItem(`${SESSION_PREFIX}${roomCode.toUpperCase()}`);
}

