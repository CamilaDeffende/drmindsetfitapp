import { computeRunStats, type RunSample } from "@/features/run-pro/stats/compute";

export type CoachScore = {
  score: number; // 0..100
  label: "Elite" | "Bom" | "Instável";
  reasons: string[]; // 2-3 insights curtos
};

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }

function paceSecPerKmSegments(samples: RunSample[]) {
  // retorna lista de paces (sec/km) por segmento entre pontos, ignorando dt baixo
  const sorted = [...samples].sort((x,y)=>x.ts-y.ts);
  const out: number[] = [];
  for (let i=1;i<sorted.length;i++){
    const a = sorted[i-1], b = sorted[i];
    const dt = b.ts - a.ts;
    if (dt < 800) continue;
    // distância aproximada por haversine (reuso via stats)
    // aqui usamos computeRunStats como base para não duplicar haversine; mas precisamos do pace por segmento:
    // vamos estimar pela distância incremental via fórmula local simples (não precisa ser perfeito).
    const toRad = (d:number)=>d*Math.PI/180;
    const R = 6371000;
    const dLat = toRad(b.lat-a.lat);
    const dLng = toRad(b.lng-a.lng);
    const sa = Math.sin(dLat/2), sb = Math.sin(dLng/2);
    const A = sa*sa + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*sb*sb;
    const c = 2*Math.atan2(Math.sqrt(A), Math.sqrt(1-A));
    const d = R*c; // m
    const speed = d / (dt/1000);
    if (!Number.isFinite(speed) || speed <= 0) continue;
    const pace = 1000 / speed; // sec/km
    // corta absurdo: mais rápido que 2:30/km ou mais lento que 20:00/km
    if (pace < 150 || pace > 1200) continue;
    out.push(pace);
  }
  return out;
}

function coefVar(nums: number[]) {
  if (nums.length < 3) return null;
  const mean = nums.reduce((a,b)=>a+b,0)/nums.length;
  const v = nums.reduce((a,b)=>a+Math.pow(b-mean,2),0)/nums.length;
  const sd = Math.sqrt(v);
  return mean > 0 ? (sd/mean) : null;
}

export function computeCoachScore(samples: RunSample[]): CoachScore {
  const stats = computeRunStats(samples);

  // base score buckets
  let s = 100;

  // 1) consistência (CV do pace)
  const paces = paceSecPerKmSegments(samples);
  const cv = coefVar(paces); // 0.. (ideal baixo)
  if (cv === null) {
    s -= 18; // poucos dados
  } else {
    // cv 0.05 ótimo; 0.12 ok; 0.20 ruim
    const penalty = clamp((cv - 0.06) * 220, 0, 35);
    s -= penalty;
  }

  // 2) sinal (accuracy)
  if (stats.signalGrade === "A") s -= 0;
  if (stats.signalGrade === "B") s -= 8;
  if (stats.signalGrade === "C") s -= 18;

  // 3) pausas
  // penaliza pausas longas ou muitas
  const pausedMin = stats.pausedMs / 60000;
  s -= clamp(stats.pausesCount * 5, 0, 20);
  s -= clamp(pausedMin * 1.2, 0, 15);

  // qualidade mínima
  s = clamp(Math.round(s), 0, 100);

  const label: CoachScore["label"] =
    s >= 85 ? "Elite" : s >= 65 ? "Bom" : "Instável";

  const reasons: string[] = [];

  // insights (2-3)
  if (cv !== null) {
    if (cv <= 0.09) reasons.push("Ritmo estável (boa consistência).");
    else if (cv <= 0.14) reasons.push("Ritmo ok, com variação moderada.");
    else reasons.push("Ritmo instável (muita variação).");
  } else {
    reasons.push("Poucos dados ainda — continue para refinar o score.");
  }

  if (stats.signalGrade === "A") reasons.push("Sinal GPS forte (alta precisão).");
  else if (stats.signalGrade === "B") reasons.push("GPS bom, com pequenas oscilações.");
  else reasons.push("GPS oscilando — tente área aberta para melhor precisão.");

  if (stats.pausesCount >= 2 || pausedMin >= 2) reasons.push("Muitas pausas — isso impacta o ritmo médio.");
  else reasons.push("Boa continuidade (poucas pausas).");

  return { score: s, label, reasons: reasons.slice(0, 3) };
}
