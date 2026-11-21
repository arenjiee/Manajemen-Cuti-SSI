export async function simpanMetaLampiran(db, userId, { nama_asli, mime, ukuran, storage_key, file_id = null, data = null }) {
  let finalFileId = file_id;
  if (!finalFileId && data) {
    const ins = await db.query(
      "INSERT INTO file_storage (nama_asli, mime, ukuran, data) VALUES ($1, $2, $3, $4) RETURNING id",
      [nama_asli, mime, ukuran ?? data.length, data]
    );
    finalFileId = ins.rows[0].id;
  }
  const r = await db.query(
    "INSERT INTO lampiran (diunggah_oleh, nama_asli, mime, ukuran, storage_key, file_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
    [userId, nama_asli, mime, ukuran, storage_key, finalFileId]
  );
  return r.rows[0].id;
}

// Lampiran yang diunggah user ini dan belum ditautkan ke pengajuan mana pun.
export async function ambilLampiranUpload(db, id, userId) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const r = await db.query("SELECT id, mime, ukuran FROM lampiran WHERE id=$1 AND diunggah_oleh=$2 AND pengajuan_id IS NULL", [n, userId]);
  return r.rows[0] ?? null;
}

export async function tautkanLampiran(db, lampiranId, pengajuanId) {
  await db.query("UPDATE lampiran SET pengajuan_id=$2 WHERE id=$1", [lampiranId, pengajuanId]);
}

export async function ambilLampiran(db, id) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const r = await db.query("SELECT * FROM lampiran WHERE id=$1", [n]);
  return r.rows[0] ?? null;
}
