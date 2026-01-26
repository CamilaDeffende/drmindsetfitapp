
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function calcAjusteBiotipoKcal(params: {
  biotipo?: string;
  objetivo?: string;
  imc?: number;
  bfPct?: number | null;
}) {
  const biotipo = params.biotipo;
  if (biotipo !== "ectomorfo") return { kcal: 0, motivo: "Sem ajuste de biotipo." };

  const obj = params.objetivo ?? "manutencao";
  const imc = Number.isFinite(params.imc as any) ? (params.imc as number) : undefined;
  const bf = Number.isFinite(params.bfPct as any) ? (params.bfPct as number) : undefined;

  // indicador simples de "magração"
  const baixoIMC = imc !== undefined ? imc < 21.0 : false;
  const muitoBaixoIMC = imc !== undefined ? imc < 19.5 : false;
  const bfBaixo = bf !== undefined ? bf < 12 : false; // neutro (não depende de sexo aqui)
  const scoreMagro = (baixoIMC ? 1 : 0) + (muitoBaixoIMC ? 1 : 0) + (bfBaixo ? 1 : 0);

  let base = 0;
  if (obj === "hipertrofia") base = 300 + scoreMagro * 150;   // 300–750
  else if (obj === "manutencao") base = 150 + scoreMagro * 100; // 150–450
  else if (obj === "emagrecimento") base = 0 + scoreMagro * 50; // 0–150

  const kcal = clamp(Math.round(base), 0, 650);

  const motivo =
    obj === "hipertrofia"
      ? "Ectomorfo + objetivo de hipertrofia: ajuste fino para melhorar aderência e reduzir risco de déficit involuntário."
      : obj === "manutencao"
      ? "Ectomorfo: ajuste leve para estabilidade calórica e sustentabilidade do plano."
      : "Ectomorfo + emagrecimento: ajuste mínimo para preservar o déficit planejado.";

  return { kcal, motivo };
}


function mapFreqSemanalToFafMultiplier(freq?: string) {
  // Ajuste PREMIUM (leve) para refletir atividade semanal (NEAT/volume geral) SEM duplicar o nível de treino.
  // sedentario: 1.00 | 1-3x: 1.05 | 3-5x: 1.10 | +5x: 1.15
  switch (freq) {
    case "moderadamente_ativo": return 1.05;
    case "ativo": return 1.10;
    case "muito_ativo": return 1.15;
    case "sedentario":
    default: return 1.00;
  }
}

// Motor de Decisão Metabólica - DrMindSetfit
import type { PerfilUsuario, AvaliacaoFisica, EquacaoMetabolica, ResultadoMetabolico } from '@/types'

// Fator de Atividade Física (FAF)
const getFAF = (nivelTreino: string): number => {
  const faf: Record<string, number> = {
    sedentario: 1.2,
    iniciante: 1.375,
    intermediario: 1.55,
    avancado: 1.725,
    atleta: 1.9
  }
  return faf[nivelTreino] || 1.55
}

// Cunningham (baseado em massa magra)
export const calcularCunningham = (massaMagra: number): number => {
  return 500 + (22 * massaMagra)
}

// Harris-Benedict
export const calcularHarrisBenedict = (peso: number, altura: number, idade: number, sexo: string): number => {
  if (sexo === 'masculino') {
    return 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade)
  }
  return 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade)
}

// Mifflin-St Jeor
export const calcularMifflin = (peso: number, altura: number, idade: number, sexo: string): number => {
  if (sexo === 'masculino') {
    return (10 * peso) + (6.25 * altura) - (5 * idade) + 5
  }
  return (10 * peso) + (6.25 * altura) - (5 * idade) - 161
}

// FAO/WHO
export const calcularFaoWho = (peso: number, idade: number, sexo: string): number => {
  if (sexo === 'masculino') {
    if (idade < 30) return (15.3 * peso) + 679
    if (idade < 60) return (11.6 * peso) + 879
    return (13.5 * peso) + 487
  } else {
    if (idade < 30) return (14.7 * peso) + 496
    if (idade < 60) return (8.7 * peso) + 829
    return (10.5 * peso) + 596
  }
}

// Tinsley (para atletas)
export const calcularTinsley = (massaMagra: number): number => {
  return 25.9 * massaMagra + 284
}

// MOTOR DE DECISÃO INTELIGENTE
export const decidirEquacaoMetabolica = (
  perfil: PerfilUsuario,
  avaliacao: AvaliacaoFisica
): EquacaoMetabolica => {
  const temComposicao = avaliacao.composicao.percentualMassaMagra !== undefined
  const { nivelTreino, objetivo } = perfil

  // Atleta + composição corporal → Tinsley
  if (nivelTreino === 'atleta' && temComposicao) {
    return 'tinsley'
  }

  // Avançado/Intermediário + composição → Cunningham
  if ((nivelTreino === 'avancado' || nivelTreino === 'intermediario') && temComposicao) {
    return 'cunningham'
  }

  // Performance/Hipertrofia → Mifflin
  if (objetivo === 'performance' || objetivo === 'hipertrofia') {
    return 'mifflin'
  }

  // Longevidade/Sedentário → FAO/WHO
  if (objetivo === 'longevidade' || nivelTreino === 'sedentario') {
    return 'fao-who'
  }

  // Default: Mifflin (mais moderno e preciso)
  return 'mifflin'
}

// Justificativa da escolha
export const gerarJustificativa = (equacao: EquacaoMetabolica, perfil: PerfilUsuario): string => {
  const justificativas: Record<EquacaoMetabolica, string> = {
    cunningham: `Escolhida por você ${perfil.nivelTreino === 'avancado' ? 'treinar de forma avançada' : 'ter nível intermediário'} e possuir dados de composição corporal. A equação de Cunningham é mais precisa quando temos a massa magra real.`,

    'fao-who': `Recomendada pela Organização Mundial da Saúde para ${perfil.objetivo === 'longevidade' ? 'objetivos de saúde e longevidade' : 'iniciantes'}. É uma fórmula validada internacionalmente e considerada segura.`,

    'harris-benedict': `Equação clássica e amplamente utilizada. Apropriada para seu perfil atual.`,

    mifflin: `A equação de Mifflin-St Jeor é considerada a mais precisa para a população geral, especialmente para ${perfil.objetivo === 'hipertrofia' ? 'ganho de massa muscular' : 'melhoria de performance'}.`,

    tinsley: `Como você é atleta e temos seus dados de composição corporal, utilizamos a equação de Tinsley, desenvolvida especificamente para atletas de alto rendimento.`
  }

  return justificativas[equacao]
}

// Calcular metabolismo completo
export const calcularMetabolismo = (
  perfil: PerfilUsuario,
  avaliacao: AvaliacaoFisica
): ResultadoMetabolico => {
  const { peso, altura } = avaliacao
  const { idade, sexo, nivelTreino } = perfil

  const massaMagra = avaliacao.composicao.percentualMassaMagra
    ? peso * (avaliacao.composicao.percentualMassaMagra / 100)
    : peso * 0.75 // Estimativa conservadora

  // Decidir equação automaticamente
  const equacaoEscolhida = decidirEquacaoMetabolica(perfil, avaliacao)

  // Calcular TMB com a equação escolhida
  let tmb = 0
  switch (equacaoEscolhida) {
    case 'cunningham':
      tmb = calcularCunningham(massaMagra)
      break
    case 'fao-who':
      tmb = calcularFaoWho(peso, idade, sexo)
      break
    case 'harris-benedict':
      tmb = calcularHarrisBenedict(peso, altura, idade, sexo)
      break
    case 'mifflin':
      tmb = calcularMifflin(peso, altura, idade, sexo)
      break
    case 'tinsley':
      tmb = calcularTinsley(massaMagra)
      break
  }

  // GET = TMB × FAF
  const fafBase = getFAF(nivelTreino)
  const freqSemanal = (perfil as any)?.avaliacao?.frequenciaAtividadeSemanal as (string | undefined)
  const fafMult = mapFreqSemanalToFafMultiplier(freqSemanal)
  const faf = Math.min(2.4, Math.max(1.0, fafBase * fafMult));
  const fafFinal = faf;
  const get = tmb * fafFinal
  // Calorias alvo (baseado no objetivo)
  let caloriasAlvo = get
  if (perfil.objetivo === 'emagrecimento') {
    caloriasAlvo = get * 0.85 // déficit de 15%
  } else if (perfil.objetivo === 'hipertrofia') {
    caloriasAlvo = get * 1.1 // superávit de 10%
  }
  // Faixa segura
  let faixaSegura = {
    minimo: Math.round(caloriasAlvo * 0.90),
    ideal: Math.round(caloriasAlvo),
    maximo: Math.round(caloriasAlvo * 1.10)
  }

  // Ajuste por biotipo (premium, seguro e explicável)
  const biotipo = (perfil as any)?.avaliacao?.biotipo as ("ectomorfo"|"mesomorfo"|"endomorfo"|undefined);
  const imc = Number(peso) / Math.pow(Number(altura)/100, 2);
  // tentar BF% quando houver (bioimpedância), senão null
  const bfPct = (perfil as any)?.avaliacao?.bioPercentualGordura != null && String((perfil as any)?.avaliacao?.bioPercentualGordura) !== ''
    ? Number((perfil as any)?.avaliacao?.bioPercentualGordura)
    : null;
  const ajusteBio = calcAjusteBiotipoKcal({ biotipo, objetivo: (perfil as any)?.objetivo, imc, bfPct });
  const ajusteBiotipoKcal = ajusteBio.kcal;
  const ajusteBiotipoMotivo = ajusteBio.motivo;


  

  // aplica ajuste no alvo final + recalcula faixa segura
  caloriasAlvo = caloriasAlvo + (ajusteBiotipoKcal || 0);
  faixaSegura = {
    minimo: Math.round(caloriasAlvo * 0.90),
    ideal: Math.round(caloriasAlvo),
    maximo: Math.round(caloriasAlvo * 1.10)
  };

  // Comparativo com todas as fórmulas
  const comparativo = {
    cunningham: Math.round(calcularCunningham(massaMagra) * faf),
    faoWho: Math.round(calcularFaoWho(peso, idade, sexo) * faf),
    harrisBenedict: Math.round(calcularHarrisBenedict(peso, altura, idade, sexo) * faf),
    mifflin: Math.round(calcularMifflin(peso, altura, idade, sexo) * faf),
    tinsley: Math.round(calcularTinsley(massaMagra) * faf)
  }

  return {
    equacaoUtilizada: equacaoEscolhida,
    justificativa: gerarJustificativa(equacaoEscolhida, perfil),
    tmb: Math.round(tmb),
    fafBase: Number(fafBase.toFixed(2)),
    fafMult: Number(fafMult.toFixed(2)),
    fafFinal: Number(fafFinal.toFixed(2)),
    get: Math.round(get),
    caloriasAlvo: Math.round(caloriasAlvo),
    faixaSegura,
    comparativo,
    ajusteBiotipoKcal,
    ajusteBiotipoMotivo,
  }
}
