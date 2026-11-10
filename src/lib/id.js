// ID dari URL/form: hanya bilangan bulat positif. Menolak "abc", "1e3", "-1", "", null.
export function parseId(v) {
  if (typeof v === "number") return Number.isSafeInteger(v) && v > 0 ? v : null;
  if (typeof v === "string" && /^\d{1,9}$/.test(v)) {
    const n = Number(v);
    return n > 0 ? n : null;
  }
  return null;
}
