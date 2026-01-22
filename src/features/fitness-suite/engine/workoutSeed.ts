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
