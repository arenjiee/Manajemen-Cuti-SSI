CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  nama_lengkap VARCHAR(100) NOT NULL,
  telepon VARCHAR(30),
  alamat TEXT,
  foto_key VARCHAR(100),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','karyawan','ketua_divisi','hrd')),
  divisi_id INTEGER,
  tanggal_bergabung DATE NOT NULL,
  kuota_awal NUMERIC(4,1) NOT NULL DEFAULT 12,
  aktif BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_aktif ON users (lower(email)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX users_username_aktif ON users (lower(username)) WHERE deleted_at IS NULL;

CREATE TABLE divisi (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  ketua_id INTEGER REFERENCES users(id),
  max_persen_cuti INTEGER NOT NULL DEFAULT 10 CHECK (max_persen_cuti BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX divisi_nama_aktif ON divisi (lower(nama)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX divisi_ketua_aktif ON divisi (ketua_id) WHERE deleted_at IS NULL AND ketua_id IS NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_divisi_fk FOREIGN KEY (divisi_id) REFERENCES divisi(id);

CREATE TABLE jenis_cuti (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  kode VARCHAR(20) UNIQUE CHECK (kode IN ('tahunan','sakit')),
  is_system BOOLEAN NOT NULL DEFAULT false,
  kuota_hari NUMERIC(5,1),
  batas_pengajuan_hari INTEGER NOT NULL DEFAULT 0,
  wajib_lampiran BOOLEAN NOT NULL DEFAULT false,
  potong_kuota BOOLEAN NOT NULL DEFAULT false,
  aktif BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE pengajuan_cuti (
  id SERIAL PRIMARY KEY,
  pengaju_id INTEGER NOT NULL REFERENCES users(id),
  divisi_id INTEGER REFERENCES divisi(id),
  jenis_id INTEGER NOT NULL REFERENCES jenis_cuti(id),
  tanggal_pengajuan DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  setengah_hari BOOLEAN NOT NULL DEFAULT false,
  total_hari NUMERIC(4,1) NOT NULL,
  alasan TEXT NOT NULL,
  handover_id INTEGER REFERENCES users(id),
  catatan_tugas TEXT,
  alamat_cuti TEXT,
  nomor_darurat VARCHAR(30),
  status VARCHAR(20) NOT NULL CHECK (status IN ('Pending','Approved by Leader','Approved','Rejected','Cancelled')),
  tahap VARCHAR(10) NOT NULL CHECK (tahap IN ('leader','hrd')),
  ditolak_oleh VARCHAR(10) CHECK (ditolak_oleh IN ('leader','hrd')),
  alasan_batal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (tanggal_selesai >= tanggal_mulai),
  CHECK (NOT setengah_hari OR tanggal_mulai = tanggal_selesai)
);
CREATE INDEX pengajuan_pengaju ON pengajuan_cuti (pengaju_id);
CREATE INDEX pengajuan_divisi_status ON pengajuan_cuti (divisi_id, status);
CREATE INDEX pengajuan_rentang ON pengajuan_cuti (tanggal_mulai, tanggal_selesai);

CREATE TABLE persetujuan (
  id SERIAL PRIMARY KEY,
  pengajuan_id INTEGER NOT NULL REFERENCES pengajuan_cuti(id) ON DELETE CASCADE,
  tahap VARCHAR(10) NOT NULL CHECK (tahap IN ('leader','hrd')),
  approver_id INTEGER NOT NULL REFERENCES users(id),
  keputusan VARCHAR(10) NOT NULL CHECK (keputusan IN ('approve','reject')),
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lampiran (
  id SERIAL PRIMARY KEY,
  pengajuan_id INTEGER REFERENCES pengajuan_cuti(id) ON DELETE CASCADE,
  diunggah_oleh INTEGER REFERENCES users(id),
  nama_asli VARCHAR(200) NOT NULL,
  mime VARCHAR(50) NOT NULL,
  ukuran INTEGER NOT NULL,
  storage_key VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hari_libur (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL UNIQUE,
  keterangan VARCHAR(150) NOT NULL,
  jenis VARCHAR(20) NOT NULL DEFAULT 'nasional' CHECK (jenis IN ('nasional','cuti_bersama'))
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tipe VARCHAR(30) NOT NULL,
  pesan TEXT NOT NULL,
  link VARCHAR(200),
  dibaca BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user ON notifications (user_id, dibaca);

CREATE TABLE pengaturan (
  key VARCHAR(50) PRIMARY KEY,
  value VARCHAR(200) NOT NULL
);
