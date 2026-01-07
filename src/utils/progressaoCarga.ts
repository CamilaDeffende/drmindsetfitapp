export type RegistroCargaLike = {
  exercicioId?: string;
  exercicioNome?: string;
  kg?: number;
  cargaTotal?: number;
  detalhes?: Array<{ kg?: number; reps?: number }>;
  data?: string;
};

function roundToStep(v: number, step = 0.5) {
  return Math.round(v / step) * step;
}

export function sugerirProximaCargaKg(ultKg: number, repsAlvo?: number) {
  // heurística simples e segura:
  // - se repsAlvo alto: +2.5%
  // - se repsAlvo baixo: +5%
  const inc = repsAlvo !== undefined && repsAlvo <= 6 ? 0.05 : 0.025;
  const next = Math.max(0, ultKg * (1 + inc));
  return roundToStep(next, 0.5);
}

export function extrairUltimaCargaPorExercicio(
  historico: RegistroCargaLike[],
  exercicioIdOrNome: string
) {
  const list = (historico ?? [])
    .filter((h) => (h.exercicioId ?? h.exercicioNome ?? "") === exercicioIdOrNome)
    .map((h) => {
      const kg =
        h.kg ??
        (h.detalhes?.[0]?.kg ?? undefined) ??
        (typeof h.cargaTotal === "number" ? h.cargaTotal : undefined);
      return typeof kg === "number" ? kg : undefined;
    })
    .filter((v): v is number => typeof v === "number");
  return list.length ? list[list.length - 1] : undefined;
}
