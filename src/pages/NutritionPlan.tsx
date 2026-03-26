import * as React from "react";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Edit, FileText, Clipboard, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { buscarSubstituicoes } from "@/types/alimentos";
import {
  sumMacrosFromRefeicoes,
  guessPesoKgFromStateLike,
  validateDietScience,
  buildDietExportTextPhase3E,
  copyTextFallbackPhase3E,
  sumAlimentosTotals,
  buildDietExportPayload,
} from "@/engine/nutrition/NutritionEngine";
import { mindsetfitSignatureLines } from "@/assets/branding/signature";
import { generateMindsetFitPremiumPdf } from "@/lib/pdf/mindsetfitPdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { getHomeRoute } from "@/lib/subscription/premium";

function mfNum(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function safeFixed(value: unknown, digits = 0): string {
  return mfNum(value, 0).toFixed(digits);
}

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

async function downloadPdfPremiumDietPhase3D(state: any) {
  const payload = buildDietExportPayload({
    stateLike: state,
    nutricao: state?.nutricao ?? {},
    tolerancePct: 10,
  });

  const content = [
    payload.title,
    "",
    ...(Array.isArray(payload.summaryLines) ? payload.summaryLines : []),
    "",
    "Refeições:",
    ...(Array.isArray(payload.mealsLines) ? payload.mealsLines : []),
    "",
    ...(Array.isArray(payload.notesLines) ? payload.notesLines : []),
  ].join("\n");

  await generateMindsetFitPremiumPdf({
    title: payload.title,
    content,
    signatureLines: mindsetfitSignatureLines,
  } as any);
}

export function NutritionPlan() {
  const { state } = useDrMindSetfit();
  const navigate = useNavigate();

  const [planTextOpen, setPlanTextOpen] = React.useState(false);
  const [planTextDraft, setPlanTextDraft] = React.useState<string>("");

  const getPlanText = React.useCallback((): string => {
    try {
      const text =
        buildDietExportTextPhase3E({
          stateLike: state,
          nutricao: state?.nutricao ?? {},
          tolerancePct: 10,
        }) || "";
      return String(text || "");
    } catch {
      return "";
    }
  }, [state]);

  const openPlanText = () => {
    setPlanTextDraft(getPlanText());
    setPlanTextOpen(true);
  };

  const copyPlanText = async () => {
    const t = (planTextDraft || "").trim();
    if (!t) return;

    try {
      await navigator.clipboard.writeText(t);
    } catch {
      await copyTextFallbackPhase3E(t);
    }
  };

  const downloadPlanTxt = () => {
    const t = planTextDraft || "";
    const blob = new Blob([t], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plano.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const nutricaoSafe = {
    refeicoes: safeArray(state?.nutricao?.refeicoes),
    macros: {
      calorias: mfNum(state?.nutricao?.macros?.calorias, 0),
      proteina: mfNum(state?.nutricao?.macros?.proteina, 0),
      carboidratos: mfNum(state?.nutricao?.macros?.carboidratos, 0),
      gorduras: mfNum(state?.nutricao?.macros?.gorduras, 0),
    },
    restricoes: safeArray(state?.nutricao?.restricoes),
  };

  const dayTotals = sumMacrosFromRefeicoes(nutricaoSafe.refeicoes ?? []);
  const pesoKg = guessPesoKgFromStateLike(state);
  const kcalTarget = nutricaoSafe?.macros?.calorias;
  const science = validateDietScience({
    kcalTarget,
    refeicoes: nutricaoSafe.refeicoes ?? [],
    tolerancePct: 10,
  });

  if (!state.nutricao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black p-4 text-white">
        <Card className="w-full max-w-md glass-effect neon-border border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle className="text-xl text-neon">Nenhum Planejamento Configurado</CardTitle>
            <CardDescription className="text-gray-400">
              Configure seu plano nutricional primeiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/onboarding/step-1")} className="w-full glow-blue">
              Configurar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* ESQUERDA: logo + título */}
          <div className="flex items-center gap-3">
            <BrandIcon className="h-12 w-12 drop-shadow-[0_0_12px_rgba(30,107,255,0.4)]" />

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neon">
                Nutrição
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {safeArray(nutricaoSafe.refeicoes).length} refeições • {mfNum(nutricaoSafe.macros.calorias, 0)} kcal/dia
              </p>
            </div>
          </div>

          {/* DIREITA: ações */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={openPlanText}
              className="h-10 px-4 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Plano em texto
            </Button>

            <Button
              onClick={() => downloadPdfPremiumDietPhase3D(state)}
              className="h-10 px-4 text-sm font-semibold glow-blue"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                const text = buildDietExportTextPhase3E({
                  stateLike: state,
                  nutricao: nutricaoSafe,
                  tolerancePct: 10,
                });
                const ok = await copyTextFallbackPhase3E(text);
                if (!ok) alert("Não foi possível copiar. Tente novamente.");
              }}
              className="h-10 border-white/15 text-white hover:bg-white/10"
            >
              <Clipboard className="w-4 h-4 mr-2" />
              Copiar plano
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/edit-diet")}
              className="h-10 border-white/15 text-white hover:bg-white/10"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Dieta
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(getHomeRoute())}
              className="hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E6BFF]" />
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={planTextOpen} onOpenChange={setPlanTextOpen}>
        <DialogContent className="max-w-2xl bg-[#0b1118] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Plano em texto</DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Edite o texto livremente. Você pode copiar ou baixar em .txt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Textarea
              value={planTextDraft}
              onChange={(e) => setPlanTextDraft(e.target.value)}
              className="min-h-[260px] text-sm leading-relaxed bg-black/30 border-white/10"
              placeholder="Seu plano em texto aparecerá aqui..."
            />

            <div className="flex gap-2 justify-end flex-wrap">
              <Button
                type="button"
                onClick={() => void copyPlanText()}
                className="h-10 px-4 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white"
              >
                Copiar
              </Button>
              <Button
                type="button"
                onClick={downloadPlanTxt}
                className="h-10 px-4 text-sm font-semibold glow-blue"
              >
                Baixar .txt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <Card className="glass-effect neon-border border-white/10 bg-black/30">
          <CardHeader>
            <CardTitle className="text-xl text-neon">Seus Macronutrientes Diários</CardTitle>
            <CardDescription className="text-gray-400">
              Meta diária de nutrientes
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/10 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Calorias</p>
                <p className="text-3xl font-bold text-green-400">{mfNum(nutricaoSafe.macros.calorias, 0)}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>

              <div className="rounded-2xl border border-[#1E6BFF]/30 bg-gradient-to-br from-[#1E6BFF]/20 to-[#00B7FF]/10 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Proteína</p>
                <p className="text-3xl font-bold text-[#1E6BFF]">{mfNum(nutricaoSafe.macros.proteina, 0)}</p>
                <p className="text-xs text-gray-500">gramas</p>
              </div>

              <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Gorduras</p>
                <p className="text-3xl font-bold text-yellow-400">{mfNum(nutricaoSafe.macros.gorduras, 0)}</p>
                <p className="text-xs text-gray-500">gramas</p>
              </div>

              <div className="rounded-2xl border border-[#1E6BFF]/30 bg-gradient-to-br from-[#1E6BFF]/20 to-[#00B7FF]/10 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Carboidratos</p>
                <p className="text-3xl font-bold text-[#1E6BFF]">{mfNum(nutricaoSafe.macros.carboidratos, 0)}</p>
                <p className="text-xs text-gray-500">gramas</p>
              </div>
            </div>

            {safeArray(nutricaoSafe.restricoes).length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Restrições ativas:</p>
                <div className="flex flex-wrap gap-2">
                  {safeArray(nutricaoSafe.restricoes).map((rest: any, idx: number) => (
                    <Badge
                      key={`${String(rest)}-${idx}`}
                      variant="outline"
                      className="text-xs border-red-500/50 text-red-400 bg-red-500/10"
                    >
                      {String(rest)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10 bg-black/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-lg text-gray-100">Resumo do dia</CardTitle>
                <CardDescription className="text-sm text-gray-400">
                  Totais consolidados das refeições + consistência do plano
                </CardDescription>
              </div>

              <Badge
                variant="outline"
                className={
                  science.ok
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/15 border-red-500/30 text-red-300"
                }
              >
                {science.ok ? "Coerente" : "Atenção"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Calorias</p>
                <p className="text-gray-100 font-semibold">{mfNum(dayTotals?.calorias, 0)} kcal</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Proteínas</p>
                <p className="text-gray-100 font-semibold">{safeFixed(dayTotals?.proteinas, 1)} g</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Carboidratos</p>
                <p className="text-gray-100 font-semibold">{safeFixed(dayTotals?.carboidratos, 1)} g</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Gorduras</p>
                <p className="text-gray-100 font-semibold">{safeFixed(dayTotals?.gorduras, 1)} g</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">Check científico</p>
              <p className="text-sm text-gray-200 font-medium mt-1">
                {science?.message || "Sem validação disponível."}
              </p>

              {pesoKg ? (
                <p className="text-xs text-gray-400 mt-2">
                  Peso inferido: {safeFixed(pesoKg, 1)} kg
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">
                  Peso não disponível para contexto metabólico.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {safeArray(nutricaoSafe.refeicoes).map((refeicao: any, index: number) => {
            const alimentos = safeArray<any>(refeicao?.alimentos);
            const totals = sumAlimentosTotals(alimentos);

            return (
              <Card key={index} className="glass-effect border-white/10 bg-black/30">
                <CardHeader className="pb-3">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl text-gray-100">
                        {refeicao?.nome || `Refeição ${index + 1}`}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-400">
                        {refeicao?.horario || "--:--"} • {mfNum(totals?.calorias, 0)} kcal
                      </CardDescription>
                    </div>

                    <div className="flex gap-2 text-xs flex-wrap">
                      <Badge variant="outline" className="bg-[#1E6BFF]/20 border-[#1E6BFF]/30 text-[#1E6BFF]">
                        P: {safeFixed(totals?.proteinas, 1)}g
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400">
                        C: {safeFixed(totals?.carboidratos, 1)}g
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                        G: {safeFixed(totals?.gorduras, 1)}g
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {alimentos.map((alimento: any, idx: number) => {
                      const substituicoes = safeArray<any>(buscarSubstituicoes(alimento?.alimentoId));
                      const alimentoNome = alimento?.nome || `Alimento ${idx + 1}`;
                      const alimentoGramas = mfNum(alimento?.gramas, 0);

                      return (
                        <div
                          key={idx}
                          className="p-4 border border-white/10 rounded-2xl bg-black/20 hover:bg-black/35 transition-all"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3 gap-2">
                                <div>
                                  <h4 className="font-semibold text-base text-gray-100">{alimentoNome}</h4>
                                  <p className="text-sm text-[#1E6BFF] font-medium">
                                    {alimentoGramas}g
                                  </p>
                                </div>

                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-green-500/20 text-green-400 border-green-500/30"
                                >
                                  {mfNum(alimento?.calorias, 0)} kcal
                                </Badge>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-[#1E6BFF]"></span>
                                  <span className="text-muted-foreground">P:</span>
                                  <span className="font-medium">{safeFixed(alimento?.proteinas, 1)}g</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  <span className="text-muted-foreground">C:</span>
                                  <span className="font-medium">{safeFixed(alimento?.carboidratos, 1)}g</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                  <span className="text-muted-foreground">G:</span>
                                  <span className="font-medium">{safeFixed(alimento?.gorduras, 1)}g</span>
                                </div>
                              </div>
                            </div>

                            {substituicoes.length > 0 && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full lg:w-auto text-xs bg-[#1E6BFF]/20 border-[#1E6BFF]/30 text-[#1E6BFF] hover:bg-[#1E6BFF]/30"
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Ver Substituições ({substituicoes.length})
                                  </Button>
                                </DialogTrigger>

                                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-[#0b1118] border-white/10 text-white">
                                  <DialogHeader>
                                    <DialogTitle className="text-lg text-neon">
                                      Substituições para {alimentoNome}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-gray-400">
                                      Você pode substituir por qualquer um destes alimentos.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-3 mt-4">
                                    {substituicoes.map((sub: any, subIdx: number) => {
                                      const gramas = alimentoGramas;
                                      const macrosSub = {
                                        calorias: Math.round((mfNum(sub?.macrosPor100g?.calorias, 0) * gramas) / 100),
                                        proteinas: safeFixed((mfNum(sub?.macrosPor100g?.proteinas, 0) * gramas) / 100, 1),
                                        carboidratos: safeFixed((mfNum(sub?.macrosPor100g?.carboidratos, 0) * gramas) / 100, 1),
                                        gorduras: safeFixed((mfNum(sub?.macrosPor100g?.gorduras, 0) * gramas) / 100, 1),
                                      };

                                      return (
                                        <div
                                          key={sub?.id ?? `${sub?.nome ?? "sub"}-${subIdx}`}
                                          className="p-3 border border-white/10 rounded-xl bg-black/30 hover:bg-black/50 transition-colors"
                                        >
                                          <div className="flex items-start justify-between mb-2 gap-2">
                                            <div>
                                              <p className="font-semibold text-sm text-gray-100">
                                                {sub?.nome || "Substituto"}
                                              </p>
                                              <p className="text-xs text-[#1E6BFF]">
                                                {gramas}g
                                              </p>
                                            </div>

                                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                                              {macrosSub.calorias} kcal
                                            </Badge>
                                          </div>

                                          <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                              <span className="text-gray-400">P:</span>
                                              <span className="ml-1 font-medium text-[#1E6BFF]">
                                                {macrosSub.proteinas}g
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-gray-400">C:</span>
                                              <span className="ml-1 font-medium text-green-400">
                                                {macrosSub.carboidratos}g
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-gray-400">G:</span>
                                              <span className="ml-1 font-medium text-yellow-400">
                                                {macrosSub.gorduras}g
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
