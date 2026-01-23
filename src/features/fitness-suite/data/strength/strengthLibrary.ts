import type { StrengthExercise } from "./strengthTypes";

/**
 * Biblioteca base (expansível).
 * - IDs determinísticos (slug)
 * - biomechLevel obrigatório
 * - agrupamento por músculo e tipo de execução
 *
 * Regra crítica (será aplicada no engine):
 * - iniciante NUNCA recebe biomechLevel "avancado"
 */
export const STRENGTH_LIBRARY: StrengthExercise[] = [
  // =========================
  // PEITO
  // =========================
  {
    id: "supino-reto-barra",
    name: "Supino reto (barra)",
    group: "peito",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["peitoral maior"],
    secondaryMuscles: ["tríceps", "deltoide anterior"],
    equipment: ["barra", "banco", "anilhas"],
    cues: ["escápulas retraídas", "pés firmes no chão", "controle na descida"],
    commonMistakes: ["cotovelos muito abertos", "quicar a barra no peito"],
    requiresSpotter: true,
    compound: true,
  },
  {
    id: "supino-reto-halter",
    name: "Supino reto (halteres)",
    group: "peito",
    executionType: "peso_livre",
    biomechLevel: "basico",
    primaryMuscles: ["peitoral maior"],
    secondaryMuscles: ["tríceps", "deltoide anterior"],
    equipment: ["halter", "banco"],
    cues: ["amplitude confortável", "punhos neutros", "controle excêntrico"],
    compound: true,
  },
  {
    id: "supino-inclinado-halter",
    name: "Supino inclinado (halteres)",
    group: "peito",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["peitoral maior (porção clavicular)"],
    secondaryMuscles: ["tríceps", "deltoide anterior"],
    equipment: ["halter", "banco"],
    cues: ["inclinação moderada", "controle na descida"],
    compound: true,
  },
  {
    id: "crucifixo-halter",
    name: "Crucifixo (halteres)",
    group: "peito",
    executionType: "peso_livre",
    biomechLevel: "basico",
    primaryMuscles: ["peitoral maior"],
    secondaryMuscles: ["deltoide anterior"],
    equipment: ["halter", "banco"],
    cues: ["leve flexão de cotovelos", "abraçando o banco", "controle"],
  },
  {
    id: "peck-deck",
    name: "Peck-deck (máquina)",
    group: "peito",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["peitoral maior"],
    equipment: ["maquina"],
    cues: ["peito aberto", "controle na volta", "não perder tensão"],
  },
  {
    id: "crossover-cabo",
    name: "Crossover (cabo)",
    group: "peito",
    executionType: "maquina",
    biomechLevel: "intermediario",
    primaryMuscles: ["peitoral maior"],
    secondaryMuscles: ["deltoide anterior"],
    equipment: ["cabo"],
    cues: ["tronco estável", "mãos se encontram à frente do peito", "controle"],
  },

  // =========================
  // COSTAS
  // =========================
  {
    id: "remada-curvada-barra",
    name: "Remada curvada (barra)",
    group: "costas",
    executionType: "peso_livre",
    biomechLevel: "avancado",
    primaryMuscles: ["grande dorsal", "romboides"],
    secondaryMuscles: ["bíceps", "eretores da espinha"],
    equipment: ["barra", "anilhas"],
    cues: ["coluna neutra", "quadril firme", "puxar com as costas"],
    commonMistakes: ["roubar com lombar", "arredondar coluna"],
    compound: true,
  },
  {
    id: "remada-unilateral-halter",
    name: "Remada unilateral (halter)",
    group: "costas",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["grande dorsal"],
    secondaryMuscles: ["bíceps", "romboides"],
    equipment: ["halter", "banco"],
    cues: ["cotovelo rumo ao quadril", "escápula trabalha junto", "controle"],
    unilateral: true,
    compound: true,
  },
  {
    id: "puxada-frontal",
    name: "Puxada frontal (máquina)",
    group: "costas",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["grande dorsal"],
    secondaryMuscles: ["bíceps"],
    equipment: ["maquina"],
    cues: ["peito alto", "puxar cotovelos para baixo", "controle na volta"],
    compound: true,
  },
  {
    id: "barra-fixa",
    name: "Barra fixa (peso corporal)",
    group: "costas",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["grande dorsal"],
    secondaryMuscles: ["bíceps", "core"],
    equipment: ["peso_corporal"],
    cues: ["peito em direção à barra", "escápulas ativas", "controle"],
    compound: true,
  },
  {
    id: "remada-baixa-cabo",
    name: "Remada baixa (cabo)",
    group: "costas",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["romboides", "grande dorsal"],
    secondaryMuscles: ["bíceps"],
    equipment: ["cabo"],
    cues: ["tronco firme", "puxar para o umbigo", "escápulas retraem"],
    compound: true,
  },

  // =========================
  // OMBROS
  // =========================
  {
    id: "desenvolvimento-halter",
    name: "Desenvolvimento (halteres)",
    group: "ombros",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["deltoide (anterior e medial)"],
    secondaryMuscles: ["tríceps", "trapézio superior"],
    equipment: ["halter", "banco"],
    cues: ["cotovelos abaixo dos punhos", "não hiperextender lombar"],
    compound: true,
  },
  {
    id: "elevacao-lateral-halter",
    name: "Elevação lateral (halteres)",
    group: "ombros",
    executionType: "peso_livre",
    biomechLevel: "basico",
    primaryMuscles: ["deltoide medial"],
    secondaryMuscles: ["trapézio superior"],
    equipment: ["halter"],
    cues: ["braços levemente à frente", "subir até linha do ombro", "controle"],
  },
  {
    id: "face-pull-cabo",
    name: "Face pull (cabo)",
    group: "ombros",
    executionType: "maquina",
    biomechLevel: "intermediario",
    primaryMuscles: ["deltoide posterior"],
    secondaryMuscles: ["romboides", "manguito rotador"],
    equipment: ["cabo"],
    cues: ["cotovelos altos", "puxar para a face", "pausa curta no pico"],
  },
  {
    id: "desenvolvimento-smith",
    name: "Desenvolvimento (Smith)",
    group: "ombros",
    executionType: "guiado",
    biomechLevel: "basico",
    primaryMuscles: ["deltoide (anterior e medial)"],
    secondaryMuscles: ["tríceps"],
    equipment: ["smith", "anilhas"],
    cues: ["linha da barra controlada", "não travar cotovelos"],
    compound: true,
  },

  // =========================
  // BÍCEPS
  // =========================
  {
    id: "rosca-direta-barra",
    name: "Rosca direta (barra)",
    group: "biceps",
    executionType: "peso_livre",
    biomechLevel: "basico",
    primaryMuscles: ["bíceps braquial"],
    secondaryMuscles: ["braquial", "braquiorradial"],
    equipment: ["barra", "anilhas"],
    cues: ["cotovelos fixos", "subida controlada", "sem balanço"],
  },
  {
    id: "rosca-alternada-halter",
    name: "Rosca alternada (halter)",
    group: "biceps",
    executionType: "peso_livre",
    biomechLevel: "basico",
    primaryMuscles: ["bíceps braquial"],
    secondaryMuscles: ["braquial"],
    equipment: ["halter"],
    cues: ["punho neutro/controle", "não girar tronco"],
    unilateral: true,
  },
  {
    id: "rosca-martelo-halter",
    name: "Rosca martelo (halter)",
    group: "biceps",
    executionType: "peso_livre",
    biomechLevel: "basico",
    primaryMuscles: ["braquial", "braquiorradial"],
    secondaryMuscles: ["bíceps braquial"],
    equipment: ["halter"],
    cues: ["pegada neutra", "cotovelos fixos"],
  },
  {
    id: "rosca-scott-maquina",
    name: "Rosca Scott (máquina)",
    group: "biceps",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["bíceps braquial"],
    equipment: ["maquina"],
    cues: ["amplitude controlada", "não hiperestender cotovelo"],
  },

  // =========================
  // TRÍCEPS
  // =========================
  {
    id: "triceps-testa-barra",
    name: "Tríceps testa (barra)",
    group: "triceps",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["tríceps braquial"],
    equipment: ["barra", "anilhas", "banco"],
    cues: ["cotovelos apontam para cima", "controle excêntrico"],
  },
  {
    id: "triceps-corda-cabo",
    name: "Tríceps corda (cabo)",
    group: "triceps",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["tríceps braquial"],
    equipment: ["cabo"],
    cues: ["cotovelos fixos", "abrir a corda no final", "controle"],
  },
  {
    id: "mergulho-banco",
    name: "Mergulho no banco (peso corporal)",
    group: "triceps",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["tríceps braquial"],
    secondaryMuscles: ["peito", "deltoide anterior"],
    equipment: ["peso_corporal", "banco"],
    cues: ["ombros para trás", "controle na descida"],
    compound: true,
  },

  // =========================
  // QUADRÍCEPS
  // =========================
  {
    id: "agachamento-livre",
    name: "Agachamento livre (barra)",
    group: "quadriceps",
    executionType: "peso_livre",
    biomechLevel: "avancado",
    primaryMuscles: ["quadríceps", "glúteos"],
    secondaryMuscles: ["core", "eretores da espinha"],
    equipment: ["barra", "anilhas", "rack"],
    cues: ["coluna neutra", "joelhos acompanham ponta do pé", "profundidade segura"],
    requiresSpotter: true,
    compound: true,
  },
  {
    id: "agachamento-goblet",
    name: "Agachamento Goblet (halter/kettlebell)",
    group: "quadriceps",
    executionType: "peso_livre",
    biomechLevel: "basico",
    primaryMuscles: ["quadríceps", "glúteos"],
    secondaryMuscles: ["core"],
    equipment: ["halter", "kettlebell"],
    cues: ["peito alto", "cotovelos apontam para baixo", "controle"],
    compound: true,
  },
  {
    id: "leg-press",
    name: "Leg press",
    group: "quadriceps",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["quadríceps"],
    secondaryMuscles: ["glúteos"],
    equipment: ["leg_press"],
    cues: ["amplitude controlada", "não tirar lombar do banco"],
    compound: true,
  },
  {
    id: "cadeira-extensora",
    name: "Cadeira extensora",
    group: "quadriceps",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["quadríceps"],
    equipment: ["maquina"],
    cues: ["subida controlada", "pausa no pico", "descida lenta"],
  },

  // =========================
  // POSTERIOR (isquios)
  // =========================
  {
    id: "levantamento-terra-romeno",
    name: "Levantamento terra romeno (barra)",
    group: "posterior",
    executionType: "peso_livre",
    biomechLevel: "avancado",
    primaryMuscles: ["isquiotibiais", "glúteos"],
    secondaryMuscles: ["eretores da espinha", "core"],
    equipment: ["barra", "anilhas"],
    cues: ["quadril para trás", "coluna neutra", "barra perto do corpo"],
    compound: true,
  },
  {
    id: "mesa-flexora",
    name: "Mesa flexora",
    group: "posterior",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["isquiotibiais"],
    equipment: ["maquina"],
    cues: ["controle total", "não tirar quadril do banco"],
  },
  {
    id: "stiff-halter",
    name: "Stiff (halteres)",
    group: "posterior",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["isquiotibiais", "glúteos"],
    secondaryMuscles: ["eretores da espinha"],
    equipment: ["halter"],
    cues: ["joelhos semi-flexionados", "descer com controle", "coluna neutra"],
    compound: true,
  },

  // =========================
  // GLÚTEOS
  // =========================
  {
    id: "hip-thrust-barra",
    name: "Hip Thrust (barra)",
    group: "gluteos",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["glúteo máximo"],
    secondaryMuscles: ["posterior de coxa", "core"],
    equipment: ["barra", "anilhas", "banco"],
    cues: ["queixo levemente recolhido", "subir até alinhamento", "pausa no pico"],
    compound: true,
  },
  {
    id: "abducao-maquina",
    name: "Abdução (máquina)",
    group: "gluteos",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["glúteo médio"],
    equipment: ["maquina"],
    cues: ["tronco estável", "amplitude controlada", "pausa no final"],
  },
  {
    id: "afundo-halter",
    name: "Afundo (halteres)",
    group: "gluteos",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["glúteos", "quadríceps"],
    secondaryMuscles: ["core"],
    equipment: ["halter"],
    cues: ["passo firme", "joelho acompanha o pé", "controle na descida"],
    unilateral: true,
    compound: true,
  },

  // =========================
  // PANTURRILHAS
  // =========================
  {
    id: "panturrilha-em-pe-maquina",
    name: "Panturrilha em pé (máquina)",
    group: "panturrilhas",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["gastrocnêmio"],
    equipment: ["maquina"],
    cues: ["amplitude total", "pausa no topo", "descida controlada"],
  },
  {
    id: "panturrilha-sentado-maquina",
    name: "Panturrilha sentado (máquina)",
    group: "panturrilhas",
    executionType: "maquina",
    biomechLevel: "basico",
    primaryMuscles: ["sóleo"],
    equipment: ["maquina"],
    cues: ["amplitude total", "controle na descida"],
  },
  {
    id: "panturrilha-unilateral-halter",
    name: "Panturrilha unilateral (halter)",
    group: "panturrilhas",
    executionType: "peso_livre",
    biomechLevel: "basico",
    primaryMuscles: ["gastrocnêmio", "sóleo"],
    equipment: ["halter"],
    cues: ["subida forte", "descer devagar"],
    unilateral: true,
  },

  // =========================
  // CORE
  // =========================
  {
    id: "prancha",
    name: "Prancha",
    group: "core",
    executionType: "peso_livre",
    biomechLevel: "basico",
    primaryMuscles: ["core (reto abdominal, transverso)"],
    secondaryMuscles: ["glúteos", "ombros"],
    equipment: ["peso_corporal"],
    cues: ["alinhamento cabeça-quadril", "abdômen ativo", "respiração controlada"],
  },
  {
    id: "abdominal-cabo",
    name: "Abdominal no cabo (crunch)",
    group: "core",
    executionType: "maquina",
    biomechLevel: "intermediario",
    primaryMuscles: ["reto abdominal"],
    equipment: ["cabo"],
    cues: ["flexionar coluna torácica", "controle", "não puxar com braços"],
  },
  {
    id: "elevacao-pernas",
    name: "Elevação de pernas (barra/paralela)",
    group: "core",
    executionType: "peso_livre",
    biomechLevel: "intermediario",
    primaryMuscles: ["reto abdominal (inferior)"],
    secondaryMuscles: ["flexores do quadril"],
    equipment: ["peso_corporal"],
    cues: ["controle", "evitar balanço", "subida com intenção"],
  },
];

/** Helpers determinísticos (para o engine aplicar regras por nível) */
export type UserLevel = "iniciante" | "intermediario" | "avancado";

const allowedBiomech: Record<UserLevel, Array<StrengthExercise["biomechLevel"]>> = {
  iniciante: ["basico"],
  intermediario: ["basico", "intermediario"],
  avancado: ["basico", "intermediario", "avancado"],
};

export function filterStrengthByUserLevel(
  level: UserLevel,
  all: StrengthExercise[] = STRENGTH_LIBRARY
): StrengthExercise[] {
  const allowed = new Set(allowedBiomech[level]);
  return all.filter((e) => allowed.has(e.biomechLevel));
}
