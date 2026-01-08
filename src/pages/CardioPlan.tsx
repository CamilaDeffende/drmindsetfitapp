import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import logoUrl from "@/assets/branding/mindsetfit-logo.png";
import { generateMindsetFitPremiumPdf } from "@/lib/pdf/mindsetfitPdf";

type CardioItem = {
  modalidade: "corrida" | "caminhada" | "bike" | "eliptico";
  duracaoMin: number;
  zona?: 1 | 2 | 3 | 4 | 5;
  rpe?: number; // 0-10
  objetivo: string;
};

export function CardioPlan() {
  const navigate = useNavigate();
  const { state } = useDrMindSetfit();

  // MVP defensivo: se no futuro você salvar cardio no state, aqui já está pronto pra ler
  const cardioSalvo = (state as any)?.treinosAlternativos?.cardio as CardioItem[] | undefined;

  const plano = useMemo<CardioItem[]>(() => {
    if (Array.isArray(cardioSalvo) && cardioSalvo.length) return cardioSalvo;

    // fallback: sugestão padrão (não grava nada)
    return [
      { modalidade: "caminhada", duracaoMin: 35, zona: 2, rpe: 4, objetivo: "Base aeróbica / saúde" },
      { modalidade: "corrida", duracaoMin: 25, zona: 3, rpe: 6, objetivo: "Condicionamento" },
      { modalidade: "bike", duracaoMin: 40, zona: 2, rpe: 5, objetivo: "Gasto calórico (low impact)" },
    ];
  }, [cardioSalvo]);

  
  function buildCardioExportText() {
    const lines = [
      "DRMINDSETFIT — CARDIO (RELATÓRIO)",
      "",
      "Este PDF usa o template Premium MindSetFit.",
      "Conteúdo do plano de cardio pode variar conforme o módulo/Cardio Builder.",
      "",
      "Checklist sugerido:",
      "- Frequência semanal",
      "- Duração/tempo alvo",
      "- Intensidade (RPE/Zonas)",
      "- Progressão (semanas)",
      "- Observações de recuperação",
      "",
      "Obs: Se quiser, na próxima sprint (3H.2.1) eu conecto este PDF aos campos reais do Cardio (se existirem no arquivo)."
    ];
    return lines.join("\n");
  }

  async function downloadPdfPremiumCardio() {
    const bodyText = buildCardioExportText();
    const fileName = "mindsetfit-cardio.pdf";

    await generateMindsetFitPremiumPdf({
      logoUrl,
      fileName,
      wordmarkText: "MindSetFit",
      reportLabel: "RELATÓRIO CARDIO",
      metaLines: [
        "Módulo: Cardio",
        "Template: MindSetFit Premium (PDF)",
      ],
      bodyText,
      layout: {
        logoW: 220,
        logoH: 150,
        logoY: 78,
        wordmarkSize: 38,
        wordmarkGap: 92,
        headerGap: 32,
        margin: 60,
        lineHeight: 13,
        drawFrame: true,
      },
    });
  }

return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Cardio</h1>

          <div className="mt-4 flex gap-2 flex-wrap">
            <button type="button" onClick={downloadPdfPremiumCardio} className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs hover:bg-black/60">Baixar PDF Premium</button>
          </div>

            <p className="text-xs text-muted-foreground">Plano separado • sem interferir na musculação</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Card className="border-white/10 bg-white/60 dark:bg-white/5">
          <CardHeader>
            <CardTitle>Plano de Cardio (MVP)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Este módulo é independente. Na próxima sprint, vamos permitir configurar frequência, zonas, metas e salvar no state.
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {plano.map((c, idx) => (
            <Card key={idx} className="border-white/10 bg-white/60 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-base capitalize">
                  {c.modalidade} • {c.duracaoMin} min
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Objetivo</span>
                  <span className="font-medium text-foreground">{c.objetivo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zona</span>
                  <span className="font-medium text-foreground">{c.zona ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RPE</span>
                  <span className="font-medium text-foreground">{typeof c.rpe === "number" ? c.rpe : "-"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-white/10 bg-white/60 dark:bg-white/5">
          <CardHeader>
            <CardTitle>Próximo passo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div>1) Criar tela de configuração (frequência/objetivo)</div>
            <div>2) Salvar no state (treinosAlternativos.cardio)</div>
            <div>3) Mostrar resumo no Dashboard</div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
