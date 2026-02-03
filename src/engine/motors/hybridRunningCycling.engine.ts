export type HybridDay = {
  running_pse?: number;  // 1-10
  cycling_pse?: number;  // 1-10
};

export type HybridResolution =
  | { running: "livre"; cycling: "livre" }
  | { running: "leve_ou_tecnica"; cycling: "livre" }
  | { running: "livre"; cycling: "leve_ou_regenerativo" };

export function resolveHybridLoad(day: HybridDay): HybridResolution {
  const r = day.running_pse ?? 0;
  const c = day.cycling_pse ?? 0;

  // regra central: não empilhar 2 estímulos altos no mesmo dia
  if (r >= 7) return { running: "livre", cycling: "leve_ou_regenerativo" };
  if (c >= 7) return { running: "leve_ou_tecnica", cycling: "livre" };
  return { running: "livre", cycling: "livre" };
}
