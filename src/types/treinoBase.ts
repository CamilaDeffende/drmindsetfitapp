export type TipoTreino =
  | "musculacao"
  | "cardio"
  | "hiit"
  | "funcional"
  | "calistenia"
  | "mobilidade"
  | "reabilitacao"
  | "esporte"
  | "recuperacao";

export interface TreinoBase {
  id: string;
  tipo: TipoTreino;
  objetivo: string;
  duracaoMin?: number;
  intensidade?: number; // RPE ou zona
  observacoes?: string;
}
