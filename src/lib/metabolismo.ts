// ===============================
// Helpers gerais
// ===============================
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
  // Por enquanto só ajustamos ectomorfo
  if (biotipo !== "ectomorfo") {
    return { kcal: 0, motivo: "Sem ajuste de biotipo." };
  }

  const obj = params.objetivo ?? "manutencao";
  const imc = Number.isFinite(params.imc as any)
    ? (params.imc as number)
    : undefined;
  const bf = Number.isFinite(params.bfPct as any)
    ? (params.bfPct as number)
    : undefined;

  // Indicador simples de "magração"
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

// ===============================
// Tipos do app
// ===============================
import type {
  PerfilUsuario,
  AvaliacaoFisica,
  EquacaoMetabolica,
  ResultadoMetabolico,
} from "@/types";

// ===============================
// FAF / Atividade
// ===============================

// BLOCO 1 (Premium): multiplicador por frequência semanal (atividade real)
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
      // quando não informado, não mexe tanto no FAF base
      return 1.0;
  }
};

// FAF baseado no nível de treino declarado no perfil
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

// ===============================
// Equações de TMB
// ===============================

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

// Tinsley (para atletas)
export const calcularTinsley = (massaMagra: number): number => {
  return 25.9 * massaMagra + 284;
};

// ===============================
// Motor de decisão da equação
// ===============================
export const decidirEquacaoMetabolica = (
  perfil: PerfilUsuario,
  avaliacao: AvaliacaoFisica
): EquacaoMetabolica => {
  const safePerfil = (perfil ?? {}) as any;
  const safeAval = (avaliacao ?? {}) as any;
  const composicao = (safeAval.composicao ?? {}) as any;
  const temComposicao =
    composicao.percentualMassaMagra !== undefined &&
    composicao.percentualMassaMagra !== null;

  const nivelTreino = safePerfil.nivelTreino ?? "iniciante";
  const objetivo = safePerfil.objetivo ?? "manutencao";

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

  // Default: Mifflin (mais moderno e preciso)
  return "mifflin";
};

// Justificativa da escolha da equação
export const gerarJustificativa = (
  equacao: EquacaoMetabolica,
  perfil: PerfilUsuario
): string => {
  const justificativas: Record<EquacaoMetabolica, string> = {
    cunningham: `Escolhida por você ${
      perfil.nivelTreino === "avancado"
        ? "treinar de forma avançada"
        : "ter nível intermediário"
    } e possuir dados de composição corporal. A equação de Cunningham é mais precisa quando temos a massa magra real.`,

    "fao-who": `Recomendada pela Organização Mundial da Saúde para ${
      perfil.objetivo === "longevidade"
        ? "objetivos de saúde e longevidade"
        : "iniciantes"
    }. É uma fórmula validada internacionalmente e considerada segura.`,

    "harris-benedict":
      "Equação clássica e amplamente utilizada. Apropriada para seu perfil atual.",

    mifflin: `A equação de Mifflin-St Jeor é considerada a mais precisa para a população geral, especialmente para ${
      perfil.objetivo === "hipertrofia"
        ? "ganho de massa muscular"
        : "melhoria de performance"
    }.`,

    tinsley:
      "Como você é atleta e temos seus dados de composição corporal, utilizamos a equação de Tinsley, desenvolvida especificamente para atletas de alto rendimento.",
  };

  return justificativas[equacao];
};

// ===============================
// Cálculo completo do metabolismo
// ===============================
export const calcularMetabolismo = (
  perfilRaw: PerfilUsuario,
  avaliacaoRaw: AvaliacaoFisica
): ResultadoMetabolico => {
  const perfil = (perfilRaw ?? {}) as any;
  const avaliacao = (avaliacaoRaw ?? {}) as any;

  // ===== Validações obrigatórias (sem valores iniciais fictícios) =====
  if (!avaliacao || avaliacao.peso == null || avaliacao.peso === "") {
    throw new Error("Peso não informado.");
  }
  if (!avaliacao.altura && avaliacao.altura !== 0) {
    throw new Error("Altura não informada.");
  }
  if (!perfil.idade && perfil.idade !== 0) {
    throw new Error("Idade não informada.");
  }
  if (!perfil.sexo) {
    throw new Error("Sexo não informado. Informe masculino ou feminino.");
  }

  const peso = Number(avaliacao.peso);
  const altura = Number(avaliacao.altura);
  const idade = Number(perfil.idade);
  const sexo = perfil.sexo as string;

  if (!Number.isFinite(peso) || peso <= 0) {
    throw new Error("Peso inválido.");
  }
  if (!Number.isFinite(altura) || altura <= 0) {
    throw new Error("Altura inválida.");
  }
  if (!Number.isFinite(idade) || idade <= 0) {
    throw new Error("Idade inválida.");
  }
  if (sexo !== "masculino" && sexo !== "feminino") {
    throw new Error("Sexo inválido. Use 'masculino' ou 'feminino'.");
  }

  // Opcional: se não tiver nível de treino, cai em iniciante
  const nivelTreino = (perfil.nivelTreino ?? "iniciante") as string;

  const composicao = (avaliacao.composicao ?? {}) as any;
  const percentualMM =
    typeof composicao.percentualMassaMagra === "number"
      ? composicao.percentualMassaMagra
      : undefined;

  const massaMagra =
    typeof percentualMM === "number"
      ? peso * (percentualMM / 100)
      : peso * 0.75; // Estimativa conservadora se não tiver composição

  // Decidir equação automaticamente
  const equacaoEscolhida = decidirEquacaoMetabolica(perfil, avaliacao);

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

  // ===============================
  // FAF / GET
  // ===============================
  const fafBase = getFAF(nivelTreino);

  const freqSemanal = (avaliacao as any)
    ?.frequenciaAtividadeSemanal as string | undefined;
  const fafMult = getWeeklyActivityMultiplier(freqSemanal);

  // Limitamos FAF final entre 1.0 e 2.4 (segurança)
  const fafFinal = clamp(fafBase * fafMult, 1.0, 2.4);
  const faf = fafFinal;

  // GET = TMB × FAF
  const get = tmb * fafFinal;

  // ===============================
  // Calorias alvo (baseado no objetivo)
  // ===============================
  const objetivo = (perfil.objetivo ?? "manutencao") as string;

  let caloriasAlvo = get;
  if (objetivo === "emagrecimento") {
    caloriasAlvo = get * 0.85; // déficit de 15%
  } else if (objetivo === "hipertrofia") {
    caloriasAlvo = get * 1.1; // superávit de 10%
  }

  // ===============================
  // Faixa segura (mínimo / ideal / máximo)
  // ===============================
  let faixaSegura = {
    minimo: Math.round(caloriasAlvo * 0.9),
    ideal: Math.round(caloriasAlvo),
    maximo: Math.round(caloriasAlvo * 1.1),
  };

  // ===============================
  // Ajuste por biotipo (premium, seguro, explicável)
  // ===============================
  const biotipo =
    (avaliacao as any)?.biotipo ?? (perfil as any)?.biotipo ?? undefined;

  const alturaM = altura > 0 ? altura / 100 : 1.7;
  const imc = peso / Math.pow(alturaM, 2);

  const bfPct =
    (avaliacao as any)?.bioPercentualGordura != null &&
    String((avaliacao as any)?.bioPercentualGordura) !== ""
      ? Number((avaliacao as any)?.bioPercentualGordura)
      : null;

  const ajusteBio = calcAjusteBiotipoKcal({
    biotipo,
    objetivo,
    imc,
    bfPct,
  });

  const ajusteBiotipoKcal = ajusteBio.kcal;
  const ajusteBiotipoMotivo = ajusteBio.motivo;

  // Aplica ajuste no alvo final + recalcula faixa segura
  caloriasAlvo = caloriasAlvo + (ajusteBiotipoKcal || 0);
  faixaSegura = {
    minimo: Math.round(caloriasAlvo * 0.9),
    ideal: Math.round(caloriasAlvo),
    maximo: Math.round(caloriasAlvo * 1.1),
  };

  // ===============================
  // Comparativo entre equações (já com FAF final aplicado)
  // ===============================
  const comparativo = {
    cunningham: Math.round(calcularCunningham(massaMagra) * faf),
    faoWho: Math.round(calcularFaoWho(peso, idade, sexo) * faf),
    harrisBenedict: Math.round(
      calcularHarrisBenedict(peso, altura, idade, sexo) * faf
    ),
    mifflin: Math.round(calcularMifflin(peso, altura, idade, sexo) * faf),
    tinsley: Math.round(calcularTinsley(massaMagra) * faf),
  };

  // Nivel de atividade "semana" para o Step3 mostrar no badge
  const nivelAtividadeSemanal: string =
    freqSemanal || nivelTreino || "moderadamente_ativo";

  const resultado: ResultadoMetabolico = {
    equacaoUtilizada: equacaoEscolhida,
    justificativa: gerarJustificativa(equacaoEscolhida, perfil),

    tmb: Math.round(tmb),
    get: Math.round(get),
    caloriasAlvo: Math.round(caloriasAlvo),

    // usados no card "Detalhes do cálculo (premium)" do Step3
    fafBase: Number(fafBase.toFixed(2)),
    fafMult: Number(fafMult.toFixed(2)),
    fafFinal: Number(fafFinal.toFixed(2)),

    faixaSegura,
    comparativo,
    ajusteBiotipoKcal,
    ajusteBiotipoMotivo,

    // campo extra para o Step3 mostrar label de frequência
    // (não quebra nada em outros lugares)
    nivelAtividadeSemanal,
  } as any;

  return resultado;
};