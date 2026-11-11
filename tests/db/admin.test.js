import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { testPool, resetDb } from "../helpers/db.js";
import { autentikasi } from "../../src/lib/auth-core.js";
import bcrypt from "bcryptjs";
import { buatUser, ubahUser, hapusUser, daftarUser } from "../../src/lib/queries/users.js";
import { buatDivisi, ubahDivisi, hapusDivisi, daftarDivisi, anggotaDivisi, tambahAnggota, keluarkanAnggota, calonKetua } from "../../src/lib/queries/divisi.js";

const pool = testPool();
let hash;
before(async () => { hash = await bcrypt.hash("pw12345", 4); });
after(() => pool.end());
beforeEach(() => resetDb(pool));

const baru = (o = {}) => ({
  username: "u1", email: "u1@ssi.co.id", password_hash: hash, nama_lengkap: "User Satu",
  role: "karyawan", tanggal_bergabung: "2022-01-01", kuota_awal: 12, ...o,
});
const user = async (o) => (await buatUser(pool, baru(o))).id;

async function pengajuan(pengaju, status, tahap = "leader", divisiId = null) {
  await pool.query("INSERT INTO jenis_cuti (nama,kode,is_system,potong_kuota) VALUES ('Cuti Tahunan','tahunan',true,true) ON CONFLICT DO NOTHING");
  const j = (await pool.query("SELECT id FROM jenis_cuti LIMIT 1")).rows[0].id;
  await pool.query(
    `INSERT INTO pengajuan_cuti (pengaju_id,divisi_id,jenis_id,tanggal_mulai,tanggal_selesai,total_hari,alasan,status,tahap)
     VALUES ($1,$2,$3,'2026-12-07','2026-12-07',1,'a',$4,$5)`, [pengaju, divisiId, j, status, tahap]);
}

test("buatUser: semua field wajib, email valid, email duplikat aktif ditolak", async () => {
  assert.equal((await buatUser(pool, baru({ nama_lengkap: "" }))).ok, false);
  assert.equal((await buatUser(pool, baru({ email: "bukan-email" }))).ok, false);
  assert.equal((await buatUser(pool, baru({ role: "superadmin" }))).ok, false);
  assert.equal((await buatUser(pool, baru())).ok, true);
  const dup = await buatUser(pool, baru({ username: "u2" }));
  assert.equal(dup.ok, false);
  assert.match(dup.pesan, /email/i);
});

test("hapusUser = soft delete: tidak bisa login, hilang dari daftar, riwayat utuh", async () => {
  const id = await user();
  await pengajuan(id, "Approved");
  assert.equal((await hapusUser(pool, id)).ok, true);
  assert.equal(await autentikasi(pool, "u1", "pw12345"), null);
  assert.equal((await daftarUser(pool, {})).length, 0);
  assert.equal((await pool.query("SELECT count(*)::int n FROM pengajuan_cuti WHERE pengaju_id=$1", [id])).rows[0].n, 1);
});

test("hapusUser ditolak untuk admin/hrd, ketua yang masih memimpin, dan pengajuan berjalan", async () => {
  const admin = await user({ username: "a", email: "a@x.id", role: "admin" });
  assert.equal((await hapusUser(pool, admin)).ok, false);
  const hrd = await user({ username: "h", email: "h@x.id", role: "hrd" });
  assert.equal((await hapusUser(pool, hrd)).ok, false);

  const ketua = await user({ username: "k", email: "k@x.id", role: "ketua_divisi" });
  await buatDivisi(pool, { nama: "FLM", ketuaId: ketua });
  const r = await hapusUser(pool, ketua);
  assert.equal(r.ok, false);
  assert.match(r.pesan, /memimpin/i);

  const a = await user({ username: "p", email: "p@x.id" });
  await pengajuan(a, "Pending");
  assert.equal((await hapusUser(pool, a)).ok, false);
  await pool.query("UPDATE pengajuan_cuti SET status='Approved by Leader', tahap='hrd'");
  assert.equal((await hapusUser(pool, a)).ok, false);
  await pool.query("UPDATE pengajuan_cuti SET status='Approved'");
  assert.equal((await hapusUser(pool, a)).ok, true);
});

test("ubahUser: validasi, email tetap unik, ketua pemimpin tidak boleh diganti rolenya", async () => {
  const a = await user({ username: "a", email: "a@x.id" });
  await user({ username: "b", email: "b@x.id" });
  assert.equal((await ubahUser(pool, a, { username: "a", email: "b@x.id", nama_lengkap: "A", role: "karyawan", aktif: true })).ok, false);
  assert.equal((await ubahUser(pool, a, { username: "a", email: "a@x.id", nama_lengkap: "", role: "karyawan", aktif: true })).ok, false);
  assert.equal((await ubahUser(pool, a, { username: "a2", email: "a@x.id", nama_lengkap: "A Baru", role: "karyawan", aktif: false })).ok, true);
  const k = await user({ username: "k", email: "k@x.id", role: "ketua_divisi" });
  await buatDivisi(pool, { nama: "CIT", ketuaId: k });
  assert.equal((await ubahUser(pool, k, { username: "k", email: "k@x.id", nama_lengkap: "K", role: "karyawan", aktif: true })).ok, false);
});

test("daftarUser: filter role, divisi, aktif, masa kerja; sortir", async () => {
  const ketua = await user({ username: "k", email: "k@x.id", role: "ketua_divisi", nama_lengkap: "Zed" });
  const d = (await buatDivisi(pool, { nama: "FLM", ketuaId: ketua })).id;
  const lama = await user({ username: "l", email: "l@x.id", nama_lengkap: "Alfa", tanggal_bergabung: "2020-01-01" });
  const baruAja = await user({ username: "n", email: "n@x.id", nama_lengkap: "Beta", tanggal_bergabung: new Date().toISOString().slice(0, 10) });
  await tambahAnggota(pool, d, lama);
  await pool.query("UPDATE users SET aktif=false WHERE id=$1", [baruAja]);
  assert.deepEqual((await daftarUser(pool, { role: "ketua_divisi" })).map((u) => u.username), ["k"]);
  assert.deepEqual((await daftarUser(pool, { divisiId: d, urut: "nama" })).map((u) => u.username), ["l", "k"]);
  assert.deepEqual((await daftarUser(pool, { aktif: "false" })).map((u) => u.username), ["n"]);
  assert.deepEqual((await daftarUser(pool, { masaKerja: "lt1" })).map((u) => u.username), ["n"]);
  assert.equal((await daftarUser(pool, { urut: "nama" }))[0].nama_lengkap, "Alfa");
});

test("buatDivisi: nama unik, ketua wajib dan valid, ketua yang sudah memimpin tidak bisa dipilih", async () => {
  const k1 = await user({ username: "k1", email: "k1@x.id", role: "ketua_divisi" });
  const k2 = await user({ username: "k2", email: "k2@x.id", role: "ketua_divisi" });
  const biasa = await user({ username: "b", email: "b@x.id" });
  assert.equal((await buatDivisi(pool, { nama: "", ketuaId: k1 })).ok, false);
  assert.equal((await buatDivisi(pool, { nama: "FLM", ketuaId: null })).ok, false);
  assert.equal((await buatDivisi(pool, { nama: "FLM", ketuaId: biasa })).ok, false);
  const a = await buatDivisi(pool, { nama: "FLM", ketuaId: k1 });
  assert.equal(a.ok, true);
  assert.equal((await buatDivisi(pool, { nama: "flm", ketuaId: k2 })).ok, false);
  assert.equal((await buatDivisi(pool, { nama: "CIT", ketuaId: k1 })).ok, false);
  assert.deepEqual((await calonKetua(pool)).map((u) => u.id), [k2]);
  assert.equal((await pool.query("SELECT divisi_id FROM users WHERE id=$1", [k1])).rows[0].divisi_id, a.id);
});

test("ubahDivisi: ganti ketua memindahkan keanggotaan; nama tetap unik", async () => {
  const k1 = await user({ username: "k1", email: "k1@x.id", role: "ketua_divisi" });
  const k2 = await user({ username: "k2", email: "k2@x.id", role: "ketua_divisi" });
  const a = (await buatDivisi(pool, { nama: "FLM", ketuaId: k1 })).id;
  await buatDivisi(pool, { nama: "CIT", ketuaId: user && (await user({ username: "k3", email: "k3@x.id", role: "ketua_divisi" })) });
  assert.equal((await ubahDivisi(pool, a, { nama: "CIT", deskripsi: "", ketuaId: k1 })).ok, false);
  assert.equal((await ubahDivisi(pool, a, { nama: "FLM2", deskripsi: "x", ketuaId: k2 })).ok, true);
  const r = await pool.query("SELECT id, divisi_id FROM users WHERE id IN ($1,$2) ORDER BY id", [k1, k2]);
  assert.equal(r.rows[0].divisi_id, null);
  assert.equal(r.rows[1].divisi_id, a);
});

test("hapusDivisi: soft delete; anggota dan ketua kehilangan divisi", async () => {
  const k = await user({ username: "k", email: "k@x.id", role: "ketua_divisi" });
  const d = (await buatDivisi(pool, { nama: "FLM", ketuaId: k })).id;
  const m = await user({ username: "m", email: "m@x.id" });
  await tambahAnggota(pool, d, m);
  assert.equal((await hapusDivisi(pool, d)).ok, true);
  assert.equal((await daftarDivisi(pool, {})).length, 0);
  const r = await pool.query("SELECT divisi_id FROM users WHERE id IN ($1,$2)", [k, m]);
  assert.ok(r.rows.every((x) => x.divisi_id === null));
});

test("hapusDivisi ditolak jika ada pengajuan Pending tahap leader", async () => {
  const k = await user({ username: "k", email: "k@x.id", role: "ketua_divisi" });
  const d = (await buatDivisi(pool, { nama: "FLM", ketuaId: k })).id;
  const m = await user({ username: "m", email: "m@x.id" });
  await tambahAnggota(pool, d, m);
  await pengajuan(m, "Pending", "leader", d);
  const r = await hapusDivisi(pool, d);
  assert.equal(r.ok, false);
  assert.match(r.pesan, /menunggu/i);
});

test("anggota: tambah hanya karyawan tanpa divisi; keluarkan tidak menghapus akun; ketua tidak bisa dikeluarkan", async () => {
  const k = await user({ username: "k", email: "k@x.id", role: "ketua_divisi" });
  const d = (await buatDivisi(pool, { nama: "FLM", ketuaId: k })).id;
  const d2 = (await buatDivisi(pool, { nama: "CIT", ketuaId: await user({ username: "k2", email: "k2@x.id", role: "ketua_divisi" }) })).id;
  const m = await user({ username: "m", email: "m@x.id" });
  assert.equal((await tambahAnggota(pool, d, m)).ok, true);
  assert.equal((await tambahAnggota(pool, d2, m)).ok, false);
  assert.equal((await tambahAnggota(pool, d2, k)).ok, false);
  assert.deepEqual((await anggotaDivisi(pool, d)).map((a) => a.username).sort(), ["k", "m"]);
  assert.equal((await keluarkanAnggota(pool, k)).ok, false);
  assert.equal((await keluarkanAnggota(pool, m)).ok, true);
  assert.equal((await daftarUser(pool, {})).length >= 3, true);
});

test("daftarDivisi: ketua, jumlah anggota, filter dan sortir", async () => {
  const k = await user({ username: "k", email: "k@x.id", role: "ketua_divisi", nama_lengkap: "Kartono" });
  const d = (await buatDivisi(pool, { nama: "FLM", ketuaId: k })).id;
  await buatDivisi(pool, { nama: "CIT", ketuaId: await user({ username: "k2", email: "k2@x.id", role: "ketua_divisi" }) });
  const m = await user({ username: "m", email: "m@x.id" });
  await tambahAnggota(pool, d, m);
  const semua = await daftarDivisi(pool, { urut: "anggota" });
  assert.equal(semua[0].nama, "FLM");
  assert.equal(semua[0].jumlah_anggota, 2);
  assert.equal(semua[0].ketua_nama, "Kartono");
  assert.deepEqual((await daftarDivisi(pool, { q: "cit" })).map((x) => x.nama), ["CIT"]);
  assert.deepEqual((await daftarDivisi(pool, { urut: "nama_desc" })).map((x) => x.nama), ["FLM", "CIT"]);
});

test("daftarUser: pencarian q mencocokkan nama, username, atau email", async () => {
  await user({ username: "alfa", email: "satu@x.id", nama_lengkap: "Alfa Omega" });
  await user({ username: "beta", email: "dua@x.id", nama_lengkap: "Beta" });
  assert.deepEqual((await daftarUser(pool, { q: "omega" })).map((u) => u.username), ["alfa"]);
  assert.deepEqual((await daftarUser(pool, { q: "BETA" })).map((u) => u.username), ["beta"]);
  assert.deepEqual((await daftarUser(pool, { q: "dua@" })).map((u) => u.username), ["beta"]);
});
