-- Migrasi 006: Pastikan pengaturan peringatan kuota hangus punya nilai default.
-- Ambang 8 hari dan periode peringatan mulai bulan 9 (September).
INSERT INTO pengaturan (key, value) VALUES
  ('ambang_kuota_hangus', '8'),
  ('bulan_mulai_peringatan', '9')
ON CONFLICT (key) DO NOTHING;
