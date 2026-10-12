export function formatIDR(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

/** Strips everything but digits - for controlled currency/number inputs. */
export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}
