// Tipos do DrMindSetfit - Sistema Inteligente de Saúde e Performance

export type SexoBiologico = 'masculino' | 'feminino'
export type NivelTreino = 'sedentario' | 'iniciante' | 'intermediario' | 'avancado' | 'atleta'
export type Modalidade = 'musculacao' | 'funcional' | 'corrida' | 'crossfit' | 'spinning'
export type Objetivo = 'emagrecimento' | 'reposicao' | 'hipertrofia' | 'performance' | 'longevidade'
export type MetodoComposicao = 'bioimpedancia' | 'pollock7' | 'nenhum'
export type EquacaoMetabolica = 'cunningham' | 'fao-who' | 'harris-benedict' | 'mifflin' | 'tinsley'
export type EstrategiaNutricional = 'deficit-leve' | 'deficit-moderado' | 'deficit-agressivo' | 'manutencao' | 'superavit'

// Etapa 1 - Perfil do Usuário
export interface PerfilUsuario {
  nomeCompleto: string
  sexo: SexoBiologico
  idade: number
  altura: number // cm
  pesoAtual: number // kg
  historicoPeso?: string
  nivelTreino: NivelTreino
  modalidadePrincipal: Modalidade
  frequenciaSemanal: number
  duracaoTreino: number // minutos
  objetivo: Objetivo
}

// Etapa 2 - Avaliação Física
export interface Circunferencias {
  cintura?: number
  quadril?: number
  abdomen?: number
  torax?: number
  gluteo?: number
  coxaDireitaRelax?: number
  coxaDireitaContra?: number
  coxaEsquerdaRelax?: number
  coxaEsquerdaContra?: number
  panturrilha?: number
  bracoDireitoRelax?: number
  bracoDireitoContra?: number
  bracoEsquerdoRelax?: number
  bracoEsquerdoContra?: number
}

export interface Pollock7Dobras {
  peitoral: number
  axilarMedia: number
  triceps: number
  subescapular: number
  abdominal: number
  supraIliaca: number
  coxa: number
}

export interface Bioimpedancia {
  percentualGordura: number
  percentualMassaMagra: number
  aguaCorporal: number
  idadeMetabolica: number
}

export interface ComposicaoCorporal {
  metodo: MetodoComposicao
  pollock7?: Pollock7Dobras
  bioimpedancia?: Bioimpedancia
  densidadeCorporal?: number
  percentualGordura?: number
  percentualMassaMagra?: number
}

export type Biotipo = 'ectomorfo' | 'mesomorfo' | 'endomorfo'

export interface AvaliacaoFisica {
  peso: number
  altura: number
  imc: number
  circunferencias: Circunferencias
  composicao: ComposicaoCorporal
  // Biotipo (Step 2)
  biotipo?: Biotipo

  // Atividade semanal (premium)
  frequenciaAtividadeSemanal?: 'sedentario' | 'moderadamente_ativo' | 'ativo' | 'muito_ativo';
}

// Etapa 3 - Metabolismo
export interface ResultadoMetabolico {
  equacaoUtilizada: EquacaoMetabolica
  justificativa: string
  tmb: number // Taxa Metabólica Basal
  get: number // Gasto Energético Total
  caloriasAlvo: number
  faixaSegura: {
    minimo: number
    ideal: number
    maximo: number
  }
  comparativo: {
    cunningham?: number
    faoWho?: number
    harrisBenedict?: number
    mifflin?: number
    tinsley?: number
  }
  // Ajustes opcionais (biotipo)
  biotipo?: Biotipo
  ajusteBiotipoKcal?: number

  // Auditoria premium do FAF (atividade semanal)
  fafBase?: number;
  fafMult?: number;
  fafFinal?: number;
}

// Etapa 4 - Planejamento Nutricional
export type Restricao = 'lactose' | 'gluten' | 'ovo' | 'acucar' | 'oleaginosas' | 'vegetariano' | 'vegano' | 'low-sodium' | 'diabetes'

export interface Macronutrientes {
  proteina: number // gramas
  gorduras: number // gramas
  carboidratos: number // gramas
  calorias: number
}

export interface AlimentoRefeicao {
  alimentoId: string
  nome: string
  gramas: number
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

export type TipoRefeicao = 'desjejum' | 'cafe-da-manha' | 'almoco' | 'lanche-tarde' | 'jantar' | 'ceia'

export interface Refeicao {
  tipo: TipoRefeicao
  horario: string
  nome: string
  alimentos: AlimentoRefeicao[]
}

export interface PlanejamentoNutricional {
  estrategia: EstrategiaNutricional
  restricoes: Restricao[]
  macros: Macronutrientes
  refeicoesSelecionadas: TipoRefeicao[]
  refeicoes: Refeicao[]
}

// Etapa 5 - Treinamento
export interface Exercicio {
  id: string
  nome: string
  grupoMuscular: string
  equipamento: string
  descricao: string
  substituicoes: string[]
}

export interface ExercicioTreino {
  exercicio: Exercicio
  series: number
  repeticoes: string
  descanso: number // segundos
  carga?: number
  observacoes?: string
}

export interface TreinoDia {
  dia: string
  grupamentos: string[]
  exercicios: ExercicioTreino[]
  volumeTotal: number
}

export type DivisaoTreino = 'ABC' | 'ABCDE' | 'FullBody' | 'UpperLower' | 'PushPullLegs'

export interface DivisaoTreinoConfig {
  tipo: DivisaoTreino
  frequencia: number // dias por semana
  diasSelecionados: string[] // segunda, terça, etc
  intensidade: 'leve' | 'moderada' | 'intensa'
}

export interface PlanejamentoTreino {
  modalidade: Modalidade
  divisao: DivisaoTreinoConfig
  divisaoSemanal: string // descrição legível
  frequencia: number
  treinos: TreinoDia[]
  historicoCargas: RegistroCarga[]
}

export interface RegistroCarga {
  data: string
  exercicioId: string
  exercicioNome: string
  cargaTotal: number // soma de todas as séries
  detalhes: {
    serie: number
    carga: number
    repeticoes: number
  }[]
}

// Etapa 6 - Saúde e Contexto Clínico
export type DorArticular = 'joelho' | 'ombro' | 'cotovelo' | 'punho' | 'tornozelo' | 'lombar' | 'cervical'

export interface SaudeContexto {
  doresArticulares: DorArticular[]
  limitacoesFisicas: string[]
  observacoesClinicas: string
  historicoLesoes: string
}

// Etapa 7 - Acompanhamento
export interface RegistroEvolucao {
  data: string
  peso: number
  circunferencias?: Partial<Circunferencias>
  observacoes: string
  fotos?: string[]
}

export interface Acompanhamento {
  registros: RegistroEvolucao[]
  tendenciaMetabolica: string
  ajustesSugeridos: string[]
}

// Dashboard e Tracking
export interface PassosDia {
  data: string // YYYY-MM-DD
  passos: number
  horaInicio: string // HH:MM
  horaFim: string // HH:MM
  distancia: number // km
  calorias: number
}

export interface ConsumoCaloriaDia {
  data: string // YYYY-MM-DD
  consumido: number
  meta: number
  refeicoes: {
    nome: string
    calorias: number
    hora: string
  }[]
}

// Running Module
export interface PontoGPS {
  latitude: number
  longitude: number
  altitude: number
  timestamp: number
}

export interface CorridaRegistro {
  id: string
  data: string
  dataTimestamp: number
  distancia: number // km
  duracao: number // segundos
  pace: string // min/km
  paceMedia: number // segundos por km
  velocidadeMedia: number // km/h
  calorias: number
  elevacaoGanho: number // metros
  elevacaoPerda: number // metros
  trajeto: PontoGPS[]
  pausas: number
  clima?: string
  temperatura?: number
  sensacao?: 'muito_facil' | 'facil' | 'moderado' | 'dificil' | 'muito_dificil'
}

export interface RunningStats {
  totalCorridas: number
  distanciaTotal: number
  tempoTotal: number
  melhorPace: string
  melhorDistancia: number
  corridasPorMes: { mes: string; total: number }[]
}

// Planos Ativos - Dieta e Treino com Período Fixo
export interface PlanoAtivoPeriodo {
  dataInicio: string // YYYY-MM-DD
  dataFim: string // YYYY-MM-DD
  duracaoSemanas: number
  estrategia: string // ex: "4 semanas", "8 semanas"
}

export interface DietaAtiva extends PlanoAtivoPeriodo {
  nutricao: PlanejamentoNutricional
}

export interface CargaSerie {
  exercicioId: string
  dia: string // ex: "Treino A", "Segunda"
  serie: number // 1, 2, 3...
  carga: number // kg
  data: string // última vez que foi editado YYYY-MM-DD
}

export interface TreinoAtivo extends PlanoAtivoPeriodo {
  treino: PlanejamentoTreino
  cargasPorSerie: CargaSerie[] // histórico de cargas por série individual
}

// Estado Global da Aplicação
export interface DrMindSetfitState {
  etapaAtual: number
  perfil?: PerfilUsuario
  avaliacao?: AvaliacaoFisica
  metabolismo?: ResultadoMetabolico
  nutricao?: PlanejamentoNutricional
  treino?: PlanejamentoTreino
  saude?: SaudeContexto
  acompanhamento?: Acompanhamento
  concluido: boolean

  // Tracking diário
  passosDiarios: PassosDia[]
  consumoCalorias: ConsumoCaloriaDia[]

  // Running
  corridas: CorridaRegistro[]
  runningStats?: RunningStats

  // Planos Ativos (novo)
  dietaAtiva?: DietaAtiva
  treinoAtivo?: TreinoAtivo
}
export type FrequenciaAtividadeSemanal = 'sedentario' | 'moderadamente_ativo' | 'ativo' | 'muito_ativo';

