import { parseId } from "./id.js";

// Helper murni untuk Route Handler (tanpa dependensi Next, sehingga bisa dites langsung).

export const s = (v) => String(v ?? "").trim();

export const num = (v) =>
  v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;

export const ok = (data = {}, status = 200) =>
  Response.json({ ok: true, ...data }, { status });

export const fail = (message, status = 400) =>
  Response.json({ ok: false, message }, { status });

// Membaca body JSON ATAU form (multipart/urlencoded) menjadi objek biasa.
// Key yang muncul berulang (mis. checkbox/tabel pilih) menjadi array.
export async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return body && typeof body === "object" ? body : {};
  }
  const fd = await request.formData().catch(() => null);
  const out = {};
  if (!fd) return out;
  for (const key of new Set(fd.keys())) {
    const all = fd.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

// "5" | 5 | ["1","2"] | "1,2" -> [1, 2]  (valid saja, tanpa duplikat)
export function parseIdList(v) {
  const raw = Array.isArray(v) ? v : v == null ? [] : [v];
  const ids = raw
    .flatMap((x) => (typeof x === "string" ? x.split(",") : [x]))
    .map((x) => parseId(typeof x === "string" ? x.trim() : x))
    .filter((x) => x != null);
  return [...new Set(ids)];
}
