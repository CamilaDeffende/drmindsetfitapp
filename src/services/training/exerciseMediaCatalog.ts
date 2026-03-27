export type ExerciseMediaType = "image" | "gif" | "mp4" | "webm";

export type ExerciseVisualMeta = {
  mediaUrl?: string;
  mediaType?: ExerciseMediaType;
  posterUrl?: string;
  targetMuscles?: string[];
  sourceLabel?: string;
};

type CatalogEntry = ExerciseVisualMeta & {
  ids?: string[];
  names?: string[];
};

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const CATALOG: CatalogEntry[] = [
  {
    ids: ["goblet-squat", "squat", "agachamento", "agachamento_goblet"],
    names: ["goblet squat", "squat", "agachamento"],
    mediaUrl: "/exercises/goblet-squat.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/goblet-squat.jpg",
    targetMuscles: ["Quadriceps", "Gluteos", "Core"],
    sourceLabel: "Adicione o arquivo em public/exercises/goblet-squat.mp4",
  },
  {
    ids: ["romanian-deadlift-db", "terra_romeno", "romanian deadlift"],
    names: ["romanian deadlift", "levantamento terra romeno"],
    mediaUrl: "/exercises/romanian-deadlift-db.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/romanian-deadlift-db.jpg",
    targetMuscles: ["Posterior", "Gluteos", "Lombar"],
    sourceLabel: "Adicione o arquivo em public/exercises/romanian-deadlift-db.mp4",
  },
  {
    ids: ["push-up", "pushup", "flexao"],
    names: ["push-up", "push up", "flexao de braco"],
    mediaUrl: "/exercises/push-up.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/push-up.jpg",
    targetMuscles: ["Peito", "Triceps", "Core"],
    sourceLabel: "Adicione o arquivo em public/exercises/push-up.mp4",
  },
  {
    ids: ["dumbbell-bench-press", "supino_reto", "supino_inclinado"],
    names: ["dumbbell bench press", "supino reto", "supino inclinado"],
    mediaUrl: "/exercises/dumbbell-bench-press.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/dumbbell-bench-press.jpg",
    targetMuscles: ["Peito", "Triceps", "Ombros"],
    sourceLabel: "Adicione o arquivo em public/exercises/dumbbell-bench-press.mp4",
  },
  {
    ids: ["one-arm-row", "row_db", "remada_curvada"],
    names: ["one-arm dumbbell row", "remada curvada"],
    mediaUrl: "/exercises/one-arm-row.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/one-arm-row.jpg",
    targetMuscles: ["Costas", "Latissimos", "Biceps"],
    sourceLabel: "Adicione o arquivo em public/exercises/one-arm-row.mp4",
  },
  {
    ids: ["lat-pulldown", "puxada_frontal"],
    names: ["lat pulldown", "puxada frontal"],
    mediaUrl: "/exercises/lat-pulldown.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/lat-pulldown.jpg",
    targetMuscles: ["Costas", "Latissimos", "Biceps"],
    sourceLabel: "Adicione o arquivo em public/exercises/lat-pulldown.mp4",
  },
  {
    ids: ["overhead-press-db", "desenvolvimento"],
    names: ["dumbbell overhead press", "desenvolvimento"],
    mediaUrl: "/exercises/overhead-press-db.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/overhead-press-db.jpg",
    targetMuscles: ["Ombros", "Triceps", "Core"],
    sourceLabel: "Adicione o arquivo em public/exercises/overhead-press-db.mp4",
  },
  {
    ids: ["walking-lunge", "afundo"],
    names: ["walking lunge", "afundo alternado"],
    mediaUrl: "/exercises/walking-lunge.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/walking-lunge.jpg",
    targetMuscles: ["Quadriceps", "Gluteos", "Posterior"],
    sourceLabel: "Adicione o arquivo em public/exercises/walking-lunge.mp4",
  },
  {
    ids: ["dead-bug", "plank", "prancha"],
    names: ["dead bug", "plank", "prancha"],
    mediaUrl: "/exercises/dead-bug.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/dead-bug.jpg",
    targetMuscles: ["Core", "Abdomen", "Estabilidade"],
    sourceLabel: "Adicione o arquivo em public/exercises/dead-bug.mp4",
  },
  {
    ids: ["pallof-press"],
    names: ["pallof press"],
    mediaUrl: "/exercises/pallof-press.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/pallof-press.jpg",
    targetMuscles: ["Core", "Obliquos"],
    sourceLabel: "Adicione o arquivo em public/exercises/pallof-press.mp4",
  },
  {
    ids: ["seated-calf-raise"],
    names: ["seated calf raise"],
    mediaUrl: "/exercises/seated-calf-raise.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/seated-calf-raise.jpg",
    targetMuscles: ["Panturrilhas"],
    sourceLabel: "Adicione o arquivo em public/exercises/seated-calf-raise.mp4",
  },
  {
    ids: ["leg-curl"],
    names: ["leg curl"],
    mediaUrl: "/exercises/leg-curl.mp4",
    mediaType: "mp4",
    posterUrl: "/exercises/posters/leg-curl.jpg",
    targetMuscles: ["Posterior", "Isquiotibiais"],
    sourceLabel: "Adicione o arquivo em public/exercises/leg-curl.mp4",
  },
];

export function lookupExerciseVisual(input: {
  exerciseId?: string | null;
  name?: string | null;
}): ExerciseVisualMeta | null {
  const id = normalize(input.exerciseId);
  const name = normalize(input.name);

  const match = CATALOG.find((entry) => {
    const ids = Array.isArray(entry.ids) ? entry.ids.map(normalize) : [];
    const names = Array.isArray(entry.names) ? entry.names.map(normalize) : [];
    return (!!id && ids.includes(id)) || (!!name && names.includes(name));
  });

  if (!match) return null;

  return {
    mediaUrl: match.mediaUrl,
    mediaType: match.mediaType,
    posterUrl: match.posterUrl,
    targetMuscles: match.targetMuscles,
    sourceLabel: match.sourceLabel,
  };
}
