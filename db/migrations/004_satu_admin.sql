-- Migrasi 004: Garansi database hanya ada maksimal 1 akun admin aktif
CREATE UNIQUE INDEX IF NOT EXISTS users_satu_admin_aktif
ON users (role)
WHERE role = 'admin' AND deleted_at IS NULL;
