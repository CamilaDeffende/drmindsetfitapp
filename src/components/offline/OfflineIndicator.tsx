/**
 * MF_OFFLINE_INDICATOR_V1
 */
import { useOffline } from "@/hooks/useOffline/useOffline";

type Props = { className?: string };

export function OfflineIndicator({ className }: Props) {
  const { isOnline } = useOffline();
  if (isOnline) return null;

  return (
    <div
      className={[
        "fixed left-1/2 top-3 z-[60] -translate-x-1/2",
        "rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3 py-1",
        "text-[11px] tracking-wide text-zinc-100 shadow-lg backdrop-blur",
        className || "",
      ].join(" ")}
      role="status"
      aria-live="polite"
      data-testid="mf-offline-indicator"
      title="Sem conexão. Alguns recursos podem ficar indisponíveis."
    >
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-zinc-200" />
        <span className="uppercase">Offline</span>
      </span>
    </div>
  );
}
