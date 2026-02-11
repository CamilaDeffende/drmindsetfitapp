
type Item = { label: string; value: string; hint?: string };

export function StatsOverview({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl bg-white/80 dark:bg-zinc-800/70 shadow-sm p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{it.label}</div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{it.value}</div>
          {it.hint ? <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{it.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
