# SMCK — Sistem Manajemen Cuti Karyawan (PT SSI Cabang Makassar)

Next.js (App Router) + PostgreSQL (`pg`, raw SQL) + Tailwind. Spesifikasi dan rencana ada di `docs/superpowers/`.

## Status
Selesai: Bagian A (fondasi, auth, admin user/divisi/jenis cuti/hari libur), B (pengajuan cuti, lampiran, detail), C (verifikasi Ketua Divisi, persetujuan final HRD), D (dashboard 4 role, profil + foto, riwayat, notifikasi).
Belum: E (kapasitas tim UI, what-if, kuota hangus, surat PDF), F (pengerasan, checklist demo).
Menu Kapasitas Tim dan Kuota Hangus belum punya halaman (404) sampai Bagian E.

## Menjalankan
1. Buat database di pgAdmin bernama `SSI_manajemen_cuti` (kosong).
2. Isi struktur + data contoh: buka Query Tool pada database itu, jalankan file `db/smck_full.sql`, **atau** pakai `npm run db:setup` (langkah 4) yang melakukan hal yang sama.
   Jika memakai pgAdmin, salin `seed/lampiran/*` ke folder `uploads/` (buat foldernya) agar lampiran contoh bisa dibuka.
3. `cp .env.example .env.local`, isi password PostgreSQL, lalu `npm install`.
4. (Opsional) `npm run db:setup` — **menghapus seluruh isi schema `public`** pada `DATABASE_URL` lalu mengisinya ulang. Jangan dijalankan di database berisi data penting.
5. `npm run dev` → http://localhost:3000

## Akun contoh (password semua: `password123`)
Login memakai email atau username: `admin`, `hrd`, `ketua.cpc`, `ketua.cit`, `ketua.flm`, karyawan `ana`, `budi`, `eka`, `hana`, dll.
- `rina` bergabung < 1 tahun (diblokir dari Cuti Tahunan). FLM sudah 2/2 orang cuti pada 18 Nov 2026 (batas kapasitas).

## Tes
`npm test` memakai `DATABASE_URL_TEST` (database kosong terpisah, dikosongkan tiap kali dijalankan) dan berjalan berurutan.
