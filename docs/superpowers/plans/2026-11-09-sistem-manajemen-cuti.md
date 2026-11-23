# Sistem Manajemen Cuti Karyawan (LeaveSync) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi web pengajuan, verifikasi, dan persetujuan cuti 4 role beserta fitur advanced (tanpa Blackout Period).

**Architecture:** Satu project Next.js App Router. Seluruh aturan cuti ada di `src/lib/leave/` sebagai fungsi murni yang menerima konteks yang sudah dimuat dari DB, sehingga dipakai bersama oleh submit, approval, what-if, dan dashboard. SQL hanya di `src/lib/queries/`, menerima `db` (pool atau client transaksi) sebagai argumen.

**Tech Stack:** Next.js (JavaScript/.jsx), PostgreSQL + `pg` (raw SQL), Tailwind, `bcryptjs`, `jose`, `pdf-lib`, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-09-sistem-manajemen-cuti-design.md`

## Global Constraints

- JavaScript/.jsx saja, tanpa TypeScript. Query selalu parameterized (`$1, $2`), tidak pernah string template.
- Semua file di `src/lib/**` memakai **import relatif**, bukan alias `@/`, agar bisa dijalankan `node --test`. `package.json` memakai `"type": "module"`; verifikasi `npm run build` tetap lolos setelah Task 1.
- Tanggal = string `YYYY-MM-DD`; "hari ini" dari `new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" })`.
- Sisa kuota dihitung dari pengajuan aktif, tidak disimpan. Aktif = `Pending`, `Approved by Leader`, `Approved`. Tahun kalender, tanpa carry-over.
- Role: `admin|karyawan|ketua_divisi|hrd`, dibaca dari DB tiap request. `requireRole` dipanggil di setiap Server Action, Route Handler, dan halaman.
- Lampiran: PDF/JPG/PNG, maksimal 2 MB, disimpan di `uploads/` (di luar `public/`), nama diacak, dilayani hanya lewat `/api/lampiran/[id]`.
- Kuota awal default 12 `NUMERIC(4,1)`; setengah hari = 0,5 dan hanya jika mulai = selesai; H-3 untuk Tahunan; Sakit boleh mundur maksimal 3 hari; masa kerja minimal 1 tahun untuk Tahunan.
- Kapasitas harian = `max(1, floor(max_persen_cuti * jumlahAnggotaAktif / 100))`; Cuti Sakit tidak diblokir kapasitas tetapi dihitung bagi pengajuan lain.
- Tidak dibuat: Blackout, pengajuan oleh HRD/Admin, delegasi Ketua Divisi, pembatalan setelah `Approved by Leader`, email, carry-over.
- Pekerjaan dibagi per **Bagian (A-F)**, bukan per hari. Mengerjakan dua Bagian dalam sehari diperbolehkan; jangan mulai Bagian berikutnya sebelum tes Bagian sebelumnya hijau.

## Review Focus

1. Rentang yang seluruhnya jatuh di akhir pekan/hari libur (total 0 hari), termasuk setengah hari di hari libur: ditolak dengan pesan jelas. Tes di Task 3.
2. URL/ID/tanggal tidak valid (`/cuti/abc`, tanggal `2026-02-31`, mulai > selesai): 404 atau pesan validasi, bukan error 500. Tes di Task 3 (tanggal) serta Task 9-10 (id).
3. Akses lintas pengguna lewat URL langsung (detail cuti dan lampiran milik orang lain, halaman role lain): 403/404. Tes di Task 10 dan Task 20.
4. Klik ganda / dua submit bersamaan untuk slot kapasitas terakhir atau approve ganda: hanya satu yang berhasil. Tes di Task 9, 11, dan 12.
5. Karyawan/Ketua tanpa divisi, divisi tanpa anggota lain, atau tanpa kandidat rekan pengganti: pesan jelas, tidak crash. Tes di Task 4 dan 9.

---

## Bagian A: Fondasi

### Task 1: Scaffold project, dependensi, token desain

**Files:**
- Create: project `leavesync` (opsi `create-next-app` sama seperti Bab 8: JS, ESLint, Tailwind, `src/`, App Router, Turbopack, tanpa alias kustom), `package.json` (scripts), `.env.local`, `.gitignore` (+`uploads/`), `src/app/globals.css` (token), `public/fonts/` (Fraunces, Instrument Sans), `src/app/layout.jsx`.

**Interfaces:** Produces: script `npm test` = `node --test "src/lib/**/*.test.js" "tests/**/*.test.js"`; env `DATABASE_URL`, `DATABASE_URL_TEST`, `SESSION_SECRET` (minimal 32 karakter); CSS variables `--bg --surface --ink --ink-muted --accent --ok --warn --bad --radius --ease` (warna `oklch`, bukan hitam/putih murni).

- [ ] Scaffold, `npm i pg bcryptjs jose pdf-lib`, set `"type": "module"`.
- [ ] Definisikan token di `globals.css`, `@font-face` lokal, `prefers-reduced-motion` mematikan transisi.
- [ ] Verifikasi: `npm run build` lolos; `npm test` berjalan (0 tes) tanpa error.
- [ ] Commit `chore: scaffold leavesync`.

### Task 2: Skema, seed, dan setup DB

**Files:**
- Create: `db/schema.sql`, `scripts/setup-db.mjs`, `scripts/seed.mjs`, `seed/lampiran/` (2 file contoh), `tests/helpers/db.js`.
- Test: `tests/db/schema.test.js`

**Interfaces:** Produces: tabel sesuai spec bagian 4 (`users, divisi, jenis_cuti, pengajuan_cuti, persetujuan, lampiran, hari_libur, notifications, pengaturan`); `npm run db:setup` (drop+create+seed); `resetDb(pool)` di `tests/helpers/db.js` untuk `DATABASE_URL_TEST`.

- [ ] Tes gagal dulu: `schema.test.js` memeriksa (a) email duplikat aktif ditolak, email milik user ber-`deleted_at` boleh dipakai ulang; (b) `ketua_id` ganda di dua divisi ditolak; (c) CHECK setengah hari dengan mulai != selesai ditolak; (d) `selesai < mulai` ditolak.
- [ ] Tulis `schema.sql` termasuk unique index parsial dan CHECK; jalankan tes sampai hijau.
- [ ] `seed.mjs`: hash password dengan `bcryptjs`; data sesuai spec bagian 12 (CPC/CIT/FLM, satu user per role, karyawan < 1 tahun, kuota hampir hangus, pengajuan di setiap status, Sakit berlampiran, hari libur 2026, ketua yang sedang cuti); jenis sistem Tahunan (`potong_kuota=true`, batas 3) dan Sakit (batas -3, wajib lampiran); salin `seed/lampiran/*` ke `uploads/`.
- [ ] Verifikasi: `npm run db:setup` lalu `SELECT role, count(*) FROM users GROUP BY role` menampilkan 4 role.
- [ ] Commit `feat: skema dan seed`.

### Task 3: Fungsi tanggal dan hitung hari kerja (TDD)

**Files:**
- Create: `src/lib/leave/tanggal.js`, `src/lib/leave/hitung-hari.js`
- Test: `src/lib/leave/tanggal.test.js`, `src/lib/leave/hitung-hari.test.js`

**Interfaces:** Produces:
- `tanggalValid(s: string): boolean` (menolak `2026-02-31`, format selain `YYYY-MM-DD`)
- `hariIni(): string`, `tambahHari(s, n): string`, `selisihHari(a, b): number`
- `hariDalamRentang(mulai, selesai): string[]`, `adalahAkhirPekan(s): boolean`
- `hariKerjaDalamRentang(mulai, selesai, libur: Set<string>): string[]`
- `hitungTotalHari(mulai, selesai, libur: Set<string>, setengahHari: boolean): number` (0 jika tak ada hari kerja; 0,5 hanya jika setengah hari dan hari itu hari kerja)

- [ ] Tes gagal dulu: Senin-Jumat = 5; Jumat-Senin = 2; rentang berisi hari libur nasional dikurangi; Sabtu-Minggu = 0; setengah hari di Senin = 0,5; setengah hari di Sabtu/hari libur = 0; `tanggalValid("2026-02-31")` false; rentang lintas bulan/tahun benar; `hariIni()` memakai zona Makassar (tes dengan tanggal tetap lewat parameter opsional `now: Date`).
- [ ] Jalankan, pastikan gagal; implementasi dengan aritmetika UTC murni (tanpa library tanggal); jalankan, pastikan hijau.
- [ ] Commit `feat(leave): tanggal dan hari kerja`.

### Task 4: Aturan murni lain: kuota, overlap, kapasitas, rekan, jenis, validasi (TDD)

**Files:**
- Create: `src/lib/leave/kuota.js`, `overlap.js`, `kapasitas.js`, `rekan.js`, `aturan-jenis.js`, `validasi.js`
- Test: `src/lib/leave/*.test.js` (satu per file)

**Interfaces:** Consumes: Task 3. Produces:
- `sisaKuota(kuotaAwal: number, terpakai: number): number`
- `adaOverlap(mulai, selesai, aktif: {mulai, selesai}[]): boolean` (batas inklusif)
- `batasHarian(maxPersen: number, jumlahAnggotaAktif: number): number`
- `cekKapasitas({ hariKerja: string[], okupansi: Map<string, number>, batas: number }): { ok: boolean, tanggalPenuh?: string, terisi?: number, batas?: number }` (menghitung `okupansi + 1 <= batas` per hari)
- `kandidatRekan(anggota: {id, aktif, pengajuanAktif: {mulai, selesai}[]}[], pengajuId: number, mulai, selesai): number[]`
- `cekAturanJenis({ jenis, mulai, hariIni, tanggalBergabung }): string | null` (pesan error atau null)
- `validasiPengajuan(input, konteks): { ok: true, totalHari: number } | { ok: false, kode: string, pesan: string }`. `konteks` = `{ hariIni, pengaju: {id, divisiId, tanggalBergabung, kuotaAwal}, jenis: {id, kode, kuotaHari, batasPengajuanHari, wajibLampiran, potongKuota}, hariLibur: Set, pengajuanAktifPengaju: [], terpakaiPotongKuota: number, terpakaiJenis: number, handover: {id, divisiId, aktif, pengajuanAktif: []} | null, divisi: {maxPersen, jumlahAnggotaAktif} | null, okupansi: Map, lampiran: {mime, ukuran} | null }`; urutan pemeriksaan persis spec bagian 7.

- [ ] Tes gagal dulu, minimal: kuota desimal (12 − 11,5 = 0,5); overlap batas inklusif; `batasHarian(10, 8)` = 1 (minimum 1), `batasHarian(25, 10)` = 2; kapasitas penuh pada hari ke-2 melaporkan `tanggalPenuh`; Tahunan H-2 ditolak, H-3 lolos; Tahunan oleh karyawan < 1 tahun ditolak, Sakit tetap lolos; Sakit mundur 3 hari lolos, 4 hari ditolak; Sakit tanpa lampiran ditolak; Sakit tidak diblokir kapasitas; potong_kuota lintas tahun ditolak, Sakit lintas tahun lolos; kuota kurang ditolak; `pengaju.divisiId == null` → `kode: "TANPA_DIVISI"`; divisi 1 anggota tanpa kandidat rekan → `kode: "TANPA_REKAN"`; rekan beda divisi / sedang cuti / diri sendiri ditolak; lampiran bertipe/ukuran salah ditolak.
- [ ] Jalankan, pastikan gagal; implementasi per file; `validasi.js` memanggil fungsi lain berurutan dan berhenti di kegagalan pertama; jalankan, pastikan hijau.
- [ ] Commit `feat(leave): aturan validasi`.

### Task 5: Auth: session, guard, login/logout

**Files:**
- Create: `src/lib/session.js`, `src/lib/guard.js`, `src/lib/queries/users.js` (bagian auth), `src/app/(auth)/login/page.jsx`, `src/app/api/login/route.js`, `src/app/api/logout/route.js`
- Test: `src/lib/session.test.js`, `tests/db/auth.test.js`

**Interfaces:** Produces:
- `buatToken(userId: number, remember: boolean): Promise<{ token: string, maxAge?: number }>`; `bacaToken(token: string): Promise<number | null>`
- `getUser(): Promise<User | null>` membaca cookie lalu DB; `null` bila `aktif=false` atau `deleted_at` terisi
- `requireRole(roles: string[]): Promise<User>`: tanpa sesi → `redirect("/login")`; role salah → `redirect("/dashboard")`
- `guardApi(roles: string[]): Promise<{ user: User } | { error: Response }>` (401/403 JSON)

- [ ] Tes gagal dulu: token valid dibaca balik; token dirusak/kedaluwarsa → `null`; login benar mengembalikan cookie `httpOnly`; password salah dan email tak dikenal menghasilkan pesan yang **sama**; user dinonaktifkan setelah login → `getUser()` `null`; role diubah di DB langsung berlaku tanpa login ulang; request POST dengan `Origin` asing ditolak; Remember Me menetapkan `maxAge` 30 hari, tanpa itu cookie sesi.
- [ ] Implementasi; halaman login (email atau username, password, Remember Me); jalankan tes sampai hijau.
- [ ] Commit `feat: autentikasi`.

### Task 6: AppShell, navigasi per role, shared components

**Files:**
- Create: `src/app/(app)/layout.jsx`, `src/components/AppShell.jsx`, `StatCard.jsx`, `StatusBadge.jsx`, `Modal.jsx`, `DataTable.jsx`, `FilterBar.jsx`, `Timeline.jsx`, `src/lib/nav.js`
- Modify: `src/app/(app)/dashboard/page.jsx` (placeholder per role)

**Interfaces:** Produces: `menuUntukRole(role): {label, href}[]`; `<StatusBadge status tahap />` (teks + warna); `<DataTable kolom rows />` dan `<FilterBar fields />` yang membaca/menulis `searchParams`; `<Modal />` dengan fokus terkunci dan Esc menutup; `<Timeline items />`.

- [ ] Verifikasi manual: login sebagai tiap role menampilkan menu yang berbeda; membuka URL halaman role lain mengalihkan ke `/dashboard`; layar < 768px menjadikan sidebar drawer; `prefers-reduced-motion` mematikan transisi.
- [ ] Commit `feat: app shell dan komponen bersama`.

### Task 7: Admin: user dan divisi

**Files:**
- Create: `src/lib/queries/{users,divisi}.js` (CRUD), `src/app/(app)/admin/users/{page.jsx,actions.js,baru/page.jsx,[id]/page.jsx}`, `src/app/(app)/admin/divisi/{page.jsx,actions.js,[id]/page.jsx}`
- Test: `tests/db/admin.test.js`

**Interfaces:** Produces: `hapusUser(db, id): Promise<{ok}|{ok:false,pesan}>`, `hapusDivisi(db, id)`, `daftarUser(db, filter: {role, divisiId, aktif, masaKerja, urut})`, `daftarDivisi(db, filter)` (menyertakan ketua dan jumlah anggota), `anggotaDivisi(db, divisiId)`, `tambahAnggota(db, divisiId, userId)`, `keluarkanAnggota(db, userId)`.

- [ ] Tes gagal dulu: hapus user = soft delete (login gagal, hilang dari daftar, riwayat utuh); hapus ketua yang masih memimpin divisi ditolak; hapus user dengan pengajuan `Pending` atau `Approved by Leader` ditolak; hapus Admin/HRD ditolak; hapus divisi menge-nol-kan `divisi_id` anggota dan ketua; hapus divisi dengan pengajuan `Pending` tahap `leader` ditolak; ketua yang sudah memimpin divisi lain tidak bisa dipilih; nama divisi duplikat ditolak; email duplikat aktif ditolak; semua tindakan memanggil `requireRole(["admin"])`.
- [ ] Implementasi dengan filter dan sortir via `searchParams` sesuai deskripsi tugas; Create/Edit user dengan validasi semua field wajib; konfirmasi dua kali saat hapus divisi.
- [ ] Jalankan tes; verifikasi manual satu siklus CRUD per entitas.
- [ ] Commit `feat(admin): user dan divisi`.

---

## Bagian B: Pengajuan Cuti

### Task 8: Jenis cuti dan hari libur admin

**Files:**
- Create: `src/lib/queries/{jenis-cuti,hari-libur}.js`, `src/app/(app)/admin/jenis-cuti/*`, `src/app/(app)/admin/hari-libur/*`
- Test: `tests/db/jenis.test.js`

**Interfaces:** Produces: `daftarJenisAktif(db): JenisCuti[]`, `muatHariLibur(db, tahun): Promise<Set<string>>`.

- [ ] Tes gagal dulu: baris sistem (Tahunan, Sakit) tidak bisa dihapus tetapi aturannya bisa diubah; jenis baru dengan kuota/lampiran/potong kuota tersimpan dan terbaca `daftarJenisAktif`; tanggal libur duplikat ditolak; `muatHariLibur` mengembalikan format `YYYY-MM-DD`.
- [ ] Implementasi dan jalankan tes. Commit `feat(admin): jenis cuti dan hari libur`.

---

### Task 9: Memuat konteks dan menyimpan pengajuan

**Files:**
- Create: `src/lib/queries/pengajuan.js`, `src/lib/queries/lampiran.js`, `src/app/(app)/cuti/ajukan/{page.jsx,actions.js}`, `src/app/api/lampiran/route.js` (upload)
- Test: `tests/db/pengajuan.test.js`

**Interfaces:** Consumes: `validasiPengajuan` (Task 4). Produces:
- `muatKonteks(db, pengajuId: number, input): Promise<Konteks>` (bentuk persis Task 4)
- `simpanPengajuan(pool, pengajuId: number, input, lampiran?): Promise<{ ok: true, id: number } | { ok: false, kode: string, pesan: string }>`: membuka transaksi, `SELECT ... FROM divisi WHERE id=$1 FOR UPDATE`, memuat konteks, memanggil `validasiPengajuan`, lalu INSERT `pengajuan_cuti` (`divisi_id` snapshot, tahap `leader` untuk karyawan, `hrd` untuk ketua divisi), lampiran, dan notifikasi ke rekan pengganti serta approver tahap pertama
- `terpakaiPotongKuota(db, userId, tahun): number`
- `batalkanPengajuan(db, id, userId, alasan): Promise<{ok}>`

- [ ] Tes gagal dulu: karyawan → `Pending`/`leader`, ketua → `Pending`/`hrd`; semua kegagalan validasi tidak membuat baris apa pun; **dua `simpanPengajuan` paralel untuk slot kapasitas terakhir: tepat satu `ok:true`**; kuota berkurang saat submit dan kembali saat `Cancelled`/`Rejected`; batal tanpa alasan ditolak; batal pengajuan milik orang lain ditolak; batal selain `Pending` ditolak; ID non-numerik menghasilkan error terkendali, bukan 500.
- [ ] Implementasi; upload lewat Route Handler `FormData` menulis file ke `uploads/` dengan nama acak (`crypto.randomUUID()` + ekstensi dari mime yang divalidasi).
- [ ] Jalankan tes; commit `feat: pengajuan cuti`.

### Task 10: Form pengajuan, daftar saya, detail, dan lampiran

**Files:**
- Create: `src/app/(app)/cuti/{page.jsx,[id]/page.jsx}`, `src/app/(app)/cuti/ajukan/FormPengajuan.jsx` (client), `src/app/api/lampiran/[id]/route.js`, `src/lib/queries/detail.js`

**Interfaces:** Produces: `detailPengajuan(db, id, user): Promise<Detail | null>` (null jika tidak berhak: pemilik, ketua dengan `divisi_id` sesuai, HRD, Admin); `GET /api/lampiran/[id]` memakai `guardApi` + aturan akses yang sama.

- [ ] Tes gagal dulu (`tests/db/akses.test.js`): karyawan A tidak bisa membaca detail/lampiran karyawan B; ketua divisi lain tidak bisa; ID non-numerik → 404; lampiran yang tidak ada → 404.
- [ ] Implementasi form sesuai layout deskripsi (jenis, setengah hari, tanggal, alasan, dropdown rekan dari `kandidatRekan`, catatan tugas, alamat, nomor darurat, lampiran, Submit/Reset/Cancel), daftar dengan filter status dan sortir, detail dengan `Timeline`, pratinjau lampiran, tombol batal berModal (alasan wajib).
- [ ] Verifikasi manual alur karyawan: ajukan → muncul `Pending` → batal → kuota kembali.
- [ ] Commit `feat: form dan detail cuti`.

---

## Bagian C: Approval

### Task 11: Verifikasi Ketua Divisi

**Files:**
- Create: `src/lib/queries/approval.js`, `src/app/(app)/verifikasi/{page.jsx,actions.js}`, `src/components/KartuApproval.jsx`
- Test: `tests/db/approval.test.js`

**Interfaces:** Produces: `putuskan(pool, { pengajuanId, approverId, tahap: "leader"|"hrd", keputusan: "approve"|"reject", catatan }): Promise<{ ok: true } | { ok: false, pesan: string }>`: satu `UPDATE ... WHERE id=$1 AND status=... AND tahap=...`, memeriksa `rowCount`, menulis `persetujuan` dan notifikasi dalam transaksi.

- [ ] Tes gagal dulu: approve `Pending/leader` → `Approved by Leader` + tahap `hrd`; reject → `Rejected` + `ditolak_oleh='leader'`; reject tanpa catatan ditolak; **dua `putuskan` paralel pada pengajuan yang sama: satu `ok`, satu gagal**; approve pengajuan yang sudah `Cancelled` gagal; ketua tidak bisa memutuskan pengajuan miliknya, atau milik divisi lain; antrean memakai `pengajuan.divisi_id`, sehingga ketua baru langsung melihat antrean lama; role selain `ketua_divisi` ditolak.
- [ ] Implementasi halaman kartu (nama, foto/inisial, jenis, periode, alasan, catatan tugas, rekan, tanggal pengajuan) dengan modal approve/reject.
- [ ] Jalankan tes; commit `feat: verifikasi ketua divisi`.

### Task 12: Persetujuan final HRD

**Files:**
- Create: `src/app/(app)/persetujuan/{page.jsx,actions.js}`; Modify: `src/lib/queries/approval.js`

**Interfaces:** Consumes: `putuskan`, `cekKapasitas`, `sisaKuota`. Produces: `muatPeringatanHrd(db, pengajuanId): Promise<{ kuotaKurang: boolean, kapasitasPenuh?: {tanggal, terisi, batas} }>`; `approveBanyak(pool, hrdId, ids: number[]): Promise<{ berhasil: number[], dilewati: {id, pesan}[] }>`.

- [ ] Tes gagal dulu: approve final → `Approved`; reject tanpa catatan ditolak; `approveBanyak` dengan satu id yang sudah dibatalkan melewatinya dan tetap memproses sisanya; peringatan kapasitas muncul saat okupansi melebihi batas dan HRD tetap bisa menyetujui; ketua yang mengajukan langsung muncul di antrean HRD tanpa tahap leader; informasi atasan (nama, tanggal, catatan) tampil untuk alur karyawan.
- [ ] Implementasi halaman kartu + checkbox multi-approve (tanpa multi-reject).
- [ ] Verifikasi manual alur penuh dua jalur. **Milestone:** inti sistem dapat didemokan.
- [ ] Commit `feat: persetujuan final hrd`.

---

## Bagian D: Dashboard, Profil, Riwayat

### Task 13: Dashboard empat role

**Files:**
- Create: `src/lib/queries/dashboard.js`; Modify: `src/app/(app)/dashboard/page.jsx`
- Test: `tests/db/dashboard.test.js`

**Interfaces:** Produces: `dashboardAdmin(db)`, `dashboardKaryawan(db, userId)`, `dashboardKetua(db, userId)`, `dashboardHrd(db)`; masing-masing mengembalikan metrik persis seperti daftar di spec/deskripsi (termasuk sisa kuota desimal, daftar masa kerja < 1 tahun, anggota yang cuti minggu ini, karyawan cuti bulan ini).

- [ ] Tes gagal dulu terhadap data seed: kuota karyawan seed = 12 − pemakaian aktif; masa kerja < 1 tahun muncul di Admin; user terhapus tidak terhitung; sisa pecahan 0,5 tampil benar.
- [ ] Implementasi dengan `StatCard`; commit `feat: dashboard`.

### Task 14: Profil

**Files:**
- Create: `src/app/(app)/profil/{page.jsx,actions.js}`, `src/app/api/foto/[id]/route.js`

- [ ] Tes gagal dulu (`tests/db/profil.test.js`): user hanya dapat mengubah data miliknya; Admin dapat mengubah siapa pun; ganti role lewat form profil oleh non-admin ditolak; foto > 2 MB atau bukan gambar ditolak; kuota tahunan, terpakai, dan sisa konsisten dengan dashboard.
- [ ] Implementasi dan commit `feat: profil`.

### Task 15: Riwayat dan notifikasi

**Files:**
- Create: `src/app/(app)/riwayat/page.jsx`, `src/app/(app)/notifikasi/page.jsx`, `src/lib/queries/riwayat.js`

**Interfaces:** Produces: `riwayat(db, user, filter)` dengan cakupan per role (karyawan: miliknya; ketua: `divisi_id` miliknya; HRD/Admin: semua); `notifikasiUser(db, userId)`, `tandaiDibaca(db, userId, id)`.

- [ ] Tes gagal dulu: cakupan per role benar; menandai notifikasi milik orang lain ditolak; filter status dan sortir bekerja.
- [ ] Implementasi dan commit `feat: riwayat dan notifikasi`.

---

## Bagian E: Fitur Advanced

### Task 16: Kapasitas tim (pengaturan dan peringatan)

**Files:**
- Create: `src/app/(app)/kapasitas/{page.jsx,actions.js}`; Modify: `src/lib/queries/divisi.js`, `FormPengajuan.jsx`

**Interfaces:** Produces: `setMaxPersen(db, divisiId, persen: number)` (0-100, hanya HRD/Admin).

- [ ] Tes gagal dulu: persen di luar 0-100 ditolak; mengubah persen mengubah hasil `simpanPengajuan` berikutnya; role lain ditolak.
- [ ] Implementasi; verifikasi bahwa form menampilkan pesan "FLM penuh tanggal X (n/n)" saat ditolak.
- [ ] Commit `feat: kapasitas tim`.

### Task 17: What-if dan kalender

**Files:**
- Create: `src/app/api/whatif/route.js`, `src/components/{PanelSimulasi,RangeCalendar}.jsx`
- Test: `tests/db/whatif.test.js`

**Interfaces:** Consumes: `muatKonteks`, `validasiPengajuan`. Produces: `POST /api/whatif` body = input form, respons `{ totalHari, sisaSebelum, sisaSesudah, kapasitas: {tanggal: {terisi, batas}}, tanda: {libur: string[], cutiSendiri: string[], rekanCuti: string[]}, pesan: string | null }`; tidak menulis apa pun ke DB.

- [ ] Tes gagal dulu: untuk input yang sama, `pesan` what-if identik dengan hasil `simpanPengajuan`; what-if tidak membuat baris; guard menolak role selain karyawan/ketua; input tanggal tidak valid mengembalikan `pesan`, bukan 500.
- [ ] Implementasi panel dengan debounce 300 ms dan `AbortController`; commit `feat: simulasi kuota`.

### Task 18: Peringatan kuota hangus

**Files:**
- Create: `src/app/(app)/kuota-hangus/{page.jsx,actions.js}`, `src/lib/queries/kuota-hangus.js`

**Interfaces:** Produces: `daftarKuotaHangus(db, { ambang: number, bulanMulai: number, hariIni: string })`; `ingatkan(db, userId)`; pengaturan `ambang_kuota_hangus` dan `bulan_mulai_peringatan` di tabel `pengaturan`.

- [ ] Tes gagal dulu: karyawan dengan sisa ≥ ambang muncul hanya jika bulan ≥ `bulanMulai`; "Ingatkan" membuat satu notifikasi; ambang dapat diubah HRD/Admin; karyawan < 1 tahun tidak muncul.
- [ ] Implementasi dan commit `feat: kuota hangus`.

### Task 19: Surat cuti PDF

**Files:**
- Create: `src/lib/surat.js`, `src/app/api/surat/[id]/route.js`
- Test: `tests/db/surat.test.js`

**Interfaces:** Produces: `buatSuratPdf(detail: Detail): Promise<Uint8Array>`; `GET /api/surat/[id]` → `application/pdf`.

- [ ] Tes gagal dulu: status selain `Approved` → 409; selain pengaju → 403; hasil diawali bytes `%PDF`; ID tak valid → 404.
- [ ] Template satu halaman (nomor surat, data karyawan, periode, rekan pengganti, pemberi persetujuan); tombol unduh di halaman detail. Commit `feat: surat cuti pdf`.

---

## Bagian F: Penutup

### Task 20: Pengerasan dan data demo

**Files:**
- Create: `tests/db/keamanan.test.js`, `docs/checklist-demo.md`; Modify: `scripts/seed.mjs`

- [ ] Tes gagal dulu: untuk setiap Server Action dan Route Handler yang terdaftar, panggilan tanpa sesi dan dengan role salah ditolak (iterasi dari daftar rute); dropdown rekan pengganti tidak kosong untuk setiap user seed yang berhak mengajukan; ketua yang sedang cuti tidak memblokir antrean divisi lain.
- [ ] Perbaiki seed bila ada user demo yang tak bisa mengajukan; tulis checklist demo per role (alur penuh, reject tiap tahap, batal, multi-approve, what-if, PDF, kuota hangus).
- [ ] Jalankan `npm test` penuh dan `npm run build`; commit `chore: pengerasan dan demo`.

---

## Self-Review (hasil)

- **Cakupan spec:** auth/guard (T5), model data (T2), alur persetujuan (T11-12), validasi 10 langkah (T4, T9), lampiran (T9-10), operasi admin (T7-8), lima fitur advanced (T16-19, riwayat T15), UI/komponen/halaman (T6, T10-15), seed (T2, T20), pengujian (tiap task, T20). Tidak ada requirement tanpa task.
- **Perbaikan spec:** definisi kuota diselaraskan dengan flag `potong_kuota` (spec bagian 4 sudah diubah). Keputusan baru yang dicatat plan: pengaju tanpa divisi ditolak (`TANPA_DIVISI`) dan rekan pengganti tanpa kandidat ditolak (`TANPA_REKAN`).
- **Konsistensi tipe:** `Konteks` didefinisikan di Task 4 dan dipakai identik di Task 9 dan 17; `putuskan` di Task 11 dipakai Task 12; `muatKonteks` di Task 9 dipakai Task 17.
- **Review Focus:** kelima baris memiliki tes di task pemilik (T3, T4, T9-12, T20 untuk keamanan lintas rute).
