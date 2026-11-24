export default function Section({
  eyebrow,
  title,
  description,
  action,
  children,
  className = "",
  headerClassName = "",
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || eyebrow || action) && (
        <div className={`flex flex-wrap items-end justify-between gap-3 ${headerClassName}`}>
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-xs font-semibold text-muted">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
