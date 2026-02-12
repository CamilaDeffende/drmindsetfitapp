import type { SSOTInputs, Sex, Goal, Biotype } from "./types";

export const STORAGE_KEY = "drmindsetfit_state";

function n(v: any): number | undefined {
  const x = Number(v);
  return Number.isFinite(x) ? x : undefined;
}

function sexFromAny(v: any): Sex {
  const s = String(v || "").toLowerCase();
  if (s === "masculino" || s === "male" || s === "m") return "male";
  if (s === "feminino" || s === "female" || s === "f") return "female";
  if (s) return "other";
  return "unknown";
}

function goalFromAny(v: any): Goal | undefined {
  const s = String(v || "").toLowerCase();
  if (s.includes("cut") || s.includes("deficit") || s.includes("déficit")) return "cut";
  if (s.includes("bulk") || s.includes("superavit") || s.includes("superávit") || s.includes("hipertrof")) return "bulk";
  if (s.includes("manut") || s.includes("maintain")) return "maintain";
  return undefined;
}

function biotypeFromAny(v: any): Biotype | undefined {
  const s = String(v || "").toLowerCase();
  if (s.includes("ecto")) return "ecto";
  if (s.includes("meso")) return "meso";
  if (s.includes("endo")) return "endo";
  return undefined;
}

export function readStoredState(): any | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function selectSSOTInputsFromState(stateAny: any): SSOTInputs {
  const s = stateAny || {};

  const perfil = s.perfil ?? s.profile ?? s.step1 ?? {};
  const avaliacao = s.avaliacao ?? s.step2 ?? {};
  const step3 = s.step3 ?? {};
  const nut = s.nutricao ?? s.nutrition ?? s.step4 ?? {};
  const metabolismo = s.metabolismo ?? s.resultadoMetabolico ?? s.metabolic ?? {};

  const weightKg = n(perfil.peso ?? perfil.pesoKg ?? perfil.weight ?? perfil.weightKg);
  const heightCm = n(perfil.altura ?? perfil.alturaCm ?? perfil.height ?? perfil.heightCm);
  const age = n(perfil.idade ?? perfil.age);
  const sex = sexFromAny(perfil.sexo ?? perfil.sex);

  const ffmKg =
    n(avaliacao.massaMagra ?? avaliacao.massaMagraKg ?? avaliacao.ffm ?? avaliacao.ffmKg) ??
    n(perfil.massaMagra ?? perfil.massaMagraKg);

  const bfPercent = n(avaliacao.percentualGordura ?? avaliacao.bf ?? avaliacao.bfPercent);

  const frequencyPerWeek = n(
    avaliacao.frequenciaAtividadeSemanal ??
      avaliacao.frequenciaSemanal ??
      perfil.frequenciaAtividadeSemanal ??
      step3.nivelAtividadeSemanal
  );

  const activityFactor =
    n(metabolismo.fafFinal ?? metabolismo.faf ?? metabolismo.PAL ?? metabolismo.pal) ??
    n(metabolismo.fatorAtividade ?? metabolismo.activityFactor);

  const goal = goalFromAny(nut.objetivo ?? nut.goal ?? perfil.objetivo);
  const biotype = biotypeFromAny(step3.biotipoTendencia ?? perfil.biotipo ?? s.biotipo);

  return {
    profile: {
      weightKg,
      heightCm,
      age,
      sex,
      athlete: Boolean(perfil.atleta ?? perfil.athlete)
    },
    bodyComp: ffmKg || bfPercent ? { ffmKg, bfPercent } : undefined,
    activity: {
      palKey: String(step3.nivelAtividadeSemanal ?? step3.palKey ?? ""),
      frequencyPerWeek,
      activityFactor
    },
    biotype: biotype ?? "unknown",
    metabolism: {
      selectedEquation: (String(step3.equacaoSelecionada ?? metabolismo.equacao ?? "auto") as any) || "auto"
    },
    nutrition: {
      goal,
      strategyPercent: typeof nut.percentualEstrategia === "number" ? nut.percentualEstrategia : undefined
    }
  };
}
