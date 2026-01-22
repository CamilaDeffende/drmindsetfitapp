export type NivelTreino = "iniciante" | "intermediario" | "avancado";

export type ModalidadeTreino =
  | "musculacao"
  | "funcional"
  | "corrida"
  | "bike_indoor"
  | "crossfit";

export type IntensidadeTreino = "leve" | "moderada" | "alta";

export type ObjetivoTreino =
  | "emagrecimento_estetica"
  | "hipertrofia"
  | "performance"
  | "longevidade";

export type EquipamentoTag =
  | "halteres"
  | "barra"
  | "maquina"
  | "peso_corporal"
  | "kettlebell"
  | "corda"
  | "bike"
  | "esteira"
  | "pista";

export type ExercicioTipo = "forca" | "cardio" | "metcon" | "mobilidade" | "core";

export interface ExercicioItem {
  id: string;
  nome: string;
  tipo: ExercicioTipo;
  tags?: string[];
  equipamento?: EquipamentoTag[];
  // prescrição (quando aplicável)
  series?: number;
  repeticoes?: string; // ex: "8-12" ou "AMRAP"
  descansoSeg?: number;
  rpe?: number; // 6..10
  tecnica?: string; // ex: "drop-set", "rest-pause", etc
  observacoes?: string;
}

export interface TreinoDia {
  dia: string; // "Segunda", "Terça", ...
  modalidade: ModalidadeTreino;
  intensidade: IntensidadeTreino;
  foco?: string; // ex: "Lower", "Full body", "Zona 2"
  duracaoMin?: number;
  exercicios: ExercicioItem[];
  aquecimento?: string[];
  finalizacao?: string[];
  orientacoes?: string[];
}

export interface TreinoPlan {
  id: string; // seed/hash
  criadoEmISO: string;
  nivel: NivelTreino;
  objetivo: ObjetivoTreino;
  frequenciaSemanal: number;
  treinos: TreinoDia[];
  notasGerais?: string[];
}
