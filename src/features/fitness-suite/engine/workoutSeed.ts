export function hashSeed(input: string): number {
  // hash simples e estável (32-bit)
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOne<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickManyUnique<T>(arr: T[], n: number, rand: () => number): T[] {
  if (n <= 0) return [];
  const s = shuffle(arr, rand);
  return s.slice(0, Math.min(n, s.length));
}


export function getOrCreateUserSeed(key: string = "mindsetfit:userSeed:v1"): number {
  try {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(key);
    if (raw && String(parseInt(raw, 10)) === raw.trim()) return parseInt(raw, 10) >>> 0;

    // gera seed 32-bit (prefer crypto)
    let seed = 0;
    try {
      const a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      seed = (a[0] >>> 0);
    } catch {
      seed = (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0);
    }
    window.localStorage.setItem(key, String(seed));
    return seed >>> 0;
  } catch {
    return 0;
  }
}

