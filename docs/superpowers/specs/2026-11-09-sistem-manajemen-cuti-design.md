# Spec Desain: Sistem Manajemen Cuti Karyawan (SMCK)

Tanggal: 2026-11-09
Konteks: Individual Project 7, dinilai dari `project_description.md`. Skenario: PT SSI Cabang Makassar.
Tenggat: 1 minggu, dikerjakan solo.

## 1. Tujuan dan Ruang Lingkup

Aplikasi web pengajuan, verifikasi, dan persetujuan cuti dengan 4 role: Admin, Karyawan, Ketua Divisi, HRD.

**Dibuat:** seluruh modul inti (6 modul CMS, 6 jenis layout) dan fitur advanced: surat cuti PDF, riwayat semua role, CRUD hari libur/cuti bersama, simulasi kuota (what-if) dengan kalender, peringatan kuota hangus, kapasitas tim.

**Tidak dibuat (keputusan sadar):**
- Blackout Period (diminta pemilik tugas untuk dilewati).
- Pengajuan cuti oleh HRD dan Admin.
- Delegasi/bypass saat Ketua Divisi berhalangan: pengajuan tetap Pending; karyawan dapat membatalkan dan mengajukan ulang.
- Pembatalan setelah status `Approved by Leader` atau `Approved`.
- Carry-over kuota antar tahun, email, deploy ke server produksi.

## 2. Stack dan Dependensi

Next.js (App Router, JavaScript/.jsx), PostgreSQL via `pg` (raw SQL, selalu `$1, $2`), Tailwind CSS.
Tambahan: `bcryptjs` (hash password, tanpa build native), `jose` (JWT session), `pdf-lib` (surat cuti).
Font diunduh ke project (bukan `next/font/google`) agar demo aman offline.
Tanggal diperlakukan sebagai string `YYYY-MM-DD` dan tipe `DATE`; "hari ini" dihitung di zona `Asia/Makassar`.

## 3. Autentikasi dan Otorisasi

- Password di-hash `bcryptjs`. Tidak ada password plaintext (berbeda dari Bab 10).
- Session: JWT (`jose`) di cookie `httpOnly`, `SameSite=Lax`, `Secure` di produksi. Remember Me: dicentang = 30 hari, tidak = cookie sesi.
- JWT hanya berisi `userId`. **Role, status aktif, dan `deleted_at` dibaca dari DB pada setiap request** lewat `guard.js`, sehingga perubahan role atau penonaktifan akun langsung berlaku.
- `guard.js` (`requireRole([...])`) dipanggil di **setiap** Server Action, Route Handler, dan halaman. Menyembunyikan menu bukan otorisasi.
- Pesan login gagal generik ("email/username atau password salah").
- Route Handler POST (login, upload, what-if) memeriksa header `Origin`. Server Actions memakai pemeriksaan bawaan Next.js.
- Lapisan redirect awal lewat proxy/middleware sesuai versi Next yang terpasang (diverifikasi saat scaffold), hanya sebagai kenyamanan, bukan batas keamanan.

## 4. Model Data

Semua tabel ber-PK `id SERIAL`. Soft delete lewat `deleted_at`.

**users**: username, email, password_hash, nama_lengkap, telepon, alamat, foto_key (nullable), role (`admin|karyawan|ketua_divisi|hrd`), divisi_id (FK, nullable), tanggal_bergabung, kuota_awal `NUMERIC(4,1)` default 12, aktif, deleted_at, created_at. Unique index parsial pada email dan username `WHERE deleted_at IS NULL`.

**divisi**: nama (unique parsial), deskripsi, ketua_id (FK users, unique parsial), max_persen_cuti (int, default 10), created_at, deleted_at.

**jenis_cuti**: nama, kode (`tahunan|sakit|NULL`), is_system, kuota_hari (`NUMERIC`, NULL = tak terbatas, per tahun per user), batas_pengajuan_hari (int; positif = minimal H-n, negatif = boleh mundur n hari), wajib_lampiran, potong_kuota (memotong kuota tahunan), aktif. Tahunan dan Sakit adalah baris sistem (tidak bisa dihapus); jenis lain dibuat admin.

**pengajuan_cuti**: pengaju_id, divisi_id (snapshot saat submit), jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari `NUMERIC(4,1)`, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat, status (`Pending|Approved by Leader|Approved|Rejected|Cancelled`), tahap (`leader|hrd`), ditolak_oleh (`leader|hrd|NULL`), alasan_batal, created_at. CHECK: selesai >= mulai; setengah_hari hanya jika mulai = selesai.

**persetujuan**: pengajuan_id, tahap, approver_id, keputusan (`approve|reject`), catatan, created_at (sumber timeline).

**lampiran**: pengajuan_id, nama_asli, mime, ukuran, storage_key, created_at.

**hari_libur**: tanggal (unique), keterangan, jenis (`nasional|cuti_bersama`).

**notifications**: user_id, tipe, pesan, link, dibaca, created_at.

**pengaturan**: key, value (ambang kuota hangus, bulan mulai peringatan).

Pengajuan "aktif" = status `Pending`, `Approved by Leader`, atau `Approved`. Definisi ini dipakai seragam untuk kuota, overlap, kapasitas, dan rekan pengganti.

**Sisa kuota tahunan dihitung, tidak disimpan:** `kuota_awal - SUM(total_hari)` dari pengajuan aktif pada tahun berjalan yang jenis cutinya ber-flag `potong_kuota` (Tahunan selalu ber-flag; jenis lain sesuai konfigurasi admin). Jenis ber-`kuota_hari` juga dibatasi total pemakaiannya per tahun. Pembatalan dan penolakan otomatis mengembalikan kuota. Tahun kalender, tanpa carry-over.

## 5. Struktur Kode

```text
src/
├── app/
│   ├── (auth)/login/
│   ├── (app)/                       # layout ber-sidebar, wajib login
│   │   ├── dashboard/  profil/  riwayat/  cuti/ (ajukan, [id])
│   │   ├── verifikasi/              # Ketua Divisi
│   │   ├── persetujuan/             # HRD
│   │   ├── kuota-hangus/  kapasitas/ # HRD/Admin
│   │   └── admin/ (users, divisi, jenis-cuti, hari-libur)
│   └── api/ (lampiran/[id], surat/[id], whatif, login, logout)
├── lib/
│   ├── db.js  session.js  guard.js
│   ├── leave/  hitung-hari.js kuota.js overlap.js kapasitas.js rekan.js validasi.js
│   └── queries/                     # seluruh SQL di satu tempat
└── components/
uploads/        # di luar public/, masuk .gitignore
seed/           # SQL + file contoh lampiran
```

Logika di `lib/leave/` ditulis sebagai fungsi murni/terisolasi dan dipakai bersama oleh submit, approval, what-if, dan dashboard. Filter `deleted_at IS NULL` diisolasi di satu helper query.

## 6. Alur Persetujuan

| Pengaju | Submit | Leader setuju | HRD |
| :--- | :--- | :--- | :--- |
| Karyawan | `Pending`, tahap `leader` | `Approved by Leader`, tahap `hrd` | `Approved` / `Rejected` |
| Ketua Divisi | `Pending`, tahap `hrd` | (dilewati) | `Approved` / `Rejected` |

- Leader menolak: `Rejected`, `ditolak_oleh = leader`. Pengaju membatalkan (hanya `Pending`, alasan wajib): `Cancelled`.
- Setiap transisi memakai kondisi di SQL (`UPDATE ... WHERE id=$1 AND status=... AND tahap=...`) dan memeriksa jumlah baris berubah, untuk mencegah double-approve atau approve atas pengajuan yang baru dibatalkan.
- Antrean leader difilter dengan `pengajuan.divisi_id = divisi yang dipimpin`, jadi pergantian ketua atau pemindahan anggota tidak membuat pengajuan yatim. Leader tidak dapat memproses pengajuan miliknya sendiri.
- Setiap keputusan menulis baris `persetujuan` dan notifikasi ke pengaju. Submit memberi notifikasi ke rekan pengganti dan approver tahap pertama.
- Multi-approve HRD: satu transaksi per item; item gagal dilewati dan dilaporkan; reject tidak mendukung multi.

## 7. Validasi Submit (server, satu transaksi)

Transaksi mengunci baris divisi (`SELECT ... FOR UPDATE`) sebelum cek kuota dan kapasitas agar dua submit bersamaan tidak sama-sama lolos.

1. Guard: role Karyawan atau Ketua Divisi.
2. Bentuk data: field wajib, selesai >= mulai, setengah hari hanya jika mulai = selesai.
3. Aturan jenis cuti (dari `jenis_cuti`):
   - Tahunan: masa kerja >= 1 tahun; mulai >= hari ini + 3 hari kalender.
   - Sakit: boleh mundur maksimal 3 hari; lampiran wajib; tidak memotong kuota.
   - Lainnya: batas pengajuan, lampiran, dan kuota per tahun mengikuti konfigurasi admin.
4. Hari kerja: buang Sabtu, Minggu, dan `hari_libur`. Hasil 0 ditolak.
5. Rentang lintas tahun ditolak hanya untuk jenis yang memotong kuota atau punya kuota per tahun. Sakit dan jenis tanpa kuota boleh melintasi tahun.
6. Overlap dengan pengajuan aktif milik sendiri.
7. Kuota mencukupi (jenis yang memotong kuota/berkuota).
8. Rekan pengganti: aktif, tidak terhapus, satu divisi, bukan diri sendiri, tidak punya pengajuan aktif yang tumpang-tindih.
9. Kapasitas divisi: untuk setiap hari kerja dalam rentang, `(orang berbeda yang cuti aktif pada hari itu + 1) <= max(1, floor(max_persen_cuti * jumlah anggota aktif))`. Cuti setengah hari dihitung satu orang. **Cuti Sakit tidak diblokir kapasitas** namun tetap dihitung bagi pengajuan lain.
10. Lampiran: PDF/JPG/PNG, maksimal 2 MB, nama file diacak.

Gagal pada langkah mana pun: form menampilkan pesan spesifik (misal "FLM penuh tanggal 12 (2/2)") dan tidak ada record dibuat.

## 8. Lampiran (Surat Dokter)

- Disimpan di `uploads/` (di luar `public/`), dilayani hanya lewat `GET /api/lampiran/[id]` yang memeriksa session dan role: pemilik, Ketua Divisi terkait (lewat `pengajuan.divisi_id`), HRD, Admin.
- Upload lewat Route Handler dengan `FormData` (menghindari batas 1 MB Server Action).
- Konsekuensi: `uploads/` tidak ikut repo. Script seed menyalin file contoh dari `seed/` ke `uploads/`.
- Foto profil memakai mekanisme yang sama; default avatar inisial bila kosong.

## 9. Operasi Admin

- **Hapus user (soft):** hanya Karyawan dan Ketua Divisi. Ditolak jika user masih memimpin divisi (ganti ketua dulu) atau punya pengajuan berstatus `Pending` atau `Approved by Leader` (yang sudah `Approved` tidak menghalangi). User terhapus tidak bisa login dan hilang dari semua daftar; riwayatnya tetap.
- **Hapus divisi (soft):** konfirmasi dua kali; anggota (dan ketua) kehilangan `divisi_id`. Ditolak jika ada pengajuan `Pending` tahap `leader` di divisi itu.
- **Validasi divisi:** nama unik; ketua wajib, role `ketua_divisi`, belum memimpin divisi lain.
- **Jenis cuti:** CRUD; baris sistem hanya dapat diubah aturannya, tidak dihapus.

## 10. Fitur Advanced

1. **What-if:** `POST /api/whatif` (debounce) memakai fungsi `lib/leave/` yang sama dengan submit. Mengembalikan hari kerja, sisa kuota sebelum/sesudah, status kapasitas per tanggal, dan penanda kalender (hari libur, cuti sendiri, rekan satu divisi). Hanya saran; server tetap memutuskan.
2. **Kapasitas tim:** HRD/Admin mengatur persentase per divisi. Peringatan di form dan di halaman Persetujuan Final HRD (saat approval dihitung ulang; berupa peringatan, HRD tetap berwenang memutuskan).
3. **Kuota hangus:** daftar karyawan dengan sisa kuota di atas ambang menjelang akhir tahun + tombol "Ingatkan" (menulis `notifications`). Ambang dan bulan mulai disimpan di `pengaturan`.
4. **Hari libur:** CRUD admin; dipakai hitung hari kerja dan kalender.
5. **Riwayat:** satu halaman, cakupan per role (karyawan: miliknya; Ketua Divisi: divisinya; HRD/Admin: semua).
6. **Surat cuti PDF:** `GET /api/surat/[id]` dengan `pdf-lib`, template satu halaman; hanya status `Approved` dan hanya untuk pengaju (Karyawan atau Ketua Divisi).

## 11. UI

- **Arah visual:** tenang dan tepercaya. Latar krem-abu hangat (bukan putih/hitam murni), satu aksen biru tinta, warna status hanya untuk status. Fraunces (display/angka kuota) + Instrument Sans (isi), ukuran fluid `clamp()`. Token (warna `oklch`, spasi, radius, easing) di CSS variables. Status selalu teks + warna.
- **Gerak:** hanya transisi 150-250 ms; `prefers-reduced-motion` dihormati; tanpa animasi scroll/3D.
- **Responsif:** sidebar menjadi drawer; tabel menjadi kartu di layar kecil.
- **Komponen bersama:** `AppShell`, `StatCard`, `DataTable` + `FilterBar` (filter/sortir lewat `searchParams`, render server), `StatusBadge`, `Modal`, `Timeline`, `RangeCalendar`.
- **Halaman:** Login (Remember Me); Dashboard 4 varian; Profil (edit sendiri, Admin edit semua, kuota realtime); Form pengajuan (kolom kiri field, kolom kanan panel what-if); Verifikasi (kartu + modal, catatan wajib saat reject); Persetujuan Final HRD (kartu, multi-approve, info atasan, peringatan kapasitas); Detail cuti (rincian, timeline, handover, pratinjau lampiran, unduh surat); Admin (user, divisi + anggota, jenis cuti, hari libur).

## 12. Data Seed untuk Demo

Divisi CPC, CIT, FLM (FLM dengan batas kapasitas sehingga satu tanggal sudah penuh); minimal satu user per role; satu karyawan masa kerja < 1 tahun (menguji blokir Tahunan); satu karyawan dengan sisa kuota hampir hangus; pengajuan di setiap status; satu Cuti Sakit dengan lampiran; hari libur nasional dan cuti bersama 2026; satu Ketua Divisi yang sedang cuti. Divisi kecil tidak boleh membuat dropdown rekan pengganti kosong saat demo.

## 13. Pengujian

- Fungsi `lib/leave/` diuji dengan `node:test` (tanpa dependensi baru): hari kerja dengan libur, setengah hari, kuota desimal, overlap, kapasitas dengan floor/minimum 1, rentang lintas tahun, rekan pengganti.
- Pemeriksaan manual per role mengikuti alur: submit -> leader -> HRD, reject di tiap tahap, cancel, multi-approve, akses terlarang antar role (URL langsung, file lampiran orang lain), serta dua submit bersamaan untuk slot kapasitas terakhir.

## 14. Urutan Pengerjaan (vertical slice, 7 hari)

1. Hari 1-2: skema DB, seed, auth/guard, CRUD user dan divisi minimal, komponen bersama.
2. Hari 2-4: jenis cuti, hari libur, `lib/leave/`, form pengajuan + validasi, approval Ketua Divisi dan HRD. Pada akhir hari ke-4 alur inti dapat didemokan.
3. Hari 4-5: dashboard 4 role, profil, riwayat, detail cuti.
4. Hari 5-7: advanced berurutan: kapasitas tim, what-if, kuota hangus, PDF. Jika waktu habis, yang dipotong adalah PDF dan kerapian visual, bukan alur inti.

## 15. Risiko dan Batasan Tercatat

- Kebenaran agregasi kuota/kapasitas menentukan semua validasi; mitigasi lewat fungsi terisolasi dan uji.
- Penyimpanan lampiran di filesystem tidak cocok untuk deploy serverless; cukup untuk demo lokal/VPS.
- Peringatan kapasitas di halaman HRD bersifat peringatan (sesuai deskripsi), sehingga HRD secara teknis dapat menyetujui di atas batas.
- Pengajuan menunggu tanpa batas waktu bila Ketua Divisi berhalangan.
