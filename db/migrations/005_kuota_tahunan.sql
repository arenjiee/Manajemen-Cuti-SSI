-- Migrasi 005: Kuota Cuti Tahunan menjadi satu angka global (minimal 12 hari)
-- Angka di jenis_cuti.kode='tahunan' adalah sumber kuota; kuota_awal semua pengguna disamakan.
UPDATE jenis_cuti
SET kuota_hari = 12
WHERE kode = 'tahunan' AND (kuota_hari IS NULL OR kuota_hari < 12);

UPDATE users
SET kuota_awal = (SELECT kuota_hari FROM jenis_cuti WHERE kode = 'tahunan')
WHERE deleted_at IS NULL;