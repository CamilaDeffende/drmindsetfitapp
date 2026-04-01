import { ExerciseComplexity, MovementPattern } from "../core/enums";
import { ExerciseDefinition } from "../core/types";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferEquipmentTags(name: string): string[] {
  const value = name.toLowerCase();
  const tags = new Set<string>();

  if (value.includes("polia") || value.includes("pulley") || value.includes("cross") || value.includes("corda")) tags.add("cable");
  if (value.includes("maquina") || value.includes("graviton") || value.includes("legpress") || value.includes("smith") || value.includes("hammer")) tags.add("machine");
  if (value.includes("barra")) tags.add("barbell");
  if (value.includes("halter")) tags.add("dumbbell");
  if (value.includes("banco")) tags.add("bench");
  if (value.includes("elastico")) tags.add("band");
  if (value.includes("bola")) tags.add("stability_ball");
  if (value.includes("step") || value.includes("degrau")) tags.add("step");
  if (value.includes("paralela") || value.includes("paralelas") || value.includes("barra fixa")) tags.add("bar");
  if (value.includes("anilha")) tags.add("plate");
  if (value.includes("aparelho")) tags.add("machine");
  if (value.includes("caneleira")) tags.add("ankle_weight");
  if (
    value.includes("solo") ||
    value.includes("isometrica") ||
    value.includes("prancha") ||
    value.includes("abdominal") ||
    value.includes("quatro apoio") ||
    value.includes("frog") ||
    value.includes("avanco") ||
    value.includes("afundo") ||
    value.includes("agachamento livre")
  ) {
    tags.add("bodyweight");
  }

  if (!tags.size) tags.add("bodyweight");
  return Array.from(tags);
}

function inferEnvironmentTags(tags: string[]) {
  const set = new Set(tags);
  if (set.has("machine") || set.has("cable")) return ["GYM", "HYBRID"];
  return ["HOME", "GYM", "HYBRID"];
}

function defineExercises(
  prefix: string,
  names: string[],
  config: {
    primaryMuscles: string[];
    secondaryMuscles?: string[];
    patternFor?: (name: string) => MovementPattern;
    complexity?: ExerciseComplexity;
    homeFriendly?: boolean;
  }
): ExerciseDefinition[] {
  return names.map((name, index) => {
    const equipmentTags = inferEquipmentTags(name);
    const id = `${prefix}-${String(index + 1).padStart(3, "0")}-${slugify(name)}`;
    return {
      id,
      name,
      movementPattern: config.patternFor?.(name) ?? MovementPattern.CORE,
      primaryMuscles: config.primaryMuscles,
      secondaryMuscles: config.secondaryMuscles ?? [],
      equipmentTags,
      environmentTags: inferEnvironmentTags(equipmentTags),
      complexity: config.complexity ?? ExerciseComplexity.LOW,
      difficultyScore: config.complexity === ExerciseComplexity.HIGH ? 4 : config.complexity === ExerciseComplexity.MODERATE ? 3 : 2,
      homeFriendly: config.homeFriendly ?? (!equipmentTags.includes("machine") && !equipmentTags.includes("cable")),
    };
  });
}

const ABDOMEN = [
  "Abdominal Canivete",
  "Roda Abdominal",
  "Abdominal Canivete Alternado",
  "Prancha Lateral",
  "Abdominal Infrasolo/Banco",
  "Prancha Isometrica",
  "Abdominal Maquina",
  "Twist Russo Pernas Levantadas",
  "Abdominal Solo",
  "Abdominal Declinado",
  "Abdominal Obliquo Solo",
  "Elevacao Pernas Aparelho",
  "Abdominal Supra Declinado",
  "Elevacao Pernas Barra Fixa",
  "Abdominal Tesoura",
  "Abdominal Infra Polia",
  "Abdominal Sentado Encolhimento",
  "Flexao Joelho Abducao Quadril Elastico",
  "Abdominal Curto",
  "Supra Polia Alta",
  "Elevacao Pernas Paralelas",
  "Twist Russo",
  "Elevacao Pernas Obstaculos",
  "Abdominal Perna Suspensa Haltere",
  "Abdominal Bicicleta",
  "Abdominal Declinado Soco",
  "Abdominal Invertido Bco Inclinado",
  "Abdominal Para-Brisa",
  "Abdominal Borboleta",
  "Infra Lateral Paralelas",
  "Abdominal Invertido Bola",
  "Abdominal Diagonal Alternado",
  "Abdominal Invertido Bco",
  "Abdominal Canivete Abertura",
  "Abdominal com Giro",
  "Abdominal Bola",
  "Abdominal Invertido Bco Inclinado Levantando a Pelve",
  "Abdominal Canivete Bola",
  "Abdominal Bola na Perna",
];

const ANTEBRACO = [
  "Flexao Hand Grip",
  "Rosca Punho Polia Baixa",
  "Rosca Punho Lateral",
  "Rosca Punho Tras Barra",
  "Rosca Punho Pronada Haltere",
  "Rosca Punho Supinada Sentado Barra",
  "Rosca Punho Supinada Haltere",
  "Rosca Punho Unilateral Polia Media",
  "Rosca Punho Supinada Polia Alta",
  "Rotacao Extensores Barra Anilha",
  "Rotacao Flexores Barra Anilha",
];

const BICEPS = [
  "Rosca Zottman",
  "Rosca Agachado Polia",
  "Rosca Alternada em Pe com Rotacao",
  "Rosca Alternada em Pe",
  "Rosca Alternada 45",
  "Rosca Alternada Sentado com Rotacao",
  "Rosca Barra Inclinada Banco",
  "Rosca com Barra",
  "Rosca Concentrada",
  "Rosca Corda na Polia",
  "Rosca em Pe Halteres",
  "Rosca Direta em Pe Polia Baixa",
  "Rosca em Pe Rotacao",
  "Rosca Fechada Deitado Polia",
  "Rosca Haltere Sentado",
  "Rosca Inclinada Halteres",
  "Rosca Inclinada com Rotacao",
  "Rosca Inversa Barra",
  "Rosca Inversa Polia",
  "Rosca Inversa com Rotacao",
  "Rosca Martelo em Pe",
  "Rosca Martelo na Polia",
  "Rosca Martelo Scott Polia",
  "Rosca Martelo Sentado",
  "Rosca Martelo Unilateral Inclinado",
  "Rosca Martelo Scott Unilateral",
  "Rosca na Polia Alta",
  "Rosca Polia Deitado",
  "Rosca Scott Maquina",
  "Rosca Scott Polia",
  "Rosca Scott Unilateral",
  "Rosca Scott Barra",
  "Rosca Unilateral Inclinado Banco",
  "Rosca Unilateral Polia",
  "Rosca W Fechado",
  "Rosca W Sentado",
  "Rosca Biceps Halteres",
];

const COSTAS = [
  "Barra Fixa Fechada Supinada",
  "Encolhimento Ombro Polia",
  "Encolhimento Ombro Barra Frente",
  "Encolhimento Ombro Barra Tras",
  "Encolhimento Ombro Halteres",
  "Pulldown Barra",
  "Barra Fixa Aberta Graviton",
  "Barra Fixa Aberta Pronada",
  "Barra Fixa Costas Pronada",
  "Puxada Ajoelhado Polia",
  "Puxada Articulada Maquina",
  "Puxada Polia Barra V",
  "Pulldown Vertical",
  "Barra Fixa Neutra Graviton",
  "Pulldown Corda",
  "Puxada Remada em Pe Polia Alta",
  "Puxada Frontal Aberta",
  "Puxada Frente Supinada",
  "Puxada Frente Barra Romana",
  "Puxada Frente Hammer",
  "Puxada Fechada Triangulo",
  "Barra Fixa Smith Iniciante",
  "Barra Fixa Neutra",
  "Puxada Maquina Supinada",
  "Puxada Banco Inclinado Barra",
  "Remada Polia Alta Corda",
  "Remada Curvada Supinada",
  "Remada Cavalinho",
  "Remada Curvada Triangulo Polia",
  "Remada Curvada Aberta Barra Polia",
  "Remada Curvada Fechada Polia",
  "Remada Curvada Aberta Supinada Polia",
  "Remada Curvada Fechada Supinada Polia",
  "Remada Curvada Pronada Smith",
  "Remada Curvada Supinada Smith",
  "Remada Curvada Unilateral Polia",
  "Remada Fechada Halteres Banco Inclinado",
  "Remada Curvada Pronada Barra",
  "Remada Curvada Pronada Halteres",
  "Remada Curvada Aberta Maquina",
  "Remada Curvada Fechada Maquina",
  "Remada Baixa Aberta Supinada",
  "Remada Baixa Aberta Pronada",
  "Remada Baixa Romana",
  "Remada Baixa Fechada Triangulo",
  "Remada Sentada Maquina",
  "Remada Sentada Supinada Maquina",
  "Remada Serrote",
  "Remada Baixa Unilateral",
  "Remada Unilateral Maquina",
  "Hiperextensao Barra",
];

const GLUTEOS = [
  "Abducao Quadril Polia Baixa",
  "Aducao Quadril Polia Baixa",
  "Afundo Smith",
  "Afundo Cruzado Haltere",
  "Afundo Cruzado Smith",
  "Agachamento Sumo Haltere",
  "Avanco Alternado Barra",
  "Agachamento Bulgaro",
  "Avanco",
  "Agachamento Sumo Smith",
  "Coice 45 Polia",
  "Cadeira Abdutora",
  "Cadeira Abdutora Inclinada",
  "Cadeira Adutora",
  "Coice Maquina",
  "Elevacao Abducao Quadril Elastico",
  "Elevacao Quadril Smith",
  "Elevacao Lateral e Traseira Elastico",
  "Extensao do Quadril 45 ou 90 Ereto",
  "Elevacao Quadril Solo",
  "Extensao Quadril Polia Banco",
  "Extensao Quadril Polia",
  "Good Morning",
  "Frog",
  "Elevacao Pelvica Barra ou Maquina",
  "Levantamento Terra Haltere",
  "Passada Lateral Elastico",
  "Quatro Apoios Flexionado Haltere",
  "Quatro Apoio Estendido",
  "Quatro Apoios Flexionado Caneleira",
  "Recuo Smith com Elevacao Perna",
  "Recuo Step",
  "Recuo Anilhas",
  "Stiff Barra",
  "Stiff Unilateral Haltere",
  "Terra Romeno Barra",
  "Terra Romeno Haltere",
  "Terra Romeno Unilateral",
  "Step Up Unilateral",
  "Levantamento Terra Sumo",
  "Legpress Sumo",
];

const ISQUIOS = [
  "Agachamento Sumo Articulado",
  "Agachamento Sumo Barra",
  "Agachamento Sumo Goblet",
  "Agachamento Sumo Livre",
  "Cadeira Flexora",
  "Flexao Joelho Polia",
  "Flexao Joelho Unilateral Maquina",
  "Legpress 45 Sumo",
  "Levantamento Terra Barra",
  "Levantamento Terra Sumo",
  "Mesa Flexora Unilateral",
  "Mesa Flexora",
];

const OMBROS = [
  "Crucifixo Invertido Inclinado Supinado Halteres",
  "Crucifixo Invertido Inclinado Neutro Halteres",
  "Crucifixo Invertido Maquina",
  "Crucifixo Invertido Maquina Pegada Inversa",
  "Crucifixo Invertido Unilateral Maquina",
  "Crucifixo Invertido Cross",
  "Desenvolvimento Arnold",
  "Desenvolvimento Halteres",
  "Desenvolvimento Militar",
  "Desenvolvimento Maquina",
  "Desenvolvimento Smith",
  "Desenvolvimento Sentado Barra",
  "Desenvolvimento Sentado Halteres",
  "Elevacao Frontal Alternada",
  "Elevacao Frontal Barra",
  "Elevacao Frontal Corda",
  "Elevacao Frontal Halteres",
  "Elevacao Frontal Sentado Rotacao",
  "Elevacao Frontal Anilha Rotacao 90",
  "Elevacao Frontal e Lateral Halteres",
  "Elevacao Frontal Polia Baixa",
  "Elevacao Frontal Banco Inclinado Halteres",
  "Elevacao Frontal Unilateral Polia",
  "Elevacao Lateral Halteres",
  "Elevacao Lateral Sentado Halteres",
  "Elevacao Lateral e Frontal Halteres",
  "Crucifixo Invertido Inclinado Pronado Halteres",
  "Crucifixo Invertido Inclinado Neutro Halteres",
  "Elevacao Lateral Maquina",
  "Elevacao Lateral em Decubito Lateral 45",
  "Elevacao Lateral Unilateral Haltere",
  "Elevacao Lateral Unilateral Polia Inclinado",
  "Crucifixo Invertido Inclinado Unilateral Polia",
  "Puxada Inclinada Halteres",
  "Remada Alta Barra W",
  "Remada Alta Halteres",
  "Remada Alta Polia Baixa",
  "Remada Halteres Banco Inclinado",
  "Remada Curvada Barra",
  "Remada Curva Smith",
  "Remada Tras Smith",
  "Remada Corda Polia Alta",
  "Rosca Martelo + Desenvolvimento Halteres",
  "Rotacao Ombro Externa Elastico",
  "Rotacao Ombro Interna Elastico",
];

const PANTURRILHAS = [
  "Soleos Maquina",
  "Panturrilha Sentado Soleos Barra / Anilha / Smith",
  "Gastrocnemio Medial Dedos Fora Degrau / Step",
  "Gastrocnemio Unilateral Maquina",
  "Panturrilhas Degrau / Step",
  "Gastrocnemios Lateral Dedos Dentro Degrau / Step",
  "Gastrocnemios Maquina Aduzido / Abduzido",
  "Gastrocnemios Legpress Aduzido / Abduzido",
];

const PEITO = [
  "Crucifixo Declinado Polia",
  "Crucifixo Declinado Halteres",
  "Crucifixo Reto Solo",
  "Crucifixo Inclinado 30 Halteres",
  "Crucifixo Inclinado 45 Halteres",
  "Crucifixo Polia Alta",
  "Crucifixo Polia Baixa",
  "Crucifixo Inclinado Banco Polia",
  "Crucifixo Reto Halteres",
  "Crucifixo Fly ou Pecdeck Maquina",
  "Fly Unilateral Maquina",
  "Crucifixo Reto Cross",
  "Elevacao Frontal Inclinado Halteres",
  "Mergulho",
  "Mergulho Graviton",
  "Pullover Escapula Halteres",
  "Pullover Halteres",
  "Pullover Sentado Maquina",
  "Supino Svend",
  "Supino Declinado Barra",
  "Supino Declinado Halteres",
  "Supino Declinado Maquina",
  "Supino Reto Polia",
  "Supino Reto Maquina",
  "Supino Reto Deitado Polia",
  "Supino Halteres Solo",
  "Supino Inclinado Barra",
  "Supino Inclinado Halteres Rotacao",
  "Supino Inclinado 30 Halteres",
  "Supino Inclinado 45 Halteres",
  "Supino Inclinado Maquina",
  "Supino Inclinado Smith",
  "Supino Reto Maquina",
  "Supino Reto Barra",
  "Supino Reto Halteres",
  "Supino Reto Smith",
  "Supino Svend Deitado Halteres",
  "Supino Svend Barra Apoiada em Pe",
  "Supino Unilateral Solo Halteres",
];

const PERNAS = [
  "Afundo Halteres",
  "Afundo Smith",
  "Agachamento Articulado",
  "Agachamento Barra",
  "Agachamento Barra Frente",
  "Agachamento Halteres",
  "Agachamento Livre",
  "Agachamento Pistol",
  "Agachamento Smith",
  "Avanco Alternado",
  "Avanco e Recuo Unilateral",
  "Legpress Horizontal",
  "Legpress 45 Unilateral",
  "Legpress Vertical",
];

const QUADRICEPS = [
  "Agachamento Fechado Articulado",
  "Agachamento Invertido Articulado",
  "Agachamento Invertido Unilateral Articulado",
  "Cadeira Extensora Unilateral",
  "Cadeira Extensora",
  "Legpress 45 Fechado",
  "Passada Anilha",
  "Passada",
  "Step Up Unilateral",
];

const TRICEPS = [
  "Triceps Frances Fechado Barra W",
  "Triceps Coice Halteres",
  "Triceps Frances Curvado Polia",
  "Triceps Testa Barra W",
  "Triceps Testa Corda Polia Baixa",
  "Triceps Testa Halteres",
  "Triceps Testa Polia Baixa",
  "Triceps Frances Barra Reta",
  "Triceps Frances Corda Polia Baixa",
  "Triceps Frances Haltere",
  "Triceps Frances Barra Polia Baixa",
  "Triceps Testa 45 Barra W",
  "Triceps Frances Inclinado Corda Polia Alta",
  "Triceps Frances Supinado Barra W",
  "Triceps Frances Unilateral Haltere",
  "Triceps Frances Unilateral Sentado Haltere",
  "Triceps Frances Sentado Haltere",
  "Triceps Unilateral Deitado Haltere",
  "Mergulho Graviton Fechado",
  "Triceps Supinado Smith",
  "Triceps Coice Haltere",
  "Triceps Coice Banco Inclinado",
  "Pulley Triceps Barra Reta",
  "Pulley Triceps Barra V",
  "Triceps Pulley Corda",
  "Pulley Triceps Supinado",
  "Triceps Paralelas",
  "Triceps Maquina",
  "Triceps Mergulho Banco",
  "Triceps Plataforma Graviton",
  "Triceps Supinado Barra",
  "Pulley Unilateral Supinado",
  "Pulley Unilateral Pronado",
];

function corePattern(name: string) {
  const value = name.toLowerCase();
  if (
    value.includes("lateral") ||
    value.includes("obliquo") ||
    value.includes("twist") ||
    value.includes("giro") ||
    value.includes("diagonal") ||
    value.includes("para-brisa")
  ) {
    return MovementPattern.CORE_ANTI_ROTATION;
  }
  return MovementPattern.CORE_ANTI_EXTENSION;
}

function backPattern(name: string) {
  const value = name.toLowerCase();
  if (value.includes("hiperextensao")) return MovementPattern.HIP_HINGE;
  if (value.includes("barra fixa") || value.includes("puxada") || value.includes("pulldown")) return MovementPattern.VERTICAL_PULL;
  return MovementPattern.HORIZONTAL_PULL;
}

function glutePattern(name: string) {
  const value = name.toLowerCase();
  if (value.includes("agach") || value.includes("legpress")) return MovementPattern.SQUAT;
  if (value.includes("afundo") || value.includes("avanco") || value.includes("passada") || value.includes("step up") || value.includes("recuo")) return MovementPattern.LUNGE;
  return MovementPattern.HIP_HINGE;
}

function hamPattern(name: string) {
  const value = name.toLowerCase();
  if (value.includes("flexora") || value.includes("flexao joelho")) return MovementPattern.KNEE_FLEXION;
  if (value.includes("agach") || value.includes("legpress")) return MovementPattern.SQUAT;
  return MovementPattern.HIP_HINGE;
}

function shoulderPattern(name: string) {
  const value = name.toLowerCase();
  if (
    value.includes("crucifixo invertido") ||
    value.includes("remada") ||
    value.includes("rotacao ombro")
  ) {
    return MovementPattern.HORIZONTAL_PULL;
  }
  return MovementPattern.VERTICAL_PUSH;
}

function chestPattern(name: string) {
  const value = name.toLowerCase();
  if (value.includes("mergulho")) return MovementPattern.VERTICAL_PUSH;
  return MovementPattern.HORIZONTAL_PUSH;
}

function legPattern(name: string) {
  const value = name.toLowerCase();
  if (value.includes("afundo") || value.includes("avanco") || value.includes("passada") || value.includes("step up")) return MovementPattern.LUNGE;
  return MovementPattern.SQUAT;
}

export const EXERCISES_CATALOG_PT: ExerciseDefinition[] = [
  ...defineExercises("abdomen", ABDOMEN, {
    primaryMuscles: ["core"],
    secondaryMuscles: ["obliques", "hip_flexors"],
    patternFor: corePattern,
    complexity: ExerciseComplexity.LOW,
  }),
  ...defineExercises("antebraco", ANTEBRACO, {
    primaryMuscles: ["forearms"],
    secondaryMuscles: ["grip"],
    patternFor: () => MovementPattern.HORIZONTAL_PULL,
    complexity: ExerciseComplexity.LOW,
  }),
  ...defineExercises("biceps", BICEPS, {
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    patternFor: () => MovementPattern.HORIZONTAL_PULL,
    complexity: ExerciseComplexity.LOW,
  }),
  ...defineExercises("costas", COSTAS, {
    primaryMuscles: ["lats", "upper_back"],
    secondaryMuscles: ["biceps", "rear_delts"],
    patternFor: backPattern,
    complexity: ExerciseComplexity.MODERATE,
  }),
  ...defineExercises("gluteos", GLUTEOS, {
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "quadriceps"],
    patternFor: glutePattern,
    complexity: ExerciseComplexity.MODERATE,
  }),
  ...defineExercises("isquiotibiais", ISQUIOS, {
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes"],
    patternFor: hamPattern,
    complexity: ExerciseComplexity.MODERATE,
  }),
  ...defineExercises("ombros", OMBROS, {
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["triceps", "rear_delts"],
    patternFor: shoulderPattern,
    complexity: ExerciseComplexity.MODERATE,
  }),
  ...defineExercises("panturrilhas", PANTURRILHAS, {
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    patternFor: () => MovementPattern.CALF,
    complexity: ExerciseComplexity.LOW,
  }),
  ...defineExercises("peito", PEITO, {
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
    patternFor: chestPattern,
    complexity: ExerciseComplexity.MODERATE,
  }),
  ...defineExercises("pernas", PERNAS, {
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings"],
    patternFor: legPattern,
    complexity: ExerciseComplexity.MODERATE,
  }),
  ...defineExercises("quadriceps", QUADRICEPS, {
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["glutes"],
    patternFor: legPattern,
    complexity: ExerciseComplexity.MODERATE,
  }),
  ...defineExercises("triceps", TRICEPS, {
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["shoulders"],
    patternFor: () => MovementPattern.VERTICAL_PUSH,
    complexity: ExerciseComplexity.LOW,
  }),
];
