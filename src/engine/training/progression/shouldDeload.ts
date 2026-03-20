export function shouldDeload(params: { recoveryScore: number; fatigueTrend: number; adherenceTrend: number }): boolean {
  return params.recoveryScore <= 45 || params.fatigueTrend >= 70 || params.adherenceTrend <= 50;
}
