export function movingAverage(values: Array<number | undefined>, window: number): number | undefined {
  const w = Math.max(1, Math.floor(window));
  const slice = values.filter((v): v is number => typeof v === "number").slice(-w);
  if (slice.length === 0) return undefined;
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / slice.length;
}
