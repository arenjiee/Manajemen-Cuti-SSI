import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "smck_session";
const TIGA_PULUH_HARI = 30 * 24 * 3600;
const DUA_BELAS_JAM = 12 * 3600;

const kunci = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function buatToken(userId, remember, { ttlDetik } = {}) {
  const ttl = ttlDetik ?? (remember ? TIGA_PULUH_HARI : DUA_BELAS_JAM);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .sign(kunci());
  return { token, maxAge: remember ? TIGA_PULUH_HARI : undefined };
}

export async function bacaToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}
