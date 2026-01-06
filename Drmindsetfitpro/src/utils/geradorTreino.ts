import type { DivisaoTreinoConfig, PlanejamentoTreino, TreinoDia, ExercicioTreino, Exercicio, PerfilUsuario, NivelTreino } from '@/types'

// Base de dados de exercícios
const EXERCICIOS_DB: Exercicio[] = [
  // PEITO
  { id: 'supino_reto', nome: 'Supino Reto com Barra', grupoMuscular: 'Peitoral', equipamento: 'Barra', descricao: 'Exercício composto principal para peitoral', substituicoes: ['Supino com Halteres', 'Supino Máquina', 'Flexão de Braço'] },
  { id: 'supino_inclinado', nome: 'Supino Inclinado', grupoMuscular: 'Peitoral Superior', equipamento: 'Barra/Halteres', descricao: 'Foco em peitoral superior', substituicoes: ['Supino Inclinado Halteres', 'Supino Smith Inclinado'] },
  { id: 'crucifixo_reto', nome: 'Crucifixo Reto', grupoMuscular: 'Peitoral', equipamento: 'Halteres', descricao: 'Isolamento peitoral', substituicoes: ['Crucifixo Máquina', 'Cross Over'] },
  { id: 'cross_over', nome: 'Cross Over', grupoMuscular: 'Peitoral', equipamento: 'Cabo', descricao: 'Isolamento com tensão constante', substituicoes: ['Crucifixo', 'Peck Deck'] },
  { id: 'mergulho', nome: 'Mergulho para Peito', grupoMuscular: 'Peitoral Inferior', equipamento: 'Paralelas', descricao: 'Peitoral inferior e tríceps', substituicoes: ['Supino Declinado', 'Cross Over Baixo'] },

  // COSTAS
  { id: 'barra_fixa', nome: 'Barra Fixa Pegada Aberta', grupoMuscular: 'Dorsal', equipamento: 'Barra Fixa', descricao: 'Melhor exercício para dorsal', substituicoes: ['Puxada Frontal', 'Puxada com Triângulo'] },
  { id: 'puxada_frontal', nome: 'Puxada Frontal', grupoMuscular: 'Dorsal', equipamento: 'Polia Alta', descricao: 'Largura do dorsal', substituicoes: ['Barra Fixa', 'Puxada Neutra'] },
  { id: 'remada_curvada', nome: 'Remada Curvada', grupoMuscular: 'Costas Média', equipamento: 'Barra', descricao: 'Espessura das costas', substituicoes: ['Remada Cavalinho', 'Remada com Halteres'] },
  { id: 'remada_cavalinho', nome: 'Remada Cavalinho', grupoMuscular: 'Costas Média', equipamento: 'Barra T', descricao: 'Desenvolvimento completo', substituicoes: ['Remada Curvada', 'Remada Máquina'] },
  { id: 'levantamento_terra', nome: 'Levantamento Terra', grupoMuscular: 'Lombar/Posterior', equipamento: 'Barra', descricao: 'Rei dos exercícios', substituicoes: ['Stiff', 'Hiperextensão'] },

  // PERNAS - QUADRÍCEPS
  { id: 'agachamento', nome: 'Agachamento Livre', grupoMuscular: 'Quadríceps', equipamento: 'Barra', descricao: 'Rei dos exercícios de perna', substituicoes: ['Leg Press 45°', 'Agachamento Smith'] },
  { id: 'leg_press', nome: 'Leg Press 45°', grupoMuscular: 'Quadríceps', equipamento: 'Máquina', descricao: 'Desenvolvimento completo', substituicoes: ['Agachamento', 'Hack Machine'] },
  { id: 'agachamento_bulgaro', nome: 'Agachamento Búlgaro', grupoMuscular: 'Quadríceps', equipamento: 'Halteres', descricao: 'Unilateral para correção', substituicoes: ['Afundo', 'Leg Press Unilateral'] },
  { id: 'cadeira_extensora', nome: 'Cadeira Extensora', grupoMuscular: 'Quadríceps', equipamento: 'Máquina', descricao: 'Isolamento de quadríceps', substituicoes: ['Sissy Squat', 'Afundo'] },

  // PERNAS - POSTERIOR
  { id: 'stiff', nome: 'Stiff', grupoMuscular: 'Posterior de Coxa', equipamento: 'Barra/Halteres', descricao: 'Posterior e glúteos', substituicoes: ['Mesa Flexora', 'Levantamento Terra'] },
  { id: 'mesa_flexora', nome: 'Mesa Flexora', grupoMuscular: 'Posterior de Coxa', equipamento: 'Máquina', descricao: 'Isolamento posterior', substituicoes: ['Cadeira Flexora', 'Stiff'] },
  { id: 'cadeira_adutora', nome: 'Cadeira Adutora', grupoMuscular: 'Adutores', equipamento: 'Máquina', descricao: 'Parte interna da coxa', substituicoes: ['Agachamento Sumô'] },
  { id: 'cadeira_abdutora', nome: 'Cadeira Abdutora', grupoMuscular: 'Abdutores', equipamento: 'Máquina', descricao: 'Parte externa da coxa', substituicoes: ['Elevação Lateral de Perna'] },

  // PANTURRILHA
  { id: 'panturrilha_em_pe', nome: 'Panturrilha em Pé', grupoMuscular: 'Panturrilha', equipamento: 'Máquina', descricao: 'Gastrocnêmio', substituicoes: ['Panturrilha no Leg Press', 'Panturrilha Livre'] },
  { id: 'panturrilha_sentado', nome: 'Panturrilha Sentado', grupoMuscular: 'Panturrilha', equipamento: 'Máquina', descricao: 'Sóleo', substituicoes: ['Panturrilha no Hack'] },

  // OMBROS
  { id: 'desenvolvimento_ombros', nome: 'Desenvolvimento com Barra', grupoMuscular: 'Ombros', equipamento: 'Barra', descricao: 'Deltoide completo', substituicoes: ['Desenvolvimento com Halteres', 'Desenvolvimento Máquina'] },
  { id: 'elevacao_lateral', nome: 'Elevação Lateral', grupoMuscular: 'Deltoide Lateral', equipamento: 'Halteres', descricao: 'Largura dos ombros', substituicoes: ['Elevação Lateral Cabo', 'Elevação Máquina'] },
  { id: 'elevacao_frontal', nome: 'Elevação Frontal', grupoMuscular: 'Deltoide Anterior', equipamento: 'Halteres/Barra', descricao: 'Anterior do ombro', substituicoes: ['Elevação Frontal Cabo', 'Arnold Press'] },
  { id: 'crucifixo_inverso', nome: 'Crucifixo Inverso', grupoMuscular: 'Deltoide Posterior', equipamento: 'Halteres', descricao: 'Posterior do ombro', substituicoes: ['Crucifixo Inverso Polia', 'Remada Alta Face Pull'] },
  { id: 'encolhimento', nome: 'Encolhimento', grupoMuscular: 'Trapézio', equipamento: 'Halteres/Barra', descricao: 'Desenvolvimento de trapézio', substituicoes: ['Encolhimento Smith', 'Remada Alta'] },

  // TRÍCEPS
  { id: 'triceps_testa', nome: 'Tríceps Testa', grupoMuscular: 'Tríceps', equipamento: 'Barra W', descricao: 'Porção longa', substituicoes: ['Tríceps Francês', 'Tríceps Polia'] },
  { id: 'triceps_corda', nome: 'Tríceps Corda', grupoMuscular: 'Tríceps', equipamento: 'Polia', descricao: 'Isolamento completo', substituicoes: ['Tríceps Barra Reta', 'Tríceps Unilateral'] },
  { id: 'triceps_paralela', nome: 'Tríceps Paralelas', grupoMuscular: 'Tríceps', equipamento: 'Paralelas', descricao: 'Composto para tríceps', substituicoes: ['Supino Fechado', 'Mergulho Assistido'] },
  { id: 'triceps_testa_halter', nome: 'Tríceps Testa Unilateral', grupoMuscular: 'Tríceps', equipamento: 'Halter', descricao: 'Correção de assimetrias', substituicoes: ['Tríceps Francês Unilateral', 'Kickback'] },

  // BÍCEPS
  { id: 'rosca_direta', nome: 'Rosca Direta Barra', grupoMuscular: 'Bíceps', equipamento: 'Barra W', descricao: 'Massa de bíceps', substituicoes: ['Rosca Direta Reta', 'Rosca Halteres'] },
  { id: 'rosca_alternada', nome: 'Rosca Alternada', grupoMuscular: 'Bíceps', equipamento: 'Halteres', descricao: 'Desenvolvimento completo', substituicoes: ['Rosca Direta', 'Rosca Martelo'] },
  { id: 'rosca_scott', nome: 'Rosca Scott', grupoMuscular: 'Bíceps', equipamento: 'Barra W', descricao: 'Isolamento de bíceps', substituicoes: ['Rosca Scott Halteres', 'Rosca Concentrada'] },
  { id: 'rosca_martelo', nome: 'Rosca Martelo', grupoMuscular: 'Bíceps/Antebraço', equipamento: 'Halteres', descricao: 'Braquial e antebraço', substituicoes: ['Rosca Inversa', 'Rosca Cruzada'] },

  // ABDÔMEN
  { id: 'abdominal_supra', nome: 'Abdominal Supra', grupoMuscular: 'Abdômen', equipamento: 'Solo', descricao: 'Porção superior', substituicoes: ['Abdominal na Polia', 'Abdominal Máquina'] },
  { id: 'abdominal_infra', nome: 'Elevação de Pernas', grupoMuscular: 'Abdômen Inferior', equipamento: 'Barra Fixa', descricao: 'Porção inferior', substituicoes: ['Elevação Joelhos', 'Abdominal Canivete'] },
  { id: 'prancha', nome: 'Prancha Isométrica', grupoMuscular: 'Core', equipamento: 'Solo', descricao: 'Estabilização do core', substituicoes: ['Prancha Lateral', 'Dead Bug'] },
]

// Função auxiliar para calcular volume baseado no nível e intensidade
function calcularVolume(nivelTreino: NivelTreino, intensidade: 'leve' | 'moderada' | 'intensa'): { series: number; repeticoes: string } {
  const baseVolume = {
    sedentario: { leve: 2, moderada: 3, intensa: 3 },
    iniciante: { leve: 3, moderada: 3, intensa: 4 },
    intermediario: { leve: 3, moderada: 4, intensa: 4 },
    avancado: { leve: 4, moderada: 4, intensa: 5 },
    atleta: { leve: 4, moderada: 5, intensa: 6 }
  }

  const series = baseVolume[nivelTreino][intensidade]

  // Repetições variam baseado no objetivo
  const repeticoes = intensidade === 'intensa' ? '6-10' : intensidade === 'moderada' ? '8-12' : '12-15'

  return { series, repeticoes }
}

// Função para buscar exercícios por grupo muscular
function buscarExercicios(grupoMuscular: string): Exercicio[] {
  return EXERCICIOS_DB.filter(ex => ex.grupoMuscular.toLowerCase().includes(grupoMuscular.toLowerCase()))
}

// Geradores específicos por divisão
function gerarTreinoABC(config: DivisaoTreinoConfig, perfil?: PerfilUsuario): TreinoDia[] {
  const nivelTreino = perfil?.nivelTreino || 'intermediario'
  const volume = calcularVolume(nivelTreino, config.intensidade)

  const treinoA: TreinoDia = {
    dia: 'Treino A - Peito + Tríceps',
    grupamentos: ['Peitoral', 'Tríceps'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'supino_reto')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'supino_inclinado')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'crucifixo_reto')!, series: volume.series - 1, repeticoes: '10-15', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'triceps_testa')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'triceps_corda')!, series: volume.series - 1, repeticoes: '12-15', descanso: 45 },
    ],
    volumeTotal: volume.series * 5 - 2
  }

  const treinoB: TreinoDia = {
    dia: 'Treino B - Costas + Bíceps',
    grupamentos: ['Costas', 'Dorsal', 'Bíceps'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'barra_fixa')!, series: volume.series, repeticoes: 'Máximo', descanso: 120 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'remada_curvada')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'puxada_frontal')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'rosca_direta')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'rosca_martelo')!, series: volume.series - 1, repeticoes: '12-15', descanso: 45 },
    ],
    volumeTotal: volume.series * 5 - 1
  }

  const treinoC: TreinoDia = {
    dia: 'Treino C - Pernas + Ombros',
    grupamentos: ['Quadríceps', 'Posterior', 'Ombros'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'agachamento')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 120 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'leg_press')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'stiff')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'desenvolvimento_ombros')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'elevacao_lateral')!, series: volume.series, repeticoes: '12-15', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'panturrilha_em_pe')!, series: volume.series, repeticoes: '15-20', descanso: 45 },
    ],
    volumeTotal: volume.series * 6
  }

  return [treinoA, treinoB, treinoC]
}

function gerarTreinoABCDE(config: DivisaoTreinoConfig, perfil?: PerfilUsuario): TreinoDia[] {
  const nivelTreino = perfil?.nivelTreino || 'avancado'
  const volume = calcularVolume(nivelTreino, config.intensidade)

  const treinoA: TreinoDia = {
    dia: 'Treino A - Peito',
    grupamentos: ['Peitoral'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'supino_reto')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'supino_inclinado')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'crucifixo_reto')!, series: volume.series, repeticoes: '10-15', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'cross_over')!, series: volume.series - 1, repeticoes: '12-15', descanso: 45 },
    ],
    volumeTotal: volume.series * 4 - 1
  }

  const treinoB: TreinoDia = {
    dia: 'Treino B - Costas',
    grupamentos: ['Costas', 'Dorsal'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'levantamento_terra')!, series: volume.series - 1, repeticoes: '6-8', descanso: 180 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'barra_fixa')!, series: volume.series, repeticoes: 'Máximo', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'remada_curvada')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'puxada_frontal')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
    ],
    volumeTotal: volume.series * 4 - 1
  }

  const treinoC: TreinoDia = {
    dia: 'Treino C - Pernas',
    grupamentos: ['Quadríceps', 'Posterior', 'Panturrilha'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'agachamento')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 120 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'leg_press')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'agachamento_bulgaro')!, series: volume.series - 1, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'stiff')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'mesa_flexora')!, series: volume.series - 1, repeticoes: '12-15', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'panturrilha_em_pe')!, series: volume.series, repeticoes: '15-20', descanso: 45 },
    ],
    volumeTotal: volume.series * 6 - 2
  }

  const treinoD: TreinoDia = {
    dia: 'Treino D - Ombros',
    grupamentos: ['Ombros', 'Trapézio'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'desenvolvimento_ombros')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'elevacao_lateral')!, series: volume.series, repeticoes: '12-15', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'elevacao_frontal')!, series: volume.series, repeticoes: '12-15', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'crucifixo_inverso')!, series: volume.series, repeticoes: '12-15', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'encolhimento')!, series: volume.series, repeticoes: '12-15', descanso: 60 },
    ],
    volumeTotal: volume.series * 5
  }

  const treinoE: TreinoDia = {
    dia: 'Treino E - Braços',
    grupamentos: ['Bíceps', 'Tríceps'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'rosca_direta')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'rosca_scott')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'rosca_martelo')!, series: volume.series - 1, repeticoes: '12-15', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'triceps_testa')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'triceps_corda')!, series: volume.series, repeticoes: '12-15', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'triceps_paralela')!, series: volume.series - 1, repeticoes: 'Máximo', descanso: 90 },
    ],
    volumeTotal: volume.series * 6 - 2
  }

  return [treinoA, treinoB, treinoC, treinoD, treinoE]
}

function gerarTreinoFullBody(config: DivisaoTreinoConfig, perfil?: PerfilUsuario): TreinoDia[] {
  const nivelTreino = perfil?.nivelTreino || 'iniciante'
  const volume = calcularVolume(nivelTreino, config.intensidade)

  // Full Body treina todos os grupos em cada sessão
  const treino: TreinoDia = {
    dia: 'Full Body - Corpo Completo',
    grupamentos: ['Peitoral', 'Costas', 'Pernas', 'Ombros', 'Braços'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'agachamento')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 120 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'supino_reto')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'remada_curvada')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'desenvolvimento_ombros')!, series: volume.series - 1, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'rosca_direta')!, series: volume.series - 1, repeticoes: '10-12', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'triceps_corda')!, series: volume.series - 1, repeticoes: '12-15', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'abdominal_supra')!, series: 3, repeticoes: '15-20', descanso: 30 },
    ],
    volumeTotal: (volume.series * 4) + (volume.series - 1) * 3 + 3
  }

  return [treino, treino, treino] // Mesmo treino 3x por semana
}

function gerarTreinoUpperLower(config: DivisaoTreinoConfig, perfil?: PerfilUsuario): TreinoDia[] {
  const nivelTreino = perfil?.nivelTreino || 'intermediario'
  const volume = calcularVolume(nivelTreino, config.intensidade)

  const treinoUpper: TreinoDia = {
    dia: 'Upper - Membros Superiores',
    grupamentos: ['Peitoral', 'Costas', 'Ombros', 'Braços'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'supino_reto')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'remada_curvada')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'supino_inclinado')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'puxada_frontal')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'desenvolvimento_ombros')!, series: volume.series - 1, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'rosca_direta')!, series: volume.series - 1, repeticoes: '10-12', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'triceps_corda')!, series: volume.series - 1, repeticoes: '12-15', descanso: 45 },
    ],
    volumeTotal: (volume.series * 5) + (volume.series - 1) * 2
  }

  const treinoLower: TreinoDia = {
    dia: 'Lower - Membros Inferiores',
    grupamentos: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'agachamento')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 120 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'stiff')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'leg_press')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'mesa_flexora')!, series: volume.series, repeticoes: '12-15', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'cadeira_extensora')!, series: volume.series, repeticoes: '12-15', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'panturrilha_em_pe')!, series: volume.series, repeticoes: '15-20', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'abdominal_supra')!, series: 3, repeticoes: '15-20', descanso: 30 },
    ],
    volumeTotal: (volume.series * 6) + 3
  }

  return [treinoUpper, treinoLower, treinoUpper, treinoLower]
}

function gerarTreinoPushPullLegs(config: DivisaoTreinoConfig, perfil?: PerfilUsuario): TreinoDia[] {
  const nivelTreino = perfil?.nivelTreino || 'avancado'
  const volume = calcularVolume(nivelTreino, config.intensidade)

  const treinoPush: TreinoDia = {
    dia: 'Push - Empurrar (Peito/Ombro/Tríceps)',
    grupamentos: ['Peitoral', 'Ombros', 'Tríceps'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'supino_reto')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'supino_inclinado')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'desenvolvimento_ombros')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'elevacao_lateral')!, series: volume.series, repeticoes: '12-15', descanso: 45 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'triceps_testa')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'triceps_corda')!, series: volume.series - 1, repeticoes: '12-15', descanso: 45 },
    ],
    volumeTotal: (volume.series * 5) + (volume.series - 1)
  }

  const treinoPull: TreinoDia = {
    dia: 'Pull - Puxar (Costas/Bíceps)',
    grupamentos: ['Costas', 'Dorsal', 'Bíceps'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'levantamento_terra')!, series: volume.series - 1, repeticoes: '6-8', descanso: 180 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'barra_fixa')!, series: volume.series, repeticoes: 'Máximo', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'remada_curvada')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'puxada_frontal')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'rosca_direta')!, series: volume.series, repeticoes: '10-12', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'rosca_martelo')!, series: volume.series - 1, repeticoes: '12-15', descanso: 45 },
    ],
    volumeTotal: (volume.series * 5) + (volume.series - 1) * 2
  }

  const treinoLegs: TreinoDia = {
    dia: 'Legs - Pernas Completo',
    grupamentos: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha'],
    exercicios: [
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'agachamento')!, series: volume.series, repeticoes: volume.repeticoes, descanso: 120 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'leg_press')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'stiff')!, series: volume.series, repeticoes: '10-12', descanso: 90 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'mesa_flexora')!, series: volume.series, repeticoes: '12-15', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'cadeira_extensora')!, series: volume.series, repeticoes: '12-15', descanso: 60 },
      { exercicio: EXERCICIOS_DB.find(e => e.id === 'panturrilha_em_pe')!, series: volume.series, repeticoes: '15-20', descanso: 45 },
    ],
    volumeTotal: volume.series * 6
  }

  return [treinoPush, treinoPull, treinoLegs]
}

// Função principal que gera o treino baseado na configuração
export function gerarTreinoPersonalizado(
  config: DivisaoTreinoConfig,
  perfil?: PerfilUsuario
): PlanejamentoTreino {
  let treinos: TreinoDia[] = []

  switch (config.tipo) {
    case 'ABC':
      treinos = gerarTreinoABC(config, perfil)
      break
    case 'ABCDE':
      treinos = gerarTreinoABCDE(config, perfil)
      break
    case 'FullBody':
      treinos = gerarTreinoFullBody(config, perfil)
      break
    case 'UpperLower':
      treinos = gerarTreinoUpperLower(config, perfil)
      break
    case 'PushPullLegs':
      treinos = gerarTreinoPushPullLegs(config, perfil)
      break
  }

  return {
    modalidade: perfil?.modalidadePrincipal || 'musculacao',
    divisao: config,
    divisaoSemanal: `${config.tipo} (${config.frequencia}x por semana)`,
    frequencia: config.frequencia,
    treinos,
    historicoCargas: []
  }
}
