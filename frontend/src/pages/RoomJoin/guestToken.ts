const GUEST_TOKEN_KEY = "pato_guest_token";

/** Token tamu persisten; dipakai ulang saat reconnect supaya join mengembalikan member yang sama. */
export function getGuestToken(): string {
  let token = localStorage.getItem(GUEST_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  }
  return token;
}
