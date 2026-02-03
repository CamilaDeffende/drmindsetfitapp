import musculacao from "./musculacao.full.json";

export type TrainingExercise = {
  name: string;
  goal: string;
  execution: [string, string, string];
  focus: string;
  cues: [string, string, string];
  common_errors: [string, string, string];
  variations: [string, string, string];
};

export type TrainingCategory = TrainingExercise[];

export type MusculacaoGroup = {
  halteres: TrainingCategory;
  maquinas: TrainingCategory;
  cabos: TrainingCategory;
};

export type MusculacaoBank = {
  musculacao: {
    costas: MusculacaoGroup;
    peito: MusculacaoGroup;
    ombros: MusculacaoGroup;
    biceps: MusculacaoGroup;
    triceps: MusculacaoGroup;
    gluteos: MusculacaoGroup;
    quadriceps: MusculacaoGroup;
    posterior_coxa: MusculacaoGroup;
    panturrilhas: MusculacaoGroup;
  };
};

export const MUSCULACAO_BANK = musculacao as unknown as MusculacaoBank;

export default MUSCULACAO_BANK;
