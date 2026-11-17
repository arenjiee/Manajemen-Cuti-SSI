import { tanggalValid } from "./leave/tanggal.js";

const LIBURIN_BASE_URL = "https://liburin.vercel.app/api";

export function normalisasiJenisLibur(type = "") {
  return String(type).toLowerCase().includes("cuti") ? "cuti_bersama" : "nasional";
}

export async function fetchHariLiburLiburin(tahun, { fetcher = fetch, timeout = 10000 } = {}) {
  const t = Number(tahun);
  if (!Number.isInteger(t) || t < 2000 || t > 2100) {
    return { ok: false, pesan: "Tahun tidak valid." };
  }

  const url = `${LIBURIN_BASE_URL}?year=${t}`;
  try {
    const res = await fetcher(url, {
      signal: AbortSignal.timeout(timeout),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return { ok: false, pesan: `API Liburin mengembalikan status HTTP ${res.status}.` };
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return { ok: false, pesan: "Format data dari Liburin tidak valid (bukan array)." };
    }

    const daftar = [];
    for (const item of data) {
      const tanggal = String(item.date ?? "").trim();
      const keterangan = String(item.name ?? "").trim();
      const jenis = normalisasiJenisLibur(item.type);

      if (tanggalValid(tanggal) && keterangan) {
        daftar.push({
          tanggal,
          keterangan,
          jenis,
        });
      }
    }

    return { ok: true, data: daftar, tahun: t };
  } catch (err) {
    if (err.name === "TimeoutError") {
      return { ok: false, pesan: "Gagal terhubung ke API Liburin (waktu tunggu habis)." };
    }
    return { ok: false, pesan: `Gagal mengambil data dari Liburin: ${err.message}` };
  }
}

export async function sinkronkanHariLibur(db, tahun, options = {}) {
  const hasilFetch = await fetchHariLiburLiburin(tahun, options);
  if (!hasilFetch.ok) return hasilFetch;

  const items = hasilFetch.data;
  if (items.length === 0) {
    return { ok: false, pesan: `Tidak ada data hari libur ditemukan di Liburin untuk tahun ${tahun}.` };
  }

  let disisipkan = 0;
  let diperbarui = 0;

  for (const item of items) {
    const r = await db.query(
      `INSERT INTO hari_libur (tanggal, keterangan, jenis)
       VALUES ($1, $2, $3)
       ON CONFLICT (tanggal) DO UPDATE
       SET keterangan = EXCLUDED.keterangan,
           jenis = EXCLUDED.jenis
       RETURNING (xmax = 0) AS disisipkan`,
      [item.tanggal, item.keterangan, item.jenis]
    );

    if (r.rows[0]?.disisipkan) {
      disisipkan++;
    } else {
      diperbarui++;
    }
  }

  return {
    ok: true,
    total: items.length,
    disisipkan,
    diperbarui,
    pesan: `Berhasil menyinkronkan ${items.length} hari libur untuk tahun ${tahun} (${disisipkan} baru, ${diperbarui} diperbarui).`,
  };
}
