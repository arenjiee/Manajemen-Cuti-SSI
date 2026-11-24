import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Ikon = Inbox,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/40 p-10 text-center ${className}`}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted">
        <Ikon className="h-5 w-5" aria-hidden />
      </span>
      {title && <h3 className="font-display text-base font-semibold text-ink">{title}</h3>}
      {description && (
        <div className={`${title ? "mt-1" : ""} max-w-sm text-sm leading-relaxed text-muted`}>
          {description}
        </div>
      )}
      {action && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
