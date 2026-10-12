import { randomInt } from "node:crypto";

/** First significant word of the title, stripped down to A-Z0-9. */
function slugifyTitle(title: string): string {
  const firstWord = title
    .normalize("NFKD")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)[0];

  const slug = (firstWord ?? "").slice(0, 12);
  return slug.length > 0 ? slug : "ROOM";
}

/** e.g. "Makan Sushi Tei Senopati" -> "MAKAN-492" */
export function generateRoomCode(title: string): string {
  const suffix = randomInt(100, 1000);
  return `${slugifyTitle(title)}-${suffix}`;
}
