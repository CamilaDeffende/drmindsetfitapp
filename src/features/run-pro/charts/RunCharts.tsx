import { RunChartsPremium } from "@/features/run-pro/charts/RunChartsPremium";

// Wrapper compatível: mantém API simples (samples)
export function RunCharts({ samples }: { samples: any[] }) {
  return <RunChartsPremium samples={samples as any} />;
}
