import { TreinoBase } from "./treinoBase";

export interface TreinoCardio extends TreinoBase {
  tipo: "cardio";
  modalidade: "corrida" | "caminhada" | "bike" | "eliptico";
  zonaCardiaca?: 1 | 2 | 3 | 4 | 5;
  rpe?: number; // 0–10
}
