export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function safePlanId(): string {
  return "tp_" + Math.random().toString(36).slice(2, 10);
}
