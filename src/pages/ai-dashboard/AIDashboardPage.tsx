import { AIInsights } from "@/components/ai-insights/AIInsights";

export default function AIDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">IA & Predições</div>
            <div className="text-sm text-white/60">Recomendações adaptativas e previsões (ML local-first).</div>
          </div>
          <a
            href="/progress"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
          >
            Abrir Progress →
          </a>
        </div>

        <div className="mt-6">
          <AIInsights />
        </div>
      </div>
    </div>
  );
}
