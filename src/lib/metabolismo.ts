// Helpers locais
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
  if (biotipo !== "ectomorfo")
    return { kcal: 0, motivo: "Sem ajuste de biotipo." };

  const obj = params.objetivo ?? "manutencao";
  const imc =
    typeof params.imc === "number" && Number.isFinite(params.imc)
      ? params.imc
      : undefined;
  const bf =
    typeof params.bfPct === "number" && Number.isFinite(params.bfPct)
      ? params.bfPct
      : undefined;

  const baixoIMC = imc !== undefined ? imc < 21.0 : false;
  const muitoBaixoIMC = imc !== undefined ? imc < 19.5 : false;
  const bfBaixo = bf !== undefined ? bf < 12 : false;

  const scoreMagro =
    (baixoIMC ? 1 : 0) + (muitoBaixoIMC ? 1 : 0) + (bfBaixo ? 1 : 0);

  let base = 0;
  if (obj === "hipertrofia") base = 300 + scoreMagro * 150; // 300–750
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

// ============================
// Motor de Decisão Metabólica
// ============================
import type {
  PerfilUsuario,
  AvaliacaoFisica,
  EquacaoMetabolica,
  ResultadoMetabolico,
} from "@/types";

// BLOCO 1: multiplicador por frequência semanal (atividade real)
const getWeeklyActivityMultiplier = (freq?: string): number => {
  switch (String(freq || "").toLowerCase()) {
    case "sedentario":
      return 1.2;
    case "moderadamente_ativo":
      return 1.375;
    case "ativo":
      return 1.55;
    case "muito_ativo":
      return 1.725;
    default:
      return 1.375;
  }
};

// Fator de Atividade Física (FAF) por nível de treino
const getFAF = (nivelTreino: string): number => {
  const faf: Record<string, number> = {
    sedentario: 1.2,
    iniciante: 1.375,
    intermediario: 1.55,
    avancado: 1.725,
    atleta: 1.9,
  };
  return faf[nivelTreino] || 1.55;
};

// Cunningham (baseado em massa magra)
export const calcularCunningham = (massaMagra: number): number => {
  return 500 + 22 * massaMagra;
};

// Harris-Benedict
export const calcularHarrisBenedict = (
  peso: number,
  altura: number,
  idade: number,
  sexo: string
): number => {
  if (sexo === "masculino") {
    return 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * idade;
  }
  return 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * idade;
};

// Mifflin-St Jeor
export const calcularMifflin = (
  peso: number,
  altura: number,
  idade: number,
  sexo: string
): number => {
  if (sexo === "masculino") {
    return 10 * peso + 6.25 * altura - 5 * idade + 5;
  }
  return 10 * peso + 6.25 * altura - 5 * idade - 161;
};

// FAO/WHO
export const calcularFaoWho = (
  peso: number,
  idade: number,
  sexo: string
): number => {
  if (sexo === "masculino") {
    if (idade < 30) return 15.3 * peso + 679;
    if (idade < 60) return 11.6 * peso + 879;
    return 13.5 * peso + 487;
  } else {
    if (idade < 30) return 14.7 * peso + 496;
    if (idade < 60) return 8.7 * peso + 829;
    return 10.5 * peso + 596;
  }
};

// Tinsley (atletas)
export const calcularTinsley = (massaMagra: number): number => {
  return 25.9 * massaMagra + 284;
};

// ==================================
// MOTOR DE DECISÃO (robusto / seguro)
// ==================================
export const decidirEquacaoMetabolica = (
  perfil: PerfilUsuario,
  avaliacao: AvaliacaoFisica
): EquacaoMetabolica => {
  const p: any = perfil ?? {};
  const a: any = avaliacao ?? {};

  const comp = a.composicao ?? {};
  const temComposicao =
    comp &&
    (comp.percentualMassaMagra != null || comp.massaMagraKg != null);

  const nivelTreino: string = p.nivelTreino ?? "iniciante";
  const objetivo: string = p.objetivo ?? "manutencao";

  // Atleta + composição corporal → Tinsley
  if (nivelTreino === "atleta" && temComposicao) {
    return "tinsley";
  }

  // Avançado/Intermediário + composição → Cunningham
  if (
    (nivelTreino === "avancado" || nivelTreino === "intermediario") &&
    temComposicao
  ) {
    return "cunningham";
  }

  // Performance/Hipertrofia → Mifflin
  if (objetivo === "performance" || objetivo === "hipertrofia") {
    return "mifflin";
  }

  // Longevidade/Sedentário → FAO/WHO
  if (objetivo === "longevidade" || nivelTreino === "sedentario") {
    return "fao-who";
  }

  // Default: Mifflin (mais moderno)
  return "mifflin";
};

// Justificativa da escolha
export const gerarJustificativa = (
  equacao: EquacaoMetabolica,
  perfil: PerfilUsuario
): string => {
  const p: any = perfil ?? {};
  const justificativas: Record<EquacaoMetabolica, string> = {
    cunningham: `Escolhida por você ${p.nivelTreino === "avancado" ? "treinar de forma avançada" : "ter nível intermediário"} e possuir (ou estimar) composição corporal. A equação de Cunningham é mais precisa quando temos a massa magra real.`,

    "fao-who": `Recomendada pela Organização Mundial da Saúde para ${
      p.objetivo === "longevidade"
        ? "objetivos de saúde e longevidade"
        : "perfis mais iniciantes/sedentários"
    }. É uma fórmula validada internacionalmente e considerada segura.`,

    "harris-benedict":
      "Equação clássica e amplamente utilizada. Apropriada para seu perfil atual.",

    mifflin:
      "A equação de Mifflin-St Jeor é considerada uma das mais precisas para a população geral, especialmente em contextos de peso corporal e composição típicos.",

    tinsley:
      "Como você é tratado como atleta e há dados (ou estimativa) de composição corporal, utilizamos a equação de Tinsley, desenvolvida para atletas de alto rendimento.",
  };

  return justificativas[equacao];
};

// ==================================
// Cálculo principal (robusto / safe)
// ==================================
export const calcularMetabolismo = (
  perfil: PerfilUsuario,
  avaliacao: AvaliacaoFisica
): ResultadoMetabolico => {
  const p: any = perfil ?? {};
  const a: any = avaliacao ?? {};
  const comp: any = a.composicao ?? {};

  // Valores básicos com defaults seguros
  const peso: number = Number(a.peso ?? p.peso ?? 70);
  const altura: number = Number(a.altura ?? p.altura ?? 170);
  const idade: number = Number(p.idade ?? a.idade ?? 30);
  const sexo: string = (p.sexo ?? a.sexo ?? "masculino") as string;
  const nivelTreino: string = p.nivelTreino ?? "iniciante";

  // Massa magra: tenta usar massaMagraKg ou percentualMassaMagra, senão estimativa
  const massaMagraKgRaw = comp.massaMagraKg;
  const percMMRaw = comp.percentualMassaMagra;

  let massaMagra: number;
  if (Number.isFinite(Number(massaMagraKgRaw))) {
    massaMagra = Number(massaMagraKgRaw);
  } else if (Number.isFinite(Number(percMMRaw))) {
    massaMagra = peso * (Number(percMMRaw) / 100);
  } else {
    massaMagra = peso * 0.75; // estimativa conservadora
  }

  // Decidir equação automaticamente
  const equacaoEscolhida = decidirEquacaoMetabolica(p as any, a as any);

  // Calcular TMB com a equação escolhida
  let tmb = 0;
  switch (equacaoEscolhida) {
    case "cunningham":
      tmb = calcularCunningham(massaMagra);
      break;
    case "fao-who":
      tmb = calcularFaoWho(peso, idade, sexo);
      break;
    case "harris-benedict":
      tmb = calcularHarrisBenedict(peso, altura, idade, sexo);
      break;
    case "mifflin":
      tmb = calcularMifflin(peso, altura, idade, sexo);
      break;
    case "tinsley":
      tmb = calcularTinsley(massaMagra);
      break;
  }

  // FAF (base) + multiplicador por frequência semanal
  const fafBase = getFAF(nivelTreino);
  const freqSemanal: string | undefined =
    a.frequenciaAtividadeSemanal ??
    p.frequenciaAtividadeSemanal ??
    p.nivelAtividadeSemanal;
  const fafMult = getWeeklyActivityMultiplier(freqSemanal);
  const fafFinal = Math.min(2.4, Math.max(1.0, fafBase * fafMult));
  const faf = fafFinal;

  const get = tmb * fafFinal;

  // Calorias alvo (baseado no objetivo)
  const objetivo: string = p.objetivo ?? "manutencao";
  let caloriasAlvo = get;
  if (objetivo === "emagrecimento") {
    caloriasAlvo = get * 0.85; // déficit ~15%
  } else if (objetivo === "hipertrofia") {
    caloriasAlvo = get * 1.1; // superávit ~10%
  }

  // IMC para ajuste de biotipo
  const alturaM = altura > 0 ? altura / 100 : 1.7;
  const imc = peso / (alturaM * alturaM);

  // Biotipo + BF%
  const biotipo: string | undefined =
    a.biotipo ?? p.biotipo ?? undefined;

  const bfRaw =
    comp.percentualGordura ?? a.bioPercentualGordura ?? null;
  const bfPct =
    bfRaw != null && bfRaw !== ""
      ? Number(bfRaw)
      : null;

  const ajusteBio = calcAjusteBiotipoKcal({
    biotipo,
    objetivo,
    imc,
    bfPct,
  });
  const ajusteBiotipoKcal = ajusteBio.kcal;
  const ajusteBiotipoMotivo = ajusteBio.motivo;

  // aplica ajuste no alvo final + faixa segura
  caloriasAlvo = caloriasAlvo + (ajusteBiotipoKcal || 0);
  const faixaSegura = {
    minimo: Math.round(caloriasAlvo * 0.9),
    ideal: Math.round(caloriasAlvo),
    maximo: Math.round(caloriasAlvo * 1.1),
  };

  // Comparativo com todas as fórmulas (usando mesmo FAF final)
  const comparativo = {
    cunningham: Math.round(calcularCunningham(massaMagra) * faf),
    faoWho: Math.round(calcularFaoWho(peso, idade, sexo) * faf),
    harrisBenedict: Math.round(
      calcularHarrisBenedict(peso, altura, idade, sexo) * faf
    ),
    mifflin: Math.round(calcularMifflin(peso, altura, idade, sexo) * faf),
    tinsley: Math.round(calcularTinsley(massaMagra) * faf),
  };

  return {
    equacaoUtilizada: equacaoEscolhida,
    justificativa: gerarJustificativa(equacaoEscolhida, p as any),
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
  };
};