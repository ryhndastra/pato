import { randomInt } from "node:crypto";
// suffix "-" + 3 digit = 4 karakter, jadi slug dibatasi 8 agar kode total maksimal 12
// sesuai panjang kolom rooms.room_code varchar(12).
const SUFFIX_LENGTH = 4;
const MAX_ROOM_CODE_LENGTH = 12;
const MAX_SLUG_LENGTH = MAX_ROOM_CODE_LENGTH - SUFFIX_LENGTH;
/** First significant word of the title, stripped down to A-Z0-9. */
function slugifyTitle(title) {
    const firstWord = title
        .normalize("NFKD")
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .trim()
        .split(/\s+/)[0];
    const slug = (firstWord ?? "").slice(0, MAX_SLUG_LENGTH);
    return slug.length > 0 ? slug : "ROOM";
}
/** e.g. "Makan Sushi Tei Senopati" -> "MAKAN-492" */
export function generateRoomCode(title) {
    const suffix = randomInt(100, 1000);
    return `${slugifyTitle(title)}-${suffix}`;
}
//# sourceMappingURL=roomCode.js.map