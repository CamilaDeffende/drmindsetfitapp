/**
 * MindsetFit — Metabolismo (Fonte da verdade)
 * Objetivo: centralizar fator de atividade e cálculo de GET, evitando lógica duplicada em UI.
 *
 * IMPORTANTE:
 * - Mantém abordagem conservadora e fácil de ajustar.
 * - Se o app já tiver outra fórmula, este módulo só define fator e composição do GET (TDEE).
 */

export type NivelTreino = "iniciante" | "intermediario" | "avancado";

/**
 * Fator de atividade (PAL) baseado no "nível" informado no onboarding.
 * Ajuste aqui caso você queira afinar para seu modelo.
 */
export function getActivityFactor(nivel?: string | null): number {
  const n = String(nivel ?? "").toLowerCase().trim();
  // mapeamentos aceitos (inclui variações comuns)
  if (n.includes("avan")) return 1.70;
  if (n.includes("inter")) return 1.55;
  if (n.includes("ini")) return 1.40;
  // fallback seguro (neutro-conservador)
  return 1.45;
}

/**
 * Calcula GET (TDEE) a partir da TMB e do fator de atividade.
 * Arredonda para inteiro.
 */
export function computeGET(tmb: number, activityFactor: number): number {
  const safeTmb = Number.isFinite(tmb) ? tmb : 0;
  const safeAf = Number.isFinite(activityFactor) ? activityFactor : 1.45;
  return Math.round(safeTmb * safeAf);
}

/**
 * Detecta o nível do usuário a partir de possíveis lugares no state.
 * Mantém compatibilidade com seu app (perfil/avaliacao/metabolismo).
 */
export function inferNivelTreinoFromState(state: any): string | null {
  // prioridade: perfil (onde normalmente fica "nível"), depois avaliacao, depois metabolismo
  const candidates = [
    state?.perfil?.nivelTreino,
    state?.avaliacao?.nivelTreino,
    state?.metabolismo?.nivelTreino,
    state?.perfil?.nivel,
    state?.avaliacao?.nivel,
  ];
  for (const c of candidates) {
    const v = c != null ? String(c).trim() : "";
    if (v) return v;
  }
  return null;
}

/**
 * Faz um "merge" seguro no objeto metabolismo para persistência.
 */
export function buildMetabolismoPatch(input: {
  tmb: number;
  nivel?: string | null;
  equacaoUtilizada?: string;
  justificativa?: string;
  caloriasAlvo?: number;
}) {
  const nivel = input.nivel ?? null;
  const fatorAtividade = getActivityFactor(nivel);
  const get = computeGET(input.tmb, fatorAtividade);

  // caloriasAlvo: se vier do seu modelo/objetivo, respeita; caso contrário, usa GET como base
  const caloriasAlvo = Number.isFinite(input.caloriasAlvo as number)
    ? Math.round(Number(input.caloriasAlvo))
    : get;

  return {
    tmb: Math.round(Number(input.tmb) || 0),
    get,
    caloriasAlvo,
    fatorAtividade,
    nivelTreino: nivel,
    equacaoUtilizada: input.equacaoUtilizada ?? undefined,
    justificativa: input.justificativa ?? undefined,
  };
}
