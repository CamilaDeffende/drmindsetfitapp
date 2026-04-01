import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  RefreshCcw,
  Ruler,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { useAuth } from "@/contexts/AuthContext";
import { getHomeRoute } from "@/lib/subscription/premium";
import { loadActivePlan } from "@/services/plan.service";

function hasFilledMetric(value: unknown) {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) return false;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0;
}

export default function Profile() {
  const navigate = useNavigate();
  const { state } = useDrMindSetfit();
  const { user } = useAuth();

  const activePlan = useMemo(() => loadActivePlan() as any, []);
  const draftStep1 = activePlan?.draft?.step1 ?? {};
  const planProfile = activePlan?.perfil ?? activePlan?.profile ?? {};

  const nome =
    draftStep1?.nomeCompleto ??
    draftStep1?.nome ??
    draftStep1?.fullName ??
    planProfile?.nomeCompleto ??
    planProfile?.nome ??
    planProfile?.fullName ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    (state as any)?.perfil?.nomeCompleto ??
    (state as any)?.perfil?.nome ??
    (state as any)?.user?.name ??
    (state as any)?.usuario?.nome ??
    user?.email?.split("@")[0] ??
    "Usuário";

  const email =
    user?.email ??
    (state as any)?.perfil?.email ??
    (state as any)?.user?.email ??
    planProfile?.email ??
    "—";

  const objetivo =
    draftStep1?.objetivo ??
    planProfile?.objetivo ??
    (state as any)?.perfil?.objetivo ??
    (state as any)?.objetivo ??
    "—";

  const peso =
    draftStep1?.peso ??
    (state as any)?.avaliacao?.peso ??
    (state as any)?.avaliacaoFisica?.peso ??
    (state as any)?.peso ??
    "—";

  const altura =
    draftStep1?.altura ??
    (state as any)?.avaliacao?.altura ??
    (state as any)?.avaliacaoFisica?.altura ??
    (state as any)?.altura ??
    "—";

  const avaliacao = ((state as any)?.avaliacao ?? {}) as Record<string, unknown>;
  const metodoAvaliativo = String(avaliacao?.metodoAvaliativo ?? "")
    .trim()
    .toLowerCase();

  const hasAssessmentDetails = useMemo(() => {
    const keys = [
      "percentualGordura",
      "percentualMassaMuscular",
      "gorduraKg",
      "massaMuscularKg",
      "dobraTriceps",
      "dobraSubescapular",
      "dobraAxilaMedia",
      "dobraSuprailiaca",
      "dobraTorax",
      "dobraCoxa",
      "dobraAbdomen",
      "cintura",
      "abdomen",
      "quadril",
      "torax",
    ];

    return keys.some((key) => hasFilledMetric(avaliacao?.[key]));
  }, [avaliacao]);

  const needsBodyAssessment =
    !metodoAvaliativo ||
    metodoAvaliativo === "nenhum" ||
    !hasAssessmentDetails;

  return (
    <div className="min-h-screen mf-app-bg mf-bg-neon px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="border-white/10 bg-black/20 text-white hover:bg-white/5"
            onClick={() => navigate(getHomeRoute())}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white backdrop-blur-xl">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                <UserRound className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <CardTitle className="text-2xl">Perfil</CardTitle>
                <p className="text-sm text-white/60">
                  Revise seus dados e complete informações do plano quando quiser.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-white/55">Nome</span>
              <span className="text-right font-semibold">{String(nome)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-white/55">Email</span>
              <span className="text-right font-semibold">{String(email)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-white/55">Objetivo</span>
              <span className="text-right font-semibold">{String(objetivo)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Peso
                </div>
                <div className="text-lg font-semibold">{String(peso)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  <Ruler className="h-3.5 w-3.5" />
                  Altura
                </div>
                <div className="text-lg font-semibold">{String(altura)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white backdrop-blur-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">Complementos do plano</CardTitle>
            <p className="text-sm text-white/60">
              Complete dados que ficaram para depois sem precisar refazer o onboarding inteiro.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">Avaliação corporal</div>
                  <div className="mt-1 text-sm text-white/60">
                    {needsBodyAssessment
                      ? "Você ainda pode completar bioimpedância, dobras cutâneas e medidas corporais para deixar o motor mais preciso."
                      : "Se quiser, você pode revisar ou atualizar bioimpedância, dobras e medidas corporais a qualquer momento."}
                  </div>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    needsBodyAssessment
                      ? "border border-amber-400/20 bg-amber-400/10 text-amber-200"
                      : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  }`}
                >
                  {needsBodyAssessment ? "Pendente" : "Preenchido"}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="ghost"
                  className="w-full overflow-hidden rounded-[18px] !bg-transparent bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white !shadow-none hover:bg-transparent sm:w-auto"
                  onClick={() => navigate("/onboarding/step-2?mode=recreate")}
                >
                  {needsBodyAssessment
                    ? "Completar avaliação"
                    : "Editar avaliação"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                  onClick={() => navigate("/onboarding/step-1?mode=recreate")}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reabrir onboarding completo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
