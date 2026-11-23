# LeaveSync — Sistem Manajemen Cuti Karyawan (PT SSI Cabang Makassar)

Next.js (App Router) + PostgreSQL (`pg`, raw SQL) + Tailwind. Spesifikasi dan rencana ada di `docs/superpowers/`.

## Status
Selesai: Bagian A (fondasi, auth, admin user/divisi/jenis cuti/hari libur), B (pengajuan cuti, lampiran, detail), C (verifikasi Ketua Divisi, persetujuan final HRD), D (dashboard 4 role, profil + foto, riwayat, notifikasi), E (kapasitas tim, simulasi pengajuan, kuota hangus, surat PDF).
Belum: F (pengerasan, checklist demo).

## Menjalankan
1. Buat database di pgAdmin bernama `SSI_manajemen_cuti` (kosong).
2. Isi struktur + data contoh. Pilihan termudah: buka Query Tool pada database itu, jalankan `db/schema.sql`, lalu jalankan `db/seed_data.sql`.
   Alternatif: pakai `npm run db:setup` (langkah 4) yang melakukan hal yang sama.
   Foto dan lampiran kini disimpan langsung di database (`file_storage`).
3. `cp .env.example .env.local`, isi password PostgreSQL, lalu `npm install`.
4. (Opsional) `npm run db:setup` — **menghapus seluruh isi schema `public`** pada `DATABASE_URL` lalu mengisinya ulang. Jangan dijalankan di database berisi data penting.
5. `npm run dev` → http://localhost:3000

## Akun contoh (password semua: `password123`)
Login memakai username atau email (`<username>@ssi.co.id`). Data ini berasal dari `db/seed_data.sql`.

| Username | Nama | Role | Divisi |
| --- | --- | --- | --- |
| `nabila` | Nabila Roidah | admin | — |
| `siti.rabiatul` | Siti Rabiatul Adawiyah | hrd | — |
| `al.daffa` | Al Daffa A'Aren | ketua_divisi | CPC |
| `m.syahdan` | Muhammad Syahdan | ketua_divisi | CIT |
| `m.rifat` | Muhammad Rifat Kasman | ketua_divisi | FLM |
| `a.faqiih` | Andi Faqiih Ahmad Dzaky | ketua_divisi | OPS |
| `eriqz` | Eriqz Affanditya Nursin | karyawan | CPC |
| `diva` | Diva Puspita | karyawan | CPC |
| `imam` | Imam Arif Rahmat | karyawan | CPC |
| `afdhol` | Afdhol As Syamardi | karyawan | CPC |
| `tifli` | Achmad Tifli | karyawan | CIT |
| `karis` | Karis Kabanga | karyawan | CIT |
| `mawaddah` | Mawaddah Fajri Lahamuddin | karyawan | CIT |
| `naufal` | Muhammad Naufal Alim | karyawan | CIT |
| `mukhsin` | Mukhsin | karyawan | FLM |
| `alif` | Muh Alif Syamsir | karyawan | FLM |
| `faiz` | Muh Faiz Ilyas | karyawan | FLM |
| `talista` | Andi Talista Anindya | karyawan | FLM |
| `aqila` | Aqila | karyawan | OPS |
| `syarief` | Syarief Rahmatullah | karyawan | OPS |

- `aqila` bergabung 1 Juni 2026 (< 1 tahun) sehingga diblokir dari Cuti Tahunan dan tampil di daftar masa kerja di bawah 1 tahun.
- Data seed memuat 19 pengajuan dengan semua status (Pending, Approved by Leader, Approved, Rejected, Cancelled), cuti setengah hari, Cuti Sakit + lampiran, notifikasi, dan pengingat kuota hangus.

## Tes
`npm test` memakai `DATABASE_URL_TEST` (database kosong terpisah, dikosongkan tiap kali dijalankan) dan berjalan berurutan.
