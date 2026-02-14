import { MUSCULACAO_BANK } from "@/data/training";

export type TrainingExercise = {
  name: string;
  goal: string;
  execution: [string, string, string];
  focus: string;
  cues: [string, string, string];
  common_errors: [string, string, string];
  variations: [string, string, string];
};

export type MuscleGroup =
  | "costas"
  | "peito"
  | "ombros"
  | "biceps"
  | "triceps"
  | "gluteos"
  | "quadriceps"
  | "posterior_coxa"
  | "panturrilhas";

export type EquipmentCategory = "halteres" | "maquinas" | "cabos";

export type PickOptions = {
  group: MuscleGroup;
  categories?: EquipmentCategory[]; // default: ["halteres","maquinas","cabos"]
  count: number;
  seed?: number; // default: Date.now()
  avoidNames?: string[]; // nomes a evitar
};

export type PickResult = {
  picks: TrainingExercise[];
  meta: {
    group: MuscleGroup;
    categories: EquipmentCategory[];
    requested: number;
    returned: number;
    seed: number;
    poolSize: number;
  };
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uniqByName(list: TrainingExercise[]): TrainingExercise[] {
  const seen = new Set<string>();
  const out: TrainingExercise[] = [];
  for (const ex of list) {
    const k = (ex?.name || "").trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(ex);
  }
  return out;
}

export function getExercisePool(group: MuscleGroup, categories: EquipmentCategory[] = ["halteres", "maquinas", "cabos"]) {
  const g = MUSCULACAO_BANK.musculacao[group];
  const pool: TrainingExercise[] = [];
  for (const c of categories) pool.push(...(g[c] as TrainingExercise[]));
  return uniqByName(pool);
}

export function pickExercises(opts: PickOptions): PickResult {
  const categories = (opts.categories?.length ? opts.categories : ["halteres", "maquinas", "cabos"]) as EquipmentCategory[];
  const seed = typeof opts.seed === "number" ? opts.seed : Date.now();
  const rng = mulberry32(seed);

  const avoid = new Set((opts.avoidNames || []).map(s => s.trim().toLowerCase()).filter(Boolean));
  const poolAll = getExercisePool(opts.group, categories);
  const pool = poolAll.filter(ex => !avoid.has(ex.name.trim().toLowerCase()));

  // shuffle determinístico
  const arr = pool.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  const picks = arr.slice(0, Math.max(0, opts.count));

  return {
    picks,
    meta: {
      group: opts.group,
      categories,
      requested: opts.count,
      returned: picks.length,
      seed,
      poolSize: poolAll.length
    }
  };
}

export function expandWithVariations(ex: TrainingExercise): string[] {
  // retorna [principal + 3 variações] em string (limpo)
  const base = ex.name.trim();
  const vars = (ex.variations || []).map((v: string) => (v || "").trim()).filter(Boolean);
  return [base, ...vars].slice(0, 4);
}
