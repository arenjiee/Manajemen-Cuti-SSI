<div align="center">

# 🏖️ LeaveSync — Sistem Manajemen Cuti Karyawan

**Sistem Informasi Pengajuan & Verifikasi Cuti Berjenjang Berbasis Kapasitas Tim**  
Studi Kasus: **PT Swadharma Sarana Informatika (PT SSI) – Cabang Makassar**

[![Next.js](https://img.shields.io/badge/Next.js-16.4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-244%20Passed-brightgreen?style=for-the-badge&logo=node.js&logoColor=white)](#-pengujian-otomatis)

</div>

---

## 📌 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Hak Akses & Alur Persetujuan](#-hak-akses--alur-persetujuan)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Panduan Instalasi & Menjalankan](#-panduan-instalasi--menjalankan)
  - [1. Clone Repositori](#1-clone-repositori)
  - [2. Install Dependensi](#2-install-dependensi)
  - [3. Buat Database PostgreSQL](#3-buat-database-postgresql)
  - [4. Konfigurasi Environment (.env.local)](#4-konfigurasi-environment-envlocal)
  - [5. Setup Skema & Seed Data Database](#5-setup-skema--seed-data-database)
  - [6. Jalankan Server Pengembangan](#6-jalankan-server-pengembangan)
  - [7. Menjalankan di Mode Produksi (Opsional)](#7-menjalankan-di-mode-produksi-opsional)
- [Akun Demo untuk Pengujian](#-akun-demo-untuk-pengujian)
- [Pengujian Otomatis (Automated Testing)](#-pengujian-otomatis)
- [Struktur Direktori](#-struktur-direktori)
- [Daftar Perintah (NPM Scripts)](#-daftar-perintah-npm-scripts)
- [Panduan Pemecahan Masalah (Troubleshooting)](#-panduan-pemecahan-masalah-troubleshooting)

---

## 🏢 Tentang Proyek

**PT Swadharma Sarana Informatika (PT SSI)** adalah perusahaan Penyelenggara Jasa Pengolahan Uang Rupiah (PJPUR) yang mengelola Cash Processing Center (CPC), distribusi dan pengawalan uang tunai (*Cash in Transit* / CIT), serta pemeliharaan mesin ATM (*First Line Maintenance* / FLM). 

Keberlanjutan operasional PT SSI sangat bergantung pada ketersediaan personel lapangan setiap harinya. Pengelolaan cuti secara manual berbasis kertas memiliki risiko tinggi:
1. Terjadinya kekosongan personel operasional pada tanggal kritis.
2. Pelanggaran batas kapasitas cuti bersamaan dalam satu divisi.
3. Lambatnya alur birokrasi persetujuan antara Ketua Divisi dan HRD.
4. Hilangnya berkas fisik lampiran medis/pendukung.

**LeaveSync** hadir sebagai solusi berbasis web terintegrasi untuk mendigitalkan seluruh siklus hidup cuti karyawan, mengimplementasikan **persetujuan bertingkat**, memvalidasi **kapasitas divisi secara real-time**, menyajikan **simulasi kuota instan**, serta menyediakan **visualisasi analitik data cuti** yang transparan.

---

## ✨ Fitur Utama

### 1. 📝 Alur Pengajuan Cuti Fleksibel & Tervalidasi Ketat
- **Cuti Tahunan & Setengah Hari**: Mendukung cuti penuh maupun setengah hari (0.5 hari) khusus cuti tahunan dengan rentang waktu kerja maksimal 4 jam.
- **Validasi Rekan Pengganti (Handover)**: Pemilihan rekan kerja satu divisi yang tidak sedang berhalangan/cuti pada tanggal yang sama.
- **Catatan Tugas & Kontak Darurat Wajib**: Memastikan delegasi tugas terdokumentasi jelas dan nomor darurat tervalidasi 10–13 digit angka.
- **Cuti Khusus & Lampiran Medis**: Dukungan Cuti Sakit, Cuti Menikah, Cuti Melahirkan, Cuti Duka, hingga Cuti Tanpa Gaji dengan konfigurasi batas pengajuan (H- atau H+) dan kuota dinamis.
- **Upload Lampiran PDF Aman**: Validasi format ketat khusus dokumen PDF (maksimal 2 MB) yang tersimpan aman di basis data dan file storage, dilengkapi pratinjau (*preview modal*) dan unduhan langsung.

### 2. 🛡️ Kontrol Kapasitas Tim (Team Capacity Guard)
- Mencegah kekosongan divisi dengan membatasi persentase maksimal karyawan yang boleh cuti pada hari yang sama (contoh: maks 10% untuk CPC, CIT, dan FLM).
- Pengajuan akan ditolak otomatis oleh sistem jika kuota toleransi divisi terlampaui.

### 3. 📊 Dashboard Analitik & Statistik Pengajuan (SVG Native)
- Dashboard khusus untuk masing-masing dari 4 peran pengguna.
- **Grafik Riwayat Pengajuan 12 Bulan (Dashboard Admin)**: Visualisasi batang bulanan dinamis dengan 5 tab filter (*Semua, Menunggu, Disetujui, Ditolak, Sudah Berlalu*), animasi interaktif, indikator cuti berlalu, serta aksesibilitas ramah pembaca layar (ARIA).

### 4. 🔮 Kalkulator Simulasi Kuota (What-If Analysis)
- Karyawan dapat menguji rentang tanggal dan jenis cuti untuk melihat estimasi sisa kuota, hari libur yang terpotong, serta potensi konflik kapasitas tanpa perlu mengirimkan pengajuan.

### 5. ⏳ Manajemen Kuota Hangus (Quota Expiry Warning)
- Sistem pemantauan otomatis untuk sisa kuota tahunan yang akan hangus di pergantian tahun.
- HRD dan Admin dapat mengirimkan notifikasi pengingat kolektif kepada karyawan yang masih memiliki sisa kuota besar.

### 6. 🔎 Riwayat Interaktif & Pencarian Cepat
- Halaman riwayat terpadu dengan pencarian berbasis debouncing langsung (`CariLangsung`) tanpa reload halaman, serta filter multi-kriteria (Status, Jenis Cuti, Divisi, Tahun).

### 7. 🔔 Notifikasi Real-Time & Umpan Balik Modern
- Notifikasi lonceng in-app untuk pembaruan status persetujuan, permintaan delegasi tugas, dan pengingat kuota.
- Toast melayang otomatis (*floating toast*) untuk umpan balik instan pada pembaruan profil dan foto.

---

## 👥 Hak Akses & Alur Persetujuan

### Matriks Peran Pengguna

| Peran | Tanggung Jawab & Hak Akses Utama |
| :--- | :--- |
| **Admin** | Manajemen pengguna, struktur divisi, master jenis cuti, kalender hari libur nasional, dan grafik statistik operasional. |
| **HRD** | Persetujuan tahap akhir (*Final Approval*), persetujuan massal (*Batch Approval*), monitoring kuota hangus, dan rekapitulasi data perusahaan. |
| **Ketua Divisi** | Verifikasi tahap pertama bagi anggota divisinya, pemantauan kapasitas tim harian, dan pengajuan cuti pribadi (langsung ke HRD). |
| **Karyawan** | Pengajuan cuti berjenjang, simulasi kuota, monitoring status real-time, pembatalan pengajuan mandiri (status *Pending*), dan pembaruan profil. |

### Diagram Alur Persetujuan

```text
[ Karyawan Mengajukan Cuti ]
             │
             ▼
      (Status: Pending)
             │
             ├─────────────────────────────────────────┐
             │ (Verifikasi Tahap 1)                    │ (Ditolak)
             ▼                                         ▼
   [ Disetujui Ketua Divisi ]                [ Ditolak Ketua Divisi ]
   (Status: Approved by Leader)                 (Status: Rejected)
             │
             ├─────────────────────────────────────────┐
             │ (Persetujuan Final)                     │ (Ditolak)
             ▼                                         ▼
     [ Disetujui HRD ]                          [ Ditolak HRD ]
    (Status: Approved)                         (Status: Rejected)
             │
             ▼
[ Kuota Terpotong & Tercatat di Jadwal ]
```

> **Catatan Alur Khusus:**
> - Pengajuan oleh **Ketua Divisi** melewati verifikasi divisi dan langsung masuk ke antrean **HRD**.
> - Pembatalan mandiri oleh pengaju hanya dapat dilakukan saat status masih **Pending**.

---

## 🧰 Teknologi yang Digunakan

- **Frontend & Server Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Server Components & Server Actions)
- **Database**: [PostgreSQL](https://www.postgresql.org/) 14+ via konektor resmi [`pg`](https://node-postgres.com/) (Raw Parameterized SQL, zero-ORM overhead)
- **Styling & Tampilan**: [Tailwind CSS v4](https://tailwindcss.com/) dengan tipografi *Fraunces* dan *Instrument Sans*
- **Autentikasi & Keamanan**: Cookie-based Session via [`jose`](https://github.com/panva/jose) (JWT tersandi HS256) & enkripsi password [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js)
- **Manipulasi PDF**: [`pdf-lib`](https://pdf-lib.js.org/) untuk pengolahan berkas lampiran resmi
- **Ikon & Komponen UI**: [Lucide React](https://lucide.dev/), [HugeIcons](https://hugeicons.com/), [Framer Motion](https://www.framer.com/motion/)
- **Pengujian**: Runner bawaan `node:test` dan `node:assert` (tanpa dependensi berat Jest/Mocha)

---

## 📋 Prasyarat Sistem

Sebelum memulai instalasi, pastikan perangkat Anda telah terpasang perangkat lunak berikut:

1. **Node.js**: Versi **`18.18.0`** atau lebih baru (direkomendasikan Node.js `20.x` LTS atau `22.x`). Periksa dengan:
   ```bash
   node -v
   ```
2. **PostgreSQL Server**: Versi **`14.0`** atau lebih baru, berjalan di port default `5432`. Periksa status layanan database Anda.
3. **Git**: Untuk mengkloning repositori kode sumber.
4. **pgAdmin 4** atau antarmuka baris perintah **psql** (opsional, untuk manajemen visual database).

---

## 🚀 Panduan Instalasi & Menjalankan

Ikuti 7 langkah praktis berikut untuk menjalankan proyek di komputer lokal:

### 1. Clone Repositori

Buka terminal (Git Bash, PowerShell, atau Command Prompt) lalu jalankan:

```bash
git clone https://github.com/arenjiee/Manajemen-Cuti-SSI.git
cd Manajemen-Cuti-SSI
```

### 2. Install Dependensi

Unduh seluruh modul dependensi yang dibutuhkan:

```bash
npm install
```

### 3. Buat Database PostgreSQL

Buat database baru bernama **`SSI_manajemen_cuti`** di server PostgreSQL lokal Anda.

#### Pilihan A: Melalui terminal / psql
```bash
psql -U postgres -c "CREATE DATABASE \"SSI_manajemen_cuti\";"
```

#### Pilihan B: Melalui pgAdmin 4
1. Buka aplikasi **pgAdmin 4** dan masuk ke server lokal Anda.
2. Klik kanan pada folder **Databases** → **Create** → **Database...**.
3. Pada kolom **Database**, ketik: `SSI_manajemen_cuti`.
4. Klik **Save**.

---

### 4. Konfigurasi Environment (`.env.local`)

Salin file contoh konfigurasi `.env.example` menjadi `.env.local`:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local

# Linux / macOS / Git Bash
cp .env.example .env.local
```

Buka file `.env.local` menggunakan editor teks (VS Code, Notepad, dll), lalu sesuaikan nilainya:

```env
# Ganti PASSWORD_POSTGRES_KAMU dengan password pengguna postgres lokal Anda.
# Perhatikan nama database harus sesuai persis: SSI_manajemen_cuti
DATABASE_URL=postgresql://postgres:PASSWORD_POSTGRES_KAMU@localhost:5432/SSI_manajemen_cuti

# Database pengujian terpisah (wajib jika ingin menjalankan npm test)
DATABASE_URL_TEST=postgresql://postgres:PASSWORD_POSTGRES_KAMU@localhost:5432/smck_test

# Kunci rahasia minimal 32 karakter untuk enkripsi & verifikasi cookie sesi JWT
SESSION_SECRET=hasil_generate_secret_acak_di_sini
```

> 💡 **Tips Password Khusus**: Jika password PostgreSQL Anda mengandung karakter unik (seperti `@`, `#`, `:`, `/`), lakukan URL-encoding (contoh: `@` menjadi `%40`).

#### Cara Generate `SESSION_SECRET`
`SESSION_SECRET` digunakan oleh server untuk menandatangani cookie sesi JWT secara aman. Nilai ini harus berupa string acak yang kuat (minimal 32 karakter). Jalankan salah satu perintah berikut di terminal Anda untuk membuatnya:

```bash
# Opsi 1: Menggunakan Node.js (Semua OS: Windows PowerShell / CMD / macOS / Linux)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opsi 2: Menggunakan OpenSSL (Git Bash / Linux / macOS)
openssl rand -base64 32
```

Salin teks keluaran dari terminal, lalu tempelkan sebagai nilai `SESSION_SECRET` di file `.env.local`.

> ⚠️ **Penting**: Jangan bagikan atau commit file `.env.local` ke repositori git publik. Cukup buat secret ini satu kali saat inisialisasi lingkungan lokal.

---

### 5. Setup Skema & Seed Data Database

Cukup jalankan satu perintah otomatis berikut:

```bash
npm run db:setup
```

Skrip ini akan secara otomatis:
1. Menyiapkan skema tabel lengkap beserta *foreign keys*, *triggers*, dan *indexes* (`db/schema.sql`).
2. Memuat **31 akun demo siap pakai** dari 4 divisi operasional (`db/seed_data.sql`).
3. Menyiapkan folder `uploads/` dan menyalin berkas lampiran PDF contoh.
4. Menampilkan ringkasan jumlah akun per role di terminal.

---

### 6. Jalankan Server Pengembangan

Mulai server lokal Next.js:

```bash
npm run dev
```

Buka browser favorit Anda dan kunjungi:
👉 **[http://localhost:3000](http://localhost:3000)**

Halaman login LeaveSync siap digunakan! Silakan masuk menggunakan salah satu akun demo di bawah.

---

### 7. Menjalankan di Mode Produksi (Opsional)

Untuk menguji performa aplikasi pada lingkungan produksi:

```bash
# 1. Kompilasi bundle produksi
npm run build

# 2. Jalankan server produksi
npm start
```

Aplikasi akan aktif di [http://localhost:3000](http://localhost:3000) dengan optimasi penuh.

---

## 🔑 Akun Demo untuk Pengujian

Semua akun demo di bawah ini menggunakan kata sandi yang sama:  
👉 **`password123`**

### Daftar Akun Peran Kunci

| Role | Username | Email | Nama Lengkap / Divisi | Skenario Pengujian |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `andika` | `andika@ssi.co.id` | Andika Pratama *(Administrator)* | Akses grafik 12 bulan, kelola divisi, pengguna, jenis cuti, & hari libur. |
| **HRD** | `anita` | `anita@ssi.co.id` | Anita Rahmawati *(HRD)* | Persetujuan final, multi-approval, kirim pengingat kuota hangus. |
| **Ketua Divisi** | `al.daffa` | `al.daffa@ssi.co.id` | Muh. Al Daffa *(Ketua CPC)* | Verifikasi tahap pertama tim CPC, cek kapasitas tim divisi CPC. |
| **Ketua Divisi** | `rayyan` | `rayyan@ssi.co.id` | Rayyan Al Fatih *(Ketua CIT)* | Verifikasi pengajuan tim CIT (pengawalan kas ATM). |
| **Ketua Divisi** | `rifat` | `rifat@ssi.co.id` | Rifat Hidayat *(Ketua FLM)* | Verifikasi pengajuan tim FLM (teknisi mesin ATM). |
| **Ketua Divisi** | `aidil` | `aidil@ssi.co.id` | Ahmad Aidil Mansur *(Ketua Admin/HRD)* | Mengajukan cuti pribadi yang langsung dialihkan ke HRD. |
| **Karyawan** | `diva` | `diva@ssi.co.id` | Diva Puspita *(Divisi CPC)* | Pengajuan cuti, simulasi kuota, delegasi handover, ganti foto profil. |
| **Karyawan** | `imam` | `imam@ssi.co.id` | Imam Arief Rachmat *(Divisi CPC)* | Karyawan senior dengan saldo kuota besar (uji coba kuota hangus). |
| **Karyawan** | `fauzan` | `fauzan@ssi.co.id` | Fauzan Ahmad *(Divisi CIT)* | Pengajuan cuti setengah hari & pengujian batas kapasitas divisi CIT. |
| **Karyawan** | `siti` | `siti@ssi.co.id` | Siti Nurhaliza *(Divisi FLM)* | Pengajuan cuti khusus (cuti sakit / lampiran berkas PDF). |

*(Tersedia total 31 akun aktif yang tersebar di seluruh divisi).*

---

## 🧪 Pengujian Otomatis

LeaveSync dilengkapi dengan **244 skenario automated testing** yang menguji aturan bisnis kuota, kapasitas divisi, otentikasi role, constraint jam, dan integritas database.

### Menyiapkan Database Pengujian

Buat database pengujian terpisah bernama `smck_test`:
```bash
psql -U postgres -c "CREATE DATABASE smck_test;"
```

### Menjalankan Pengujian

Jalankan rangkaian tes melalui terminal:
```bash
npm test
```

Hasil pengujian akan menampilkan verifikasi seluruh fungsi utilitas, validasi input, hingga transaksi database riil:
```text
ℹ tests 244
ℹ suites 0
ℹ pass 244
ℹ fail 0
ℹ duration_ms ~28000
```

---

## 📂 Struktur Direktori

```text
Manajemen-Cuti-SSI/
├── db/                         # Skema database & data contoh
│   ├── schema.sql              # Definisi tabel, relasi, constraint & indeks
│   └── seed_data.sql           # Data awal 31 akun, divisi, jenis cuti, dll.
├── scripts/                    # Skrip bantu otomatisasi
│   ├── setup-db.mjs            # Inisialisasi cepat skema & seed (npm run db:setup)
│   └── buat-seed.mjs           # Generator data seed relasional
├── seed/                       # Aset berkas lampiran contoh
│   └── lampiran/               # Berkas PDF contoh untuk data seed
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/              # Grup rute terproteksi (memerlukan login)
│   │   │   ├── admin/          # Panel Admin: users, divisi, cuti, hari-libur
│   │   │   ├── cuti/           # Form pengajuan cuti & detail pengajuan
│   │   │   ├── dashboard/      # Dashboard analitik per peran (Admin/HR/Leader/Karyawan)
│   │   │   ├── kapasitas/      # Kalender & kapasitas operasional tim
│   │   │   ├── kuota-hangus/   # Rekap & pengingat kuota cuti kedaluwarsa
│   │   │   ├── notifikasi/     # Pusat notifikasi in-app
│   │   │   ├── persetujuan/    # Modul persetujuan final HRD & batch approval
│   │   │   ├── profil/         # Pengaturan profil & upload foto
│   │   │   ├── riwayat/        # Riwayat cuti dengan filter & live search
│   │   │   └── verifikasi/     # Modul verifikasi awal Ketua Divisi
│   │   ├── (auth)/             # Autentikasi (halaman login)
│   │   └── api/                # Route Handlers (REST API endpoint & unduhan berkas)
│   ├── components/             # Komponen UI reusable (Grafik SVG, Toast, DataTable, dll.)
│   └── lib/                    # Logika bisnis, query database murni, validasi & helper
├── tests/                      # Rangkaian pengujian integrasi database
├── .env.example                # Templat konfigurasi environment
├── package.json                # Daftar dependensi & npm scripts
└── README.md                   # Dokumentasi resmi proyek
```

---

## 📜 Daftar Perintah (NPM Scripts)

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server aplikasi Next.js pada mode pengembangan (*hot-reload* aktif). |
| `npm run build` | Melakukan kompilasi dan optimasi bundle untuk lingkungan produksi. |
| `npm start` | Menjalankan server aplikasi dalam mode produksi setelah proses `build`. |
| `npm run db:setup` | Mereset skema database dan mengisinya dengan 31 akun seed data demo secara instan. |
| `npm test` | Menjalankan 244 unit test dan integration test pada database pengujian. |
| `npm run lint` | Memeriksa kepatuhan gaya penulisan kode melalui ESLint. |

---

## 🛠️ Panduan Pemecahan Masalah (Troubleshooting)

### 1. `ECONNREFUSED 127.0.0.1:5432`
- **Penyebab**: Layanan PostgreSQL belum aktif atau berjalan pada port selain 5432.
- **Solusi**: Buka aplikasi *Services* di Windows, cari `postgresql-x64-XX`, dan klik **Start**. Pastikan port pada `DATABASE_URL` di `.env.local` sesuai.

### 2. `password authentication failed for user "postgres"`
- **Penyebab**: Kata sandi di file `.env.local` tidak cocok dengan kata sandi user PostgreSQL Anda.
- **Solusi**: Buka `.env.local` dan perbarui bagian `PASSWORD_KAMU` dengan kata sandi yang Anda tentukan saat menginstal PostgreSQL.

### 3. Database `SSI_manajemen_cuti` Tidak Ditemukan (`database does not exist`)
- **Penyebab**: Database belum dibuat di PostgreSQL.
- **Solusi**: Buat database kosong terlebih dahulu melalui pgAdmin atau perintah `CREATE DATABASE "SSI_manajemen_cuti";`, lalu ulangi `npm run db:setup`.

### 4. Sesi Login Selalu Terlempar Keluar (*Redirect Loop*)
- **Penyebab**: Nilai `SESSION_SECRET` di `.env.local` kosong atau berubah saat sesi browser masih terbuka.
- **Solusi**: Pastikan `SESSION_SECRET` terisi minimal 32 karakter, hapus cookie browser untuk domain `localhost`, lalu restart server `npm run dev`.

### 5. Port 3000 Sudah Terpakai (`Port 3000 is in use`)
- **Penyebab**: Terdapat instance Next.js atau proses lain yang masih berjalan di port 3000.
- **Solusi**: Matikan proses tersebut di terminal sebelumnya via `Ctrl + C`, atau Next.js akan secara otomatis menyarankan port alternatif seperti `3001`.

---

<div align="center">

**LeaveSync — PT Swadharma Sarana Informatika (Cabang Makassar)**  
Dikembangkan untuk integritas, efisiensi, dan keandalan operasional perbankan.

</div>
