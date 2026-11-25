<div align="center">

# 🏖️ SMCK — Sistem Manajemen Cuti Karyawan

**Digitalisasi pengajuan cuti berjenjang dengan validasi kapasitas tim & blackout period.**
Dibangun untuk **PT Swadharma Sarana Informatika (PT SSI) – Cabang Makassar**.

![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-JSX-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Raw_SQL_(pg)-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## 📖 Tentang Proyek

PT SSI adalah Perusahaan Penyelenggara Jasa Pengolahan Uang Rupiah (PJPUR) yang mengelola CPC, distribusi kas, dan mesin ATM. Operasionalnya bergantung pada ketersediaan personel setiap hari, sehingga cuti yang dikelola manual berisiko membuat tim CIT, FLM, atau Replenishment kekurangan orang.

**SMCK** menggantikan proses cuti berbasis kertas dengan sistem web terpusat yang:

- ✅ Menjalankan **alur persetujuan berjenjang** otomatis (Karyawan → Ketua Divisi → HRD)
- ✅ **Menolak pengajuan otomatis** jika kapasitas cuti divisi terlampaui
- ✅ **Memblokir cuti** pada *blackout period* (Idul Fitri, Tahun Baru, periode gajian)
- ✅ Mewajibkan **rekan pengganti (handover)** di setiap pengajuan
- ✅ Menampilkan **sisa kuota real-time** untuk karyawan

## 🔄 Alur Persetujuan

```text
Karyawan       : Pending → Approved by Leader → Approved / Rejected by HRD
Ketua Divisi   : Pending → Approved / Rejected by HRD   (langsung ke HRD)
```

## 👥 Role Pengguna

| Role | Hak Akses Utama |
| :--- | :--- |
| **Admin** | Kelola user, divisi, anggota divisi, jenis cuti dinamis, dan konfigurasi sistem |
| **Karyawan** | Ajukan cuti, lihat sisa kuota, batalkan pengajuan yang masih `Pending` |
| **Ketua Divisi** | Verifikasi tahap pertama, lihat catatan handover, ajukan cuti pribadi ke HRD |
| **HRD** | Persetujuan final, lihat seluruh pengajuan, *multi-approve* |

## 🗂️ Jenis Cuti

| Jenis | Aturan |
| :--- | :--- |
| **Cuti Tahunan** | 12 hari kerja/tahun (tanpa Sabtu-Minggu), minimal H-3, kuota dikembalikan jika dibatalkan/ditolak |
| **Cuti Sakit** | Wajib surat dokter, boleh diajukan H-0 s.d. maksimal 3 hari setelah mulai sakit, tidak memotong kuota tahunan |
| **Cuti Lainnya** | Dinamis, disimpan di database dan dikonfigurasi Admin (kuota, lampiran, batas pengajuan, pemotongan kuota) |

## 🧰 Tech Stack

| Layer | Teknologi |
| :--- | :--- |
| Framework | Next.js (App Router, Server Components, Server Actions, Route Handlers) |
| Database | PostgreSQL via library `pg` (Raw SQL, parameterized query) |
| Styling | Tailwind CSS |
| Auth | Session berbasis cookie + Role-Based Access Control (RBAC) |

---

## 🚀 Menjalankan Project

### Prasyarat

- [Node.js](https://nodejs.org/) 18.18 atau lebih baru
- [PostgreSQL](https://www.postgresql.org/) 14+ (beserta pgAdmin atau `psql`)
- Git

### 1. Clone & Install

```bash
git clone <URL_REPOSITORY_KAMU>
cd <NAMA_FOLDER_PROJECT>
npm install
```

### 2. Buat Database

Lewat pgAdmin (klik kanan *Databases* → *Create* → *Database*) atau lewat terminal:

```bash
psql -U postgres -c "CREATE DATABASE smck;"
```

### 3. Jalankan Schema

Simpan SQL di bagian **[Schema Database](#-schema-database)** ke `db/schema.sql`, lalu:

```bash
psql -U postgres -d smck -f db/schema.sql
```

> Alternatif: buka **Query Tool** di pgAdmin pada database `smck`, tempel isi file, lalu jalankan.

### 4. Jalankan Seed

Simpan SQL di bagian **[Seed Data](#-seed-data)** ke `db/seed.sql`, lalu:

```bash
psql -U postgres -d smck -f db/seed.sql
```

### 5. Siapkan Environment

```bash
cp .env.example .env.local
```

Isi `.env.local` (contoh ada di **[Environment Variables](#-environment-variables)**).

### 6. Generate `SESSION_SECRET`

`SESSION_SECRET` dipakai untuk menandatangani/mengenkripsi cookie sesi. Buat nilai acak yang kuat (minimal 32 karakter). Pilih salah satu:

```bash
# Opsi A: OpenSSL (macOS / Linux / Git Bash)
openssl rand -base64 32

# Opsi B: Node.js (semua OS, termasuk Windows PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Salin hasilnya ke `.env.local`:

```env
SESSION_SECRET=hasil_generate_di_sini
```

> ⚠️ Jangan pernah commit secret ke Git. Gunakan secret **berbeda** untuk development dan production. Jika secret diganti, semua sesi login yang aktif otomatis tidak valid.

### 7. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) 🎉

> Setiap kali `.env.local` diubah, hentikan server (`Ctrl+C`) lalu jalankan ulang `npm run dev`.

---

## 🔐 Environment Variables

Buat file `.env.example` di root project (sejajar `package.json`):

```env
# Koneksi PostgreSQL
# Jika password mengandung karakter khusus, encode dulu (contoh: @ menjadi %40)
DATABASE_URL=postgresql://postgres:PASSWORD_KAMU@localhost:5432/smck

# Secret untuk sesi/cookie. Generate dengan: openssl rand -base64 32
SESSION_SECRET=ganti_dengan_secret_acak_minimal_32_karakter

# Folder penyimpanan lampiran (surat dokter, dll)
UPLOAD_DIR=./uploads
```

Pastikan `.gitignore` memuat:

```gitignore
.env.local
.env*.local
uploads/
```

---

## 🗄️ Schema Database

<details>
<summary><b>📄 db/schema.sql</b> (klik untuk membuka)</summary>

```sql
-- Reset (hati-hati: menghapus seluruh data)
DROP TABLE IF EXISTS pengajuan_cuti, blackout_period, hari_libur,
                     jenis_cuti, users, divisi CASCADE;

CREATE TABLE divisi (
    id                SERIAL PRIMARY KEY,
    nama              VARCHAR(100) UNIQUE NOT NULL,
    deskripsi         TEXT,
    ketua_id          INTEGER,                         -- FK ditambahkan setelah tabel users ada
    maks_cuti_persen  INTEGER NOT NULL DEFAULT 10      -- batas kapasitas cuti bersamaan (%)
                      CHECK (maks_cuti_persen BETWEEN 0 AND 100),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id                SERIAL PRIMARY KEY,
    username          VARCHAR(50)  UNIQUE NOT NULL,
    email             VARCHAR(100) UNIQUE NOT NULL,
    password          VARCHAR(100) NOT NULL,           -- hash bcrypt, bukan plaintext
    nama_lengkap      VARCHAR(100) NOT NULL,
    role              VARCHAR(20)  NOT NULL DEFAULT 'karyawan'
                      CHECK (role IN ('admin', 'karyawan', 'ketua_divisi', 'hrd')),
    divisi_id         INTEGER REFERENCES divisi(id) ON DELETE SET NULL,
    kuota_cuti        NUMERIC(4,1) NOT NULL DEFAULT 12,  -- mendukung 0.5 hari
    tanggal_bergabung DATE NOT NULL DEFAULT CURRENT_DATE,
    telepon           VARCHAR(20),
    alamat            TEXT,
    foto              VARCHAR(255),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE divisi
    ADD CONSTRAINT fk_divisi_ketua
    FOREIGN KEY (ketua_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE jenis_cuti (
    id                  SERIAL PRIMARY KEY,
    nama                VARCHAR(100) UNIQUE NOT NULL,
    kuota_per_tahun     INTEGER,                        -- NULL = tidak dibatasi
    wajib_lampiran      BOOLEAN NOT NULL DEFAULT FALSE,
    potong_kuota_tahunan BOOLEAN NOT NULL DEFAULT FALSE,
    min_hari_sebelum    INTEGER NOT NULL DEFAULT 0,     -- H-n sebelum tanggal mulai
    maks_hari_sesudah   INTEGER NOT NULL DEFAULT 0,     -- boleh diajukan n hari setelah mulai (cuti sakit)
    is_active           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE pengajuan_cuti (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jenis_cuti_id     INTEGER NOT NULL REFERENCES jenis_cuti(id),
    tanggal_pengajuan DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_mulai     DATE NOT NULL,
    tanggal_selesai   DATE NOT NULL,
    setengah_hari     BOOLEAN NOT NULL DEFAULT FALSE,
    total_hari        NUMERIC(4,1) NOT NULL,
    alasan            TEXT NOT NULL,
    handover_user_id  INTEGER NOT NULL REFERENCES users(id),
    catatan_tugas     TEXT,
    lampiran          VARCHAR(255),
    alamat_selama_cuti VARCHAR(255),
    nomor_darurat     VARCHAR(20),
    status            VARCHAR(30) NOT NULL DEFAULT 'Pending'
                      CHECK (status IN ('Pending', 'Approved by Leader',
                                        'Approved', 'Rejected', 'Cancelled')),
    leader_id         INTEGER REFERENCES users(id),
    leader_catatan    TEXT,
    leader_at         TIMESTAMP,
    hrd_id            INTEGER REFERENCES users(id),
    hrd_catatan       TEXT,
    hrd_at            TIMESTAMP,
    alasan_batal      TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (tanggal_selesai >= tanggal_mulai)
);

CREATE TABLE hari_libur (
    id          SERIAL PRIMARY KEY,
    tanggal     DATE UNIQUE NOT NULL,
    keterangan  VARCHAR(150) NOT NULL,
    cuti_bersama BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE blackout_period (
    id          SERIAL PRIMARY KEY,
    nama        VARCHAR(150) NOT NULL,
    tanggal_mulai   DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    keterangan  TEXT,
    CHECK (tanggal_selesai >= tanggal_mulai)
);

CREATE INDEX idx_pengajuan_user   ON pengajuan_cuti(user_id);
CREATE INDEX idx_pengajuan_status ON pengajuan_cuti(status);
CREATE INDEX idx_pengajuan_tanggal ON pengajuan_cuti(tanggal_mulai, tanggal_selesai);
CREATE INDEX idx_users_divisi     ON users(divisi_id);
```

</details>

## 🌱 Seed Data

<details>
<summary><b>📄 db/seed.sql</b> (klik untuk membuka)</summary>

Seed memakai ekstensi `pgcrypto` agar password tersimpan sebagai **hash bcrypt** (bukan plaintext). Semua akun demo memakai password `Password123!`.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Divisi (ketua diisi setelah user dibuat)
INSERT INTO divisi (nama, deskripsi, maks_cuti_persen) VALUES
('CPC',          'Cash Processing Center: penyortiran & penghitungan uang', 10),
('CIT',          'Cash in Transit: pengawalan & pengiriman uang',           10),
('FLM',          'First Line Maintenance: perbaikan ringan & pengisian kaset ATM', 10),
('Admin & HRD',  'Manajemen operasional kantor',                            20);

-- Users (password: Password123!)
INSERT INTO users (username, email, password, nama_lengkap, role, divisi_id, tanggal_bergabung) VALUES
('admin',     'admin@ssi.test',     crypt('Password123!', gen_salt('bf')), 'Administrator Sistem', 'admin',        4, '2020-01-10'),
('hrd',       'hrd@ssi.test',       crypt('Password123!', gen_salt('bf')), 'Rina HRD',             'hrd',          4, '2020-03-01'),
('kadiv.cpc', 'kadiv.cpc@ssi.test', crypt('Password123!', gen_salt('bf')), 'Budi Ketua CPC',       'ketua_divisi', 1, '2019-05-15'),
('kadiv.cit', 'kadiv.cit@ssi.test', crypt('Password123!', gen_salt('bf')), 'Andi Ketua CIT',       'ketua_divisi', 2, '2019-06-20'),
('kadiv.flm', 'kadiv.flm@ssi.test', crypt('Password123!', gen_salt('bf')), 'Sari Ketua FLM',       'ketua_divisi', 3, '2019-08-01'),
('karyawan1', 'karyawan1@ssi.test', crypt('Password123!', gen_salt('bf')), 'Ahmad CPC',            'karyawan',     1, '2022-02-01'),
('karyawan2', 'karyawan2@ssi.test', crypt('Password123!', gen_salt('bf')), 'Dewi CPC',             'karyawan',     1, '2023-04-10'),
('karyawan3', 'karyawan3@ssi.test', crypt('Password123!', gen_salt('bf')), 'Rudi CIT',             'karyawan',     2, '2021-09-05'),
('karyawan4', 'karyawan4@ssi.test', crypt('Password123!', gen_salt('bf')), 'Fajar FLM',            'karyawan',     3, '2022-11-12'),
('karyawan5', 'karyawan5@ssi.test', crypt('Password123!', gen_salt('bf')), 'Lina FLM',             'karyawan',     3, '2026-06-01');  -- masa kerja < 1 tahun

-- Tetapkan ketua divisi
UPDATE divisi SET ketua_id = (SELECT id FROM users WHERE username = 'kadiv.cpc') WHERE nama = 'CPC';
UPDATE divisi SET ketua_id = (SELECT id FROM users WHERE username = 'kadiv.cit') WHERE nama = 'CIT';
UPDATE divisi SET ketua_id = (SELECT id FROM users WHERE username = 'kadiv.flm') WHERE nama = 'FLM';
UPDATE divisi SET ketua_id = (SELECT id FROM users WHERE username = 'hrd')       WHERE nama = 'Admin & HRD';

-- Jenis cuti
INSERT INTO jenis_cuti (nama, kuota_per_tahun, wajib_lampiran, potong_kuota_tahunan, min_hari_sebelum, maks_hari_sesudah) VALUES
('Cuti Tahunan',  12,   FALSE, TRUE,  3, 0),
('Cuti Sakit',    NULL, TRUE,  FALSE, 0, 3),
('Cuti Menikah',  3,    TRUE,  FALSE, 7, 0),
('Cuti Melahirkan', 90, TRUE,  FALSE, 14, 0),
('Cuti Duka',     3,    FALSE, FALSE, 0, 2),
('Cuti Tanpa Gaji', NULL, FALSE, FALSE, 7, 0);

-- Contoh blackout period (SESUAIKAN dengan kesepakatan manajemen PT SSI)
INSERT INTO blackout_period (nama, tanggal_mulai, tanggal_selesai, keterangan) VALUES
('Tahun Baru 2027', '2026-12-24', '2027-01-07', 'Lonjakan penarikan uang ATM'),
('Tutup Buku Akhir Tahun', '2026-12-28', '2026-12-31', 'Tutup buku');

-- Contoh hari libur (verifikasi ulang dengan SKB resmi)
INSERT INTO hari_libur (tanggal, keterangan, cuti_bersama) VALUES
('2026-12-25', 'Hari Raya Natal', FALSE),
('2027-01-01', 'Tahun Baru Masehi', FALSE);
```

</details>

### 👤 Akun Demo

Semua akun memakai password **`Password123!`**

| Role | Username | Email |
| :--- | :--- | :--- |
| Admin | `admin` | admin@ssi.test |
| HRD | `hrd` | hrd@ssi.test |
| Ketua Divisi (CPC) | `kadiv.cpc` | kadiv.cpc@ssi.test |
| Karyawan (CPC) | `karyawan1` | karyawan1@ssi.test |

> ⚠️ Akun demo **hanya untuk development**. Hapus/ganti sebelum deployment ke server PT SSI.

---

## 📁 Struktur Folder

> Sesuaikan dengan struktur aktual project kamu.

```text
.
├── db/
│   ├── schema.sql
│   └── seed.sql
├── src/
│   ├── app/
│   │   ├── api/                # Route Handlers (login, logout, dll)
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── pengajuan/          # Form & riwayat cuti
│   │   ├── verifikasi/         # Ketua Divisi
│   │   ├── persetujuan/        # HRD (final approval)
│   │   └── admin/              # User, divisi, jenis cuti, blackout
│   ├── components/
│   └── lib/
│       ├── db.js               # Koneksi PostgreSQL (Pool)
│       └── session.js          # Helper sesi & cek role
├── .env.example
└── package.json
```

## 🛡️ Aturan Bisnis Utama

1. **Kuota cukup**: total hari tidak boleh melebihi sisa kuota (untuk jenis yang memotong kuota).
2. **Tidak overlap** dengan cuti lain yang sudah disetujui.
3. **Kapasitas divisi**: pengajuan ditolak jika jumlah anggota yang cuti pada tanggal yang sama melampaui `maks_cuti_persen` divisi.
4. **Blackout period**: cuti tahunan tidak dapat diajukan pada rentang tanggal blackout.
5. **Handover wajib**: rekan pengganti harus dipilih dan tidak sedang cuti pada periode yang sama.
6. **Pembatalan** hanya untuk status `Pending`, wajib alasan, dan kuota dikembalikan otomatis.
7. **Reject** (Ketua Divisi/HRD) wajib menyertakan catatan.

## 🧯 Troubleshooting

| Masalah | Solusi |
| :--- | :--- |
| `ECONNREFUSED` | Pastikan service PostgreSQL aktif dan port di `DATABASE_URL` benar |
| `password authentication failed` | Password di `.env.local` tidak sama dengan password PostgreSQL |
| `DATABASE_URL` bernilai `undefined` | Nama file harus tepat `.env.local`, lalu restart `npm run dev` |
| `relation "users" does not exist` | Schema dijalankan di database yang salah, ulangi pada database `smck` |
| `function gen_salt does not exist` | Jalankan `CREATE EXTENSION pgcrypto;` (butuh hak superuser) |
| Terlempar ke login terus | `SESSION_SECRET` kosong/berubah, atau cookie lama; hapus cookie lalu login ulang |
| `localStorage is not defined` | Jangan simpan sesi di `localStorage`; gunakan cookie di sisi server |

## 🗺️ Roadmap (Opsional)

- [ ] Cetak surat cuti PDF setelah disetujui
- [ ] CRUD hari libur & cuti bersama
- [ ] Simulasi kuota (what-if) & sinkronisasi kalender
- [ ] Peringatan kuota hangus menjelang akhir tahun
- [ ] Notifikasi ke rekan pengganti

## 📄 Lisensi & Kredit

Proyek individu mata kuliah Pemrograman Web. Studi kasus: PT Swadharma Sarana Informatika, Cabang Makassar.

Dibuat oleh **<NAMA_KAMU>** · <NIM_KAMU>