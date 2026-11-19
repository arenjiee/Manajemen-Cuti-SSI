BEGIN;

-- Hapus kolom absolut yang tidak dipakai lagi (jika ada di DB dev)
ALTER TABLE divisi DROP COLUMN IF EXISTS maks_cuti_per_hari;

-- Update default max_persen_cuti dari 10 ke 20
ALTER TABLE divisi ALTER COLUMN max_persen_cuti SET DEFAULT 20;

-- Tighten constraint: persen minimal 1 (bukan 0) agar selalu ada batas minimal 1 orang
ALTER TABLE divisi DROP CONSTRAINT IF EXISTS divisi_max_persen_cuti_check;
ALTER TABLE divisi ADD CONSTRAINT divisi_max_persen_cuti_check CHECK (max_persen_cuti BETWEEN 1 AND 100);

COMMIT;