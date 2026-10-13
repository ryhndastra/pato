const KEY_PREFIX = "pato_guest_token_";

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
