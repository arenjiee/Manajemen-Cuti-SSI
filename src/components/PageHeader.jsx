export default function PageHeader({ eyebrow, title, description, action, className = "" }) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-4 border-b border-line/60 pb-5 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold text-muted">{eyebrow}</p>}
        <h1 className={`${eyebrow ? "mt-1" : ""} font-display text-3xl font-bold tracking-tight text-ink md:text-4xl`}>{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
