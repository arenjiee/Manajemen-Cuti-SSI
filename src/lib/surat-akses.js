export function bolehUnduhSurat(user, p) {
  if (p.status !== "Approved") return false;
  if (user.id === p.pengaju_id) return true;
  return user.role === "hrd" || user.role === "admin";
}
