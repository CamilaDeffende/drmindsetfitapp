type Props = {
  title?: string;
  supportsGeo: boolean;
  flags: {
    canStart: boolean;
    canPause: boolean;
    canResume: boolean;
    canFinish: boolean;
    canExport: boolean;
  };
  actions: {
    start: () => void;
    pause: () => void;
    resume: () => void;
    finish: () => void;
    reset: () => void;
  };
  pointsCount: number;
};

export function RunControlsCard({
  title = "Corrida PRO • GPS ao vivo",
  supportsGeo,
  flags,
  actions,
  pointsCount,
}: Props) {
  const statusText = supportsGeo ? "Pronto para captar GPS" : "GPS indisponível neste dispositivo/navegador";

  return (
    <div className="mt-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">
            {statusText}
            <span className="ml-2">
              • pontos: <span className="font-semibold">{pointsCount}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border bg-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            onClick={actions.start}
            disabled={!supportsGeo || !flags.canStart}
          >
            Iniciar
          </button>

          <button
            type="button"
            className="rounded-xl border bg-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            onClick={actions.pause}
            disabled={!flags.canPause}
          >
            Pausar
          </button>

          <button
            type="button"
            className="rounded-xl border bg-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            onClick={actions.resume}
            disabled={!flags.canResume}
          >
            Retomar
          </button>

          <button
            type="button"
            className="rounded-xl border bg-background px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            onClick={actions.finish}
            disabled={!flags.canFinish}
          >
            Finalizar
          </button>

          <button
            type="button"
            className="rounded-xl border bg-background px-4 py-2 text-sm font-semibold hover:opacity-90"
            onClick={actions.reset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
