export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "animate-pulse rounded-2xl border border-white/10 bg-white/5 " + className
      }
    />
  );
}
