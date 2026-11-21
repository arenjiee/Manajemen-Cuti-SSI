-- ============================================================================
-- SEED DATA DUMMY SISTEM MANAJEMEN CUTI (20 KARYAWAN)
-- Jalankan di pgAdmin -> Query Tool pada database aplikasi.
--
-- PRASYARAT
--   1. Tabel sudah dibuat. Jika database masih kosong, jalankan db/schema.sql
--      sekali terlebih dahulu.
--   2. Berkas contoh lampiran sudah disimpan langsung ke tabel file_storage
--      (kolom BYTEA), tidak perlu menyalin ke folder uploads.
--
-- PERINGATAN: skrip ini mengosongkan seluruh tabel lalu mengisi data baru.
-- Password semua akun: password123
-- ============================================================================

BEGIN;

-- 1. Bersihkan data lama dan reset auto increment
TRUNCATE TABLE
  lampiran,
  persetujuan,
  pengajuan_cuti,
  notifications,
  users,
  divisi,
  jenis_cuti,
  hari_libur,
  pengaturan,
  file_storage
RESTART IDENTITY CASCADE;

-- 2. Pengguna (20 akun)
-- Hash bcrypt untuk password: password123
INSERT INTO users (id, username, email, password_hash, nama_lengkap, telepon, alamat, role, tanggal_bergabung, kuota_awal, aktif) VALUES
  (1,  'nabila',      'nabila@ssi.co.id',      '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Nabila Roidah',              '08110000001', 'Makassar', 'admin',        '2018-02-01', 12, true),
  (2,  'siti.rabiatul','siti.rabiatul@ssi.co.id','$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Siti Rabiatul Adawiyah',     '08110000002', 'Makassar', 'hrd',          '2019-03-01', 12, true),
  (3,  'al.daffa',    'al.daffa@ssi.co.id',    '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Al Daffa A''Aren',           '08110000003', 'Makassar', 'ketua_divisi', '2020-01-06', 12, true),
  (4,  'm.syahdan',   'm.syahdan@ssi.co.id',   '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Muhammad Syahdan',           '08110000004', 'Makassar', 'ketua_divisi', '2020-07-13', 12, true),
  (5,  'm.rifat',     'm.rifat@ssi.co.id',     '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Muhammad Rifat Kasman',      '08110000005', 'Makassar', 'ketua_divisi', '2021-02-01', 12, true),
  (6,  'a.faqiih',    'a.faqiih@ssi.co.id',    '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Andi Faqiih Ahmad Dzaky',    '08110000006', 'Makassar', 'ketua_divisi', '2021-08-02', 12, true),
  (7,  'eriqz',       'eriqz@ssi.co.id',       '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Eriqz Affanditya Nursin',    '08110000007', 'Makassar', 'karyawan',     '2022-01-10', 12, true),
  (8,  'diva',        'diva@ssi.co.id',        '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Diva Puspita',               '08110000008', 'Makassar', 'karyawan',     '2022-04-04', 12, true),
  (9,  'imam',        'imam@ssi.co.id',        '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Imam Arif Rahmat',           '08110000009', 'Makassar', 'karyawan',     '2022-09-12', 12, true),
  (10, 'afdhol',      'afdhol@ssi.co.id',      '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Afdhol As Syamardi',         '08110000010', 'Makassar', 'karyawan',     '2023-01-09', 12, true),
  (11, 'tifli',       'tifli@ssi.co.id',       '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Achmad Tifli',               '08110000011', 'Makassar', 'karyawan',     '2023-05-02', 12, true),
  (12, 'karis',       'karis@ssi.co.id',       '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Karis Kabanga',              '08110000012', 'Makassar', 'karyawan',     '2023-08-14', 12, true),
  (13, 'mawaddah',    'mawaddah@ssi.co.id',    '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Mawaddah Fajri Lahamuddin',  '08110000013', 'Makassar', 'karyawan',     '2024-01-08', 12, true),
  (14, 'naufal',      'naufal@ssi.co.id',      '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Muhammad Naufal Alim',       '08110000014', 'Makassar', 'karyawan',     '2024-06-03', 12, true),
  (15, 'mukhsin',     'mukhsin@ssi.co.id',     '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Mukhsin',                    '08110000015', 'Makassar', 'karyawan',     '2024-10-07', 12, true),
  (16, 'alif',        'alif@ssi.co.id',        '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Muh Alif Syamsir',           '08110000016', 'Makassar', 'karyawan',     '2025-02-03', 12, true),
  (17, 'faiz',        'faiz@ssi.co.id',        '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Muh Faiz Ilyas',             '08110000017', 'Makassar', 'karyawan',     '2025-07-07', 12, true),
  (18, 'talista',     'talista@ssi.co.id',     '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Andi Talista Anindya',       '08110000018', 'Makassar', 'karyawan',     '2023-03-06', 12, true),
  (19, 'aqila',       'aqila@ssi.co.id',       '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Aqila',                      '08110000019', 'Makassar', 'karyawan',     '2026-06-01', 12, true),
  (20, 'syarief',     'syarief@ssi.co.id',     '$2b$10$wUzlf9lhQZ1GBwHOXOUmZepXLGF.zbZbiG5ocllH.poOGzV53Zd.i', 'Syarief Rahmatullah',        '08110000020', 'Makassar', 'karyawan',     '2021-11-01', 12, true);

-- 3. Divisi (setiap ketua hanya memimpin satu divisi)
INSERT INTO divisi (id, nama, deskripsi, ketua_id, max_persen_cuti) VALUES
  (1, 'CPC', 'Cash Processing Center: penyortiran dan penghitungan uang', 3, 25),
  (2, 'CIT', 'Cash in Transit: pengawalan dan pengiriman uang',           4, 25),
  (3, 'FLM', 'First Line Maintenance: perawatan ATM dan pengisian kaset', 5, 34),
  (4, 'OPS', 'Operasional dan dukungan administrasi',                     6, 30);

-- 4. Penempatan anggota divisi
UPDATE users SET divisi_id = 1 WHERE id IN (3, 7, 8, 9, 10);   -- CPC
UPDATE users SET divisi_id = 2 WHERE id IN (4, 11, 12, 13, 14); -- CIT
UPDATE users SET divisi_id = 3 WHERE id IN (5, 15, 16, 17, 18); -- FLM
UPDATE users SET divisi_id = 4 WHERE id IN (6, 19, 20);         -- OPS

-- 5. Jenis cuti
INSERT INTO jenis_cuti (id, nama, kode, is_system, kuota_hari, batas_pengajuan_hari, wajib_lampiran, potong_kuota, aktif) VALUES
  (1, 'Cuti Tahunan',      'tahunan', true,  12,   3, false, true,  true),
  (2, 'Cuti Sakit',        'sakit',   true,  NULL, -3, true,  false, true),
  (3, 'Cuti Menikah',      NULL,      false, 3,    7, true,  false, true),
  (4, 'Cuti Duka',         NULL,      false, 2,    0, false, false, true),
  (5, 'Cuti Melahirkan',   NULL,      false, 90,  30, true,  false, true),
  (6, 'Cuti Tanpa Gaji',   NULL,      false, NULL,  0, false, false, true);

-- 6. Hari libur dan cuti bersama 2026
INSERT INTO hari_libur (tanggal, keterangan, jenis) VALUES
  ('2026-01-01', 'Tahun Baru 2026',            'nasional'),
  ('2026-05-01', 'Hari Buruh',                  'nasional'),
  ('2026-06-01', 'Hari Lahir Pancasila',        'nasional'),
  ('2026-08-17', 'Hari Kemerdekaan RI',         'nasional'),
  ('2026-12-24', 'Cuti Bersama Natal',          'cuti_bersama'),
  ('2026-12-25', 'Hari Natal',                  'nasional');

-- 7. Pengaturan peringatan kuota hangus
INSERT INTO pengaturan (key, value) VALUES
  ('ambang_kuota_hangus', '8'),
  ('bulan_mulai_peringatan', '9')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 8. Pengajuan cuti (semua status dan beberapa jenis cuti)
-- status: Pending | Approved by Leader | Approved | Rejected | Cancelled
-- tahap : leader | hrd
INSERT INTO pengajuan_cuti
  (id, pengaju_id, divisi_id, jenis_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai,
   setengah_hari, total_hari, alasan, handover_id, catatan_tugas, alamat_cuti, nomor_darurat,
   status, tahap, ditolak_oleh, alasan_batal) VALUES
  -- 1. Pending di Ketua Divisi (CPC)
  (1, 7, 1, 1, '2026-11-20', '2026-12-07', '2026-12-08', false, 2,
   'Keperluan keluarga di luar kota', 8,
   'Rekonsiliasi kas harian sudah diserahkan ke rekan pengganti',
   'Jl. Pettarani No. 10, Makassar', '08129990001', 'Pending', 'leader', NULL, NULL),
  -- 2. Approved by Leader, menunggu final HRD (CPC)
  (2, 8, 1, 1, '2026-11-18', '2026-11-30', '2026-12-01', false, 2,
   'Menghadiri acara keluarga', 7,
   'Berkas kas sudah disiapkan', 'Jl. Sultan Alauddin, Makassar', '08129990002',
   'Approved by Leader', 'hrd', NULL, NULL),
  -- 3. Approved penuh (CPC)
  (3, 9, 1, 1, '2026-02-25', '2026-03-02', '2026-03-04', false, 3,
   'Pulang kampung', 10,
   'Pekerjaan rutin didelegasikan', 'Kab. Gowa', '08129990003',
   'Approved', 'hrd', NULL, NULL),
  -- 4. Ditolak Ketua Divisi (CPC)
  (4, 10, 1, 1, '2026-03-30', '2026-04-06', '2026-04-07', false, 2,
   'Acara keluarga', 9,
   'Tidak ada', 'Makassar', '08129990004',
   'Rejected', 'leader', 'leader', NULL),
  -- 5. Ditolak HRD (CIT)
  (5, 11, 2, 1, '2026-04-27', '2026-05-04', '2026-05-05', false, 2,
   'Liburan singkat', 12,
   'Tugas pengawalan dialihkan', 'Makassar', '08129990005',
   'Rejected', 'hrd', 'hrd', NULL),
  -- 6. Dibatalkan karyawan (CIT)
  (6, 12, 2, 1, '2026-06-01', '2026-06-08', '2026-06-09', false, 2,
   'Acara keluarga', 11,
   'Tidak ada', 'Makassar', '08129990006',
   'Cancelled', 'leader', NULL, 'Acara keluarga dibatalkan'),
  -- 7. Cuti Sakit disetujui + lampiran surat dokter (CIT)
  (7, 13, 2, 2, '2026-10-01', '2026-10-05', '2026-10-06', false, 2,
   'Demam dan perlu istirahat sesuai surat dokter', 14,
   'Laporan harian sudah diserahkan', 'Makassar', '08129990007',
   'Approved', 'hrd', NULL, NULL),
  -- 8. Cuti Menikah disetujui (CIT)
  (8, 14, 2, 3, '2026-09-07', '2026-09-14', '2026-09-16', false, 3,
   'Menikah', 13,
   'Pekerjaan didelegasikan ke rekan satu tim', 'Makassar', '08129990008',
   'Approved', 'hrd', NULL, NULL),
  -- 9. Cuti setengah hari disetujui (FLM)
  (9, 18, 3, 1, '2026-11-05', '2026-11-10', '2026-11-10', true, 0.5,
   'Mengurus dokumen kependudukan', 17,
   'Pekerjaan selesai sebelum pulang', 'Makassar', '08129990009',
   'Approved', 'hrd', NULL, NULL),
  -- 10. Pending di Ketua Divisi (FLM)
  (10, 16, 3, 1, '2026-11-18', '2026-12-02', '2026-12-03', false, 2,
   'Keperluan keluarga', 15,
   'Maintenance rutin sudah dijadwalkan ulang', 'Makassar', '08129990010',
   'Pending', 'leader', NULL, NULL),
  -- 11. Cuti Tanpa Gaji, disetujui Ketua Divisi dan menunggu final HRD (OPS)
  --     Aqila bergabung 2026-06-01 (masa kerja di bawah 1 tahun), jadi tidak memakai Cuti Tahunan.
  (11, 19, 4, 6, '2026-11-19', '2026-11-26', '2026-11-27', false, 2,
   'Mengurus keperluan keluarga', 20,
   'Administrasi sudah diserahkan', 'Makassar', '08129990011',
   'Approved by Leader', 'hrd', NULL, NULL),
  -- 12. Approved penuh (OPS)
  (12, 20, 4, 1, '2026-01-05', '2026-01-12', '2026-01-13', false, 2,
   'Istirahat', 19,
   'Tidak ada', 'Makassar', '08129990012',
   'Approved', 'hrd', NULL, NULL),
  -- 13. Dibatalkan karyawan (FLM)
  (13, 15, 3, 1, '2026-02-02', '2026-02-09', '2026-02-10', false, 2,
   'Acara keluarga', 16,
   'Tidak ada', 'Makassar', '08129990013',
   'Cancelled', 'leader', NULL, 'Dibatalkan karena dinas luar'),
  -- 14. Ditolak Ketua Divisi (FLM)
  (14, 17, 3, 1, '2026-06-29', '2026-07-06', '2026-07-07', false, 2,
   'Liburan', 18,
   'Tidak ada', 'Makassar', '08129990014',
   'Rejected', 'leader', 'leader', NULL),
  -- 15. Ketua Divisi mengajukan langsung ke HRD (CIT)
  (15, 4, 2, 1, '2026-11-20', '2026-12-14', '2026-12-15', false, 2,
   'Keperluan pribadi', 11,
   'Koordinasi tim sudah diserahkan', 'Makassar', '08129990015',
   'Pending', 'hrd', NULL, NULL),
  -- 16. Ketua Divisi, disetujui HRD (CPC)
  (16, 3, 1, 1, '2026-11-15', '2026-12-21', '2026-12-22', false, 2,
   'Liburan akhir tahun', 8,
   'Serah terima tugas sudah dilakukan', 'Makassar', '08129990016',
   'Approved', 'hrd', NULL, NULL),
  -- 17. Ketua Divisi, disetujui HRD (FLM)
  (17, 5, 3, 1, '2026-08-03', '2026-08-10', '2026-08-11', false, 2,
   'Keperluan keluarga', 15,
   'Tim sudah dikoordinasikan', 'Makassar', '08129990017',
   'Approved', 'hrd', NULL, NULL),
  -- 18. Pending di Ketua Divisi (CIT)
  (18, 12, 2, 1, '2026-11-21', '2026-12-09', '2026-12-10', false, 2,
   'Menghadiri acara keluarga di luar kota', 11,
   'Rute pengawalan sudah dialihkan ke rekan satu tim', 'Makassar', '08129990018',
   'Pending', 'leader', NULL, NULL),
  -- 19. Pending di Ketua Divisi (OPS)
  (19, 20, 4, 1, '2026-11-21', '2026-12-07', '2026-12-08', false, 2,
   'Keperluan keluarga', 19,
   'Pekerjaan administrasi sudah diserahkan', 'Makassar', '08129990019',
   'Pending', 'leader', NULL, NULL);

-- 9. Riwayat persetujuan (timeline)
INSERT INTO persetujuan (pengajuan_id, tahap, approver_id, keputusan, catatan, created_at) VALUES
  (2,  'leader', 3, 'approve', 'Disetujui, pastikan serah terima sudah jelas.', '2026-11-18 09:30:00+08'),
  (3,  'leader', 3, 'approve', 'Disetujui.',                                      '2026-02-25 10:00:00+08'),
  (3,  'hrd',    2, 'approve', 'Disetujui HRD.',                                  '2026-02-26 08:30:00+08'),
  (4,  'leader', 3, 'reject',  'Bentrok dengan jadwal audit.',                    '2026-03-30 14:00:00+08'),
  (5,  'leader', 4, 'approve', 'Disetujui, tugas sudah dialihkan.',               '2026-04-27 09:00:00+08'),
  (5,  'hrd',    2, 'reject',  'Dokumen pendukung kurang lengkap.',               '2026-04-28 08:00:00+08'),
  (7,  'leader', 4, 'approve', 'Semoga lekas sembuh.',                            '2026-10-01 09:15:00+08'),
  (7,  'hrd',    2, 'approve', 'Surat dokter valid.',                             '2026-10-02 08:10:00+08'),
  (8,  'leader', 4, 'approve', 'Selamat menempuh hidup baru.',                    '2026-09-07 10:00:00+08'),
  (8,  'hrd',    2, 'approve', 'Disetujui HRD.',                                  '2026-09-08 08:45:00+08'),
  (9,  'leader', 5, 'approve', 'Disetujui setengah hari.',                        '2026-11-05 11:00:00+08'),
  (9,  'hrd',    2, 'approve', 'Disetujui HRD.',                                  '2026-11-06 08:20:00+08'),
  (11, 'leader', 6, 'approve', 'Disetujui, administrasi sudah diserahkan.',       '2026-11-19 13:00:00+08'),
  (12, 'leader', 6, 'approve', 'Disetujui.',                                      '2026-01-05 09:30:00+08'),
  (12, 'hrd',    2, 'approve', 'Disetujui HRD.',                                  '2026-01-06 08:15:00+08'),
  (14, 'leader', 5, 'reject',  'Bertabrakan dengan jadwal maintenance.',          '2026-06-29 14:30:00+08'),
  (16, 'hrd',    2, 'approve', 'Disetujui HRD.',                                  '2026-11-16 09:00:00+08'),
  (17, 'hrd',    2, 'approve', 'Disetujui HRD.',                                  '2026-08-04 09:10:00+08');

-- 10. Penyimpanan berkas lampiran (disimpan langsung di database dalam kolom BYTEA)
INSERT INTO file_storage (id, nama_asli, mime, ukuran, data) VALUES
  (1, 'surat-dokter-contoh.pdf', 'application/pdf', 417, '\x255044462d312e340a312030206f626a3c3c2f547970652f436174616c6f672f50616765732032203020523e3e656e646f626a0a322030206f626a3c3c2f547970652f50616765732f4b6964735b33203020525d2f436f756e7420313e3e656e646f626a0a332030206f626a3c3c2f547970652f506167652f506172656e742032203020522f4d65646961426f785b30203020333030203230305d2f436f6e74656e74732034203020522f5265736f75726365733c3c2f466f6e743c3c2f46312035203020523e3e3e3e3e3e656e646f626a0a342030206f626a3c3c2f4c656e6774682036323e3e73747265616d0a4254202f46312031342054662032302031303020546420285375726174204b65746572616e67616e20446f6b746572202d20636f6e746f682920546a2045540a656e6473747265616d20656e646f626a0a352030206f626a3c3c2f547970652f466f6e742f537562747970652f54797065312f42617365466f6e742f48656c7665746963613e3e656e646f626a0a747261696c65723c3c2f526f6f742031203020522f53697a6520363e3e0a2525454f460a'::bytea);

-- 11. Lampiran pengajuan cuti (terhubung ke file_storage)
INSERT INTO lampiran (pengajuan_id, diunggah_oleh, nama_asli, mime, ukuran, storage_key, file_id) VALUES
  (7, 13, 'surat-dokter-contoh.pdf', 'application/pdf', 417, 'surat-dokter-contoh.pdf', 1);

-- 12. Notifikasi
INSERT INTO notifications (user_id, tipe, pesan, link, dibaca, created_at) VALUES
  (2, 'pengajuan', 'Pengajuan cuti Diva Puspita menunggu persetujuan final.',        '/persetujuan', false, now() - interval '2 hours'),
  (2, 'pengajuan', 'Pengajuan cuti Muhammad Syahdan menunggu persetujuan final.',    '/persetujuan', false, now() - interval '1 hour'),
  (3, 'pengajuan', 'Pengajuan cuti Eriqz Affanditya Nursin menunggu verifikasi.',    '/verifikasi',  false, now() - interval '3 hours'),
  (5, 'pengajuan', 'Pengajuan cuti Muh Alif Syamsir menunggu verifikasi.',           '/verifikasi',  false, now() - interval '4 hours'),
  (4, 'pengajuan', 'Pengajuan cuti Karis Kabanga menunggu verifikasi.',              '/verifikasi',  false, now() - interval '5 hours'),
  (6, 'pengajuan', 'Pengajuan cuti Syarief Rahmatullah menunggu verifikasi.',        '/verifikasi',  false, now() - interval '6 hours'),
  (9, 'pengajuan', 'Pengajuan cuti Anda telah disetujui HRD.',                       '/cuti/3',      true,  '2026-02-26 09:00:00+08'),
  (13,'pengingat', 'Sisa Cuti Tahunan Anda 10 hari dan akan hangus pada 31 Desember 2026. Segera ajukan cuti.', '/cuti/ajukan', false, now() - interval '1 day'),
  (1, 'pengajuan', '7 pengajuan cuti masih menunggu proses persetujuan.',            '/riwayat',     false, now() - interval '30 minutes');

-- 13. Sinkronkan sequence agar insert berikutnya tidak bentrok
SELECT setval(pg_get_serial_sequence('users', 'id'),         (SELECT max(id) FROM users));
SELECT setval(pg_get_serial_sequence('divisi', 'id'),        (SELECT max(id) FROM divisi));
SELECT setval(pg_get_serial_sequence('jenis_cuti', 'id'),    (SELECT max(id) FROM jenis_cuti));
SELECT setval(pg_get_serial_sequence('pengajuan_cuti', 'id'),(SELECT max(id) FROM pengajuan_cuti));
SELECT setval(pg_get_serial_sequence('persetujuan', 'id'),   (SELECT max(id) FROM persetujuan));
SELECT setval(pg_get_serial_sequence('file_storage', 'id'),  (SELECT max(id) FROM file_storage));
SELECT setval(pg_get_serial_sequence('lampiran', 'id'),      (SELECT max(id) FROM lampiran));
SELECT setval(pg_get_serial_sequence('notifications', 'id'), (SELECT max(id) FROM notifications));
SELECT setval(pg_get_serial_sequence('hari_libur', 'id'),    (SELECT max(id) FROM hari_libur));

COMMIT;

-- ============================================================================
-- Verifikasi cepat setelah COMMIT
-- ============================================================================
-- SELECT role, count(*) FROM users GROUP BY role ORDER BY role;
-- SELECT id, nama, ketua_id FROM divisi ORDER BY id;
-- SELECT id, nama, kode, kuota_hari FROM jenis_cuti ORDER BY id;
-- SELECT status, count(*) FROM pengajuan_cuti GROUP BY status ORDER BY status;
-- SELECT u.nama_lengkap, d.nama AS divisi FROM users u LEFT JOIN divisi d ON d.id = u.divisi_id ORDER BY u.id;
