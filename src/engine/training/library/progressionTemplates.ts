import { ProgressionType } from "../core/enums";

export const PROGRESSION_TEMPLATE_NOTES: Record<ProgressionType, string[]> = {
  [ProgressionType.DOUBLE_PROGRESSION]: ["aumentar reps dentro da faixa antes de subir carga"],
  [ProgressionType.LOAD_PROGRESSION]: ["subir carga em pequenos incrementos mantendo técnica"],
  [ProgressionType.DENSITY_PROGRESSION]: ["mesmo trabalho em menos tempo quando recuperação permitir"],
  [ProgressionType.HYBRID_SIMPLE]: ["alternar foco de carga e densidade por bloco curto"],
};
