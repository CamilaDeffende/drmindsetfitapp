export type MacroTarget = {
  calorias?: number;
  proteina?: number;
  carboidratos?: number;
  gorduras?: number;
};

export type AlimentoBase = {
  id?: string;
  nome: string;
  porcao?: number;
  unidade?: string;
  kcal?: number;
  p?: number;
  c?: number;
  g?: number;
  tags?: string[];
};

const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

// Heurística simples e segura: escolhe itens "mais próximos" do alvo calórico/macros.
export function sugerirSubstituicoes(
  base: AlimentoBase,
  catalogo: AlimentoBase[],
  opts?: { limite?: number; toleranciaKcal?: number; exigirTag?: boolean }
) {
  const limite = opts?.limite ?? 6;
  const tol = opts?.toleranciaKcal ?? 120;
  const exigirTag = opts?.exigirTag ?? false;

  const kcalBase = num(base.kcal);
  const tagsBase = new Set((base.tags ?? []).map(String));

  const scored = (catalogo ?? [])
    .filter(x => x && x.nome && x.nome !== base.nome)
    .filter(x => {
      if (!exigirTag) return true;
      const t = (x.tags ?? []).map(String);
      return t.some(tt => tagsBase.has(tt));
    })
    .map(x => {
      const dk = Math.abs(num(x.kcal) - kcalBase);
      const dp = Math.abs(num(x.p) - num(base.p));
      const dc = Math.abs(num(x.c) - num(base.c));
      const dg = Math.abs(num(x.g) - num(base.g));
      // score menor = melhor
      const score = dk * 1.0 + dp * 2.0 + dc * 1.2 + dg * 1.2;
      return { ...x, _score: score, _dk: dk };
    })
    .filter(x => x._dk <= tol)
    .sort((a,b)=> a._score - b._score)
    .slice(0, limite)
    .map(({_score,_dk,...rest})=>rest);

  return scored;
}
