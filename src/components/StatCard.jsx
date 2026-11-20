import GlowCard from "./GlowCard";

/**
 * Adapter backward-compatible untuk GlowCard.
 * Gunakan GlowCard langsung pada kode baru.
 */
export default function StatCard({
  label,
  nilai,
  catatan,
  tone,
  icon,
  badge,
  href,
  className = "",
}) {
  return (
    <GlowCard
      label={label}
      value={nilai}
      description={catatan}
      tone={tone}
      icon={icon}
      badge={badge}
      href={href}
      className={className}
    />
  );
}
