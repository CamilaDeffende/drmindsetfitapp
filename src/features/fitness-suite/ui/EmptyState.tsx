export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-[12px] uppercase tracking-wide text-white/50">Status</div>
      <div className="mt-2 text-[16px] font-semibold text-white/90">{title}</div>
      <div className="mt-1 text-[13px] text-white/70">{subtitle}</div>

      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-[12px] text-white/90 hover:bg-white/15 active:scale-[0.98] transition"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
