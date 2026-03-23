import { AIInsights } from "@/components/ai-insights/AIInsights";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCircuit, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AIDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen mf-app-bg mf-bg-neon text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandIcon size={56} className="drop-shadow-[0_0_16px_rgba(0,190,255,0.28)]" />
            <div>
              <div className="text-[24px] font-semibold tracking-tight">IA e Predicoes</div>
              <div className="mt-1 text-sm text-white/58">
                Recomendações adaptativas, leitura de carga e sinais de evolução.
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/progress")}
              className="overflow-hidden rounded-[18px] bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white hover:bg-transparent"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Progresso
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.05)]">
          <div className="flex items-center gap-2 text-cyan-300">
            <BrainCircuit className="h-4 w-4" />
            <span className="text-[12px] uppercase tracking-[0.22em]">Motor adaptativo</span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            Esta área concentra os sinais locais do app para sugerir ajustes de treino,
            leitura de recuperação e tendências simples de peso e adesão.
          </p>
        </div>

        <div className="mt-6">
          <AIInsights />
        </div>
      </div>
    </div>
  );
}
