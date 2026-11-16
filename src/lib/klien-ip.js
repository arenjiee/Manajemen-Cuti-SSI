export function ipKlien(headers) {
  const xff = headers.get("x-forwarded-for");
  const ip = (xff ? xff.split(",")[0] : headers.get("x-real-ip") ?? "").trim();
  return ip.slice(0, 64) || "tidak-diketahui";
}
