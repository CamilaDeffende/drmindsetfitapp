export function PremiumBadge({ label = "PRO" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/80">
      {label}
    </span>
  );
}
