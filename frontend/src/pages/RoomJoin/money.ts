import { formatIDR } from "../../lib/format";

/** formatIDR tetap dipertahankan, fungsi ini hanya mencegah "Rp NaN" saat nilai tak valid. */
export function safeIDR(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "-";
  return formatIDR(amount);
}
