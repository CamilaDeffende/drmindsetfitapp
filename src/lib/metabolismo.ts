
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
  const faf = Math.min(2.4, Math.max(1.0, fafBase * fafMult))
  const get = tmb * faf
  // Calorias alvo (baseado no objetivo)
  let caloriasAlvo = get
  if (perfil.objetivo === 'emagrecimento') {
    caloriasAlvo = get * 0.85 // déficit de 15%
  } else if (perfil.objetivo === 'hipertrofia') {
    caloriasAlvo = get * 1.1 // superávit de 10%
  }

  // Faixa segura
  const faixaSegura = {
    minimo: Math.round(caloriasAlvo * 0.90),
    ideal: Math.round(caloriasAlvo),
    maximo: Math.round(caloriasAlvo * 1.10)
  }

  // Ajuste por biotipo (heurística premium)
  // - Ectomorfo: tende a perder peso com mais facilidade -> adiciona base de +600 kcal (faixa 500–700)
  // - Mesomorfo/Endomorfo: mantém calorias do metabolismo (0)
  // Obs: biotipo é autoavaliação e serve como ajuste fino, não substitui composição corporal.
  const biotipo = (perfil as any)?.avaliacao?.biotipo as ("ectomorfo"|"mesomorfo"|"endomorfo"|undefined);
  const ajusteBiotipoKcal = biotipo === "ectomorfo" ? 600 : 0;


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
    get: Math.round(get),
    caloriasAlvo: Math.round(caloriasAlvo),
    faixaSegura,
    comparativo,
    ajusteBiotipoKcal,
  }
}
