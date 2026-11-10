import bcrypt from "bcryptjs";
import { bacaToken } from "./session.js";
import { cariUserLogin, ambilUserAktif } from "./queries/users.js";

// Hash tiruan agar waktu respons sama untuk akun yang tidak ada.
const HASH_TIRUAN = bcrypt.hashSync("tiruan-tidak-dipakai", 10);

export async function autentikasi(db, identifier, password) {
  if (typeof identifier !== "string" || typeof password !== "string" || !identifier.trim()) return null;
  const row = await cariUserLogin(db, identifier.trim());
  const cocok = await bcrypt.compare(password, row ? row.password_hash : HASH_TIRUAN);
  if (!row || !cocok) return null;
  const { password_hash, ...user } = row;
  return user;
}

export async function bacaSessionUser(db, token) {
  const id = await bacaToken(token);
  if (id == null) return null;
  return ambilUserAktif(db, id);
}
