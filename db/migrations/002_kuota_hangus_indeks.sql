BEGIN;

DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'notifications'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%tipe%'
  LOOP
    EXECUTE format('ALTER TABLE notifications DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_pengajuan_divisi_tanggal ON pengajuan_cuti (divisi_id, tanggal_mulai, tanggal_selesai);
CREATE INDEX IF NOT EXISTS idx_pengajuan_pengaju_status ON pengajuan_cuti (pengaju_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_tipe ON notifications (user_id, tipe, created_at DESC);

COMMIT;
