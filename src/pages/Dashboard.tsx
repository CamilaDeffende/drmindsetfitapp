import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/branding/BrandIcon";
import {
  Activity,
  TrendingUp,
  Footprints,
  Dumbbell,
  Home,
  MapPin,
  UtensilsCrossed,
  Crown,
  Lock,
  ArrowRight,
  CalendarDays,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { loadActivePlan } from "@/services/plan.service";
import { getHomeRoute } from "@/lib/subscription/premium";

function getNextMealByTime(meals: any[]) {
  if (!Array.isArray(meals) || meals.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parsedMeals = meals
    .map((meal) => {
      const rawTime = String(meal?.horario ?? meal?.time ?? "").trim();
      const match = rawTime.match(/^(\d{1,2}):(\d{2})$/);

      if (!match) {
        return {
          meal,
          minutes: Number.POSITIVE_INFINITY,
          valid: false,
        };
      }

      const hours = Number(match[1]);
      const minutes = Number(match[2]);

      return {
        meal,
        minutes: hours * 60 + minutes,
        valid: true,
      };
    })
    .filter((item) => item.valid)
    .sort((a, b) => a.minutes - b.minutes);

  if (!parsedMeals.length) return meals[0] ?? null;

  const nextToday = parsedMeals.find((item) => item.minutes >= currentMinutes);
  if (nextToday) return nextToday.meal;

  return parsedMeals[0].meal;
}

export function Dashboard() {
  const { state } = useDrMindSetfit();
  const navigate = useNavigate();

  const [passosHoje, setPassosHoje] = useState(0);
  const [cargaSemana, setCargaSemana] = useState(0);
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [activePlan, setActivePlan] = useState<any>(null);

  useEffect(() => {
    try {
      setActivePlan(loadActivePlan());
    } catch {
      setActivePlan(null);
    }
  }, []);

  const consumoCalorias = Array.isArray((state as any)?.consumoCalorias)
    ? (state as any).consumoCalorias
    : [];

  const passosDiarios = Array.isArray((state as any)?.passosDiarios)
    ? (state as any).passosDiarios
    : [];

  const historicoCargas = Array.isArray((state as any)?.treino?.historicoCargas)
    ? (state as any).treino.historicoCargas
    : [];

  const nutrition =
    activePlan?.nutrition ??
    (state as any)?.nutricao ??
    (state as any)?.dieta ??
    (state as any)?.planoDieta ??
    {};

  const training =
    activePlan?.training ??
    activePlan?.workout ??
    (state as any)?.treino ??
    {};

  const refeicoes = Array.isArray(nutrition?.refeicoes)
    ? nutrition.refeicoes
    : Array.isArray(nutrition?.meals)
    ? nutrition.meals
    : Array.isArray(activePlan?.meals)
    ? activePlan.meals
    : [];

  const caloriasMeta = Number(
    nutrition?.kcalTarget ??
      nutrition?.kcal ??
      nutrition?.kcalAlvo ??
      nutrition?.macros?.calorias ??
      activePlan?.metabolic?.targetKcal ??
      (state as any)?.metabolismo?.caloriasAlvo ??
      2000
  );

  const proteina = Number(
    nutrition?.macros?.proteina ??
      nutrition?.macros?.protein ??
      activePlan?.macros?.proteinG ??
      0
  );

  const carboidratos = Number(
    nutrition?.macros?.carboidratos ??
      nutrition?.macros?.carbs ??
      activePlan?.macros?.carbsG ??
      activePlan?.macros?.carbG ??
      activePlan?.macros?.carbohydrates ??
      0
  );

  const gorduras = Number(
    nutrition?.macros?.gorduras ??
      nutrition?.macros?.fat ??
      activePlan?.macros?.fatG ??
      0
  );

  const treinoFrequencia = Number(
    training?.frequency ??
      (Array.isArray(training?.selectedDays) ? training.selectedDays.length : NaN) ??
      (Array.isArray(training?.week) ? training.week.length : NaN) ??
      (Array.isArray(training?.days) ? training.days.length : NaN) ??
      (state as any)?.treino?.frequencia ??
      0
  );

  const treinoModalidade =
    training?.modality ??
    training?.type ??
    (state as any)?.treino?.divisaoSemanal ??
    "Treino personalizado";

  const nomeUsuario =
    (state as any)?.perfil?.nomeCompleto?.split(" ")?.[0] ?? "Usuário";

  const onboardingDone = (() => {
    try {
      return localStorage.getItem("mf:onboarding:done:v1") === "1";
    } catch {
      return false;
    }
  })();

  const ultimoConsumo = consumoCalorias.length
    ? consumoCalorias[consumoCalorias.length - 1]?.consumido ?? 0
    : 0;

  const proximaRefeicao = useMemo(() => getNextMealByTime(refeicoes), [refeicoes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dataHoje = format(new Date(), "yyyy-MM-dd");
    const passosDia = passosDiarios.find((p: any) => p?.data === dataHoje);

    if (passosDia) {
      setPassosHoje(Number(passosDia.passos ?? 0));
    } else {
      setPassosHoje(0);
    }
  }, [passosDiarios]);

  useEffect(() => {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1);

    const cargaTotal = historicoCargas
      .filter((c: any) => c?.data && new Date(c.data) >= inicioSemana)
      .reduce((acc: number, c: any) => acc + Number(c?.cargaTotal ?? 0), 0);

    setCargaSemana(cargaTotal);
  }, [historicoCargas]);

  const dadosCalorias = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const data = new Date();
        data.setDate(data.getDate() - (6 - i));
        const dataStr = format(data, "yyyy-MM-dd");
        const consumo = consumoCalorias.find((c: any) => c?.data === dataStr);

        return {
          dia: format(data, "EEE"),
          consumido: Number(consumo?.consumido ?? 0),
          meta: caloriasMeta,
        };
      }),
    [consumoCalorias, caloriasMeta]
  );

  const dadosCarga = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const data = new Date();
        const hoje = data.getDay();
        const diaSemana = hoje === 0 ? 6 : hoje - 1;
        data.setDate(data.getDate() - diaSemana + i);
        const dataStr = format(data, "yyyy-MM-dd");

        const cargaDia =
          historicoCargas
            .filter((c: any) => c?.data === dataStr)
            .reduce((acc: number, c: any) => acc + Number(c?.cargaTotal ?? 0), 0) || 0;

        return {
          dia: format(data, "EEE"),
          carga: cargaDia,
        };
      }),
    [historicoCargas]
  );

  const goPremium = () => {
    navigate("/assinatura?source=dashboard-free", { replace: true });
  };

  if (!(state as any)?.concluido && !onboardingDone) {
    return (
      <div className="min-h-screen mf-app-bg mf-bg-neon flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
          <CardHeader>
            <CardTitle>Complete seu perfil</CardTitle>
            <CardDescription className="text-white/60">
              Você precisa completar o questionário inicial para acessar o dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              onClick={() => navigate("/onboarding/step-1")}
              className="w-full rounded-[18px] bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white"
            >
              Iniciar questionário
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen mf-app-bg mf-bg-neon text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(5,8,16,0.78)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BrandIcon size={32} className="drop-shadow-[0_0_12px_rgba(0,190,255,0.35)]" />
              <h1 className="text-[30px] font-semibold tracking-tight text-white">
                Olá, {nomeUsuario}
              </h1>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(getHomeRoute())}
                className="border-white/10 bg-black/20 text-white hover:bg-white/5"
              >
                <Home className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={goPremium}
                className="border-white/10 bg-black/20 text-white hover:bg-white/5 hidden sm:flex"
              >
                <MapPin className="w-4 h-4" />
              </Button>

              <Button
                onClick={goPremium}
                className="rounded-[18px] border border-cyan-300/20 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white"
              >
                <Dumbbell className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Treinar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-6 rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_40px_rgba(0,149,255,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
                <Crown className="h-3.5 w-3.5" />
                Upgrade disponível
              </div>

              <h2 className="mt-3 text-[24px] font-semibold tracking-tight text-white">
                Seu plano premium está pronto
              </h2>

              <p className="mt-2 text-[14px] leading-6 text-white/60">
                Desbloqueie treino completo, plano alimentar detalhado e recursos avançados do MindsetFit.
              </p>
            </div>

            <div className="shrink-0">
              <Button
                onClick={goPremium}
                className="h-12 rounded-[18px] border border-cyan-300/20 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] px-5 text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)]"
              >
                Ver premium
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span>Calorias</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{ultimoConsumo}</div>
              <p className="text-xs text-white/55 mt-1">Meta: {caloriasMeta}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Footprints className="w-4 h-4 text-cyan-300" />
                <span>Passos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{passosHoje.toLocaleString()}</div>
              <p className="text-xs text-white/55 mt-1">Meta: 10k</p>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-cyan-300" />
                <span>Carga</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{cargaSemana.toLocaleString()} kg</div>
              <p className="text-xs text-white/55 mt-1">Semana</p>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span>Hora</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{format(horaAtual, "HH:mm:ss")}</div>
              <p className="text-xs text-white/55 mt-1">{format(horaAtual, "dd/MM/yyyy")}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader>
              <CardTitle>Consumo calórico · últimos 7 dias</CardTitle>
              <CardDescription className="text-white/60">
                Acompanhe seu consumo vs meta diária
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosCalorias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                  <XAxis dataKey="dia" stroke="rgba(255,255,255,0.45)" />
                  <YAxis stroke="rgba(255,255,255,0.45)" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(8,10,18,0.96)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                  />
                  <Line type="monotone" dataKey="consumido" stroke="#3b82f6" name="Consumido" strokeWidth={2} />
                  <Line type="monotone" dataKey="meta" stroke="#10b981" name="Meta" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader>
              <CardTitle>Carga total semanal</CardTitle>
              <CardDescription className="text-white/60">
                Volume de treino por dia (segunda a domingo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosCarga}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                  <XAxis dataKey="dia" stroke="rgba(255,255,255,0.45)" />
                  <YAxis stroke="rgba(255,255,255,0.45)" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(8,10,18,0.96)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="carga" fill="#8b5cf6" name="Carga (kg)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Resumo da dieta gerada</CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    Prévia do plano alimentar estruturado no onboarding
                  </CardDescription>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  <Lock className="h-3 w-3" />
                  Premium
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-center">
                  <div className="text-[11px] text-white/40">Proteína</div>
                  <div className="mt-1 text-[22px] font-semibold text-cyan-300">
                    {proteina || "—"}g
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-center">
                  <div className="text-[11px] text-white/40">Carbo</div>
                  <div className="mt-1 text-[22px] font-semibold text-cyan-300">
                    {carboidratos || "—"}g
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-center">
                  <div className="text-[11px] text-white/40">Gorduras</div>
                  <div className="mt-1 text-[22px] font-semibold text-cyan-300">
                    {gorduras || "—"}g
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-[13px] font-medium text-white/80">
                  <Flame className="h-4 w-4 text-orange-300" />
                  Meta diária
                </div>

                <div className="mt-2 text-[28px] font-semibold text-white">
                  {caloriasMeta} kcal
                </div>

                <div className="mt-1 text-[12px] text-white/45">
                  {refeicoes.length} refeições planejadas
                </div>
              </div>

              <Button
                onClick={goPremium}
                size="lg"
                className="w-full rounded-[18px] border border-cyan-300/20 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white"
              >
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Desbloquear dieta completa
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Próxima refeição</CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    Preview do que já foi gerado para o seu plano
                  </CardDescription>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  <Lock className="h-3 w-3" />
                  Premium
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {proximaRefeicao ? (
                <div className="space-y-4">
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-white/80">
                      <CalendarDays className="h-4 w-4 text-cyan-300" />
                      {proximaRefeicao.nome ?? proximaRefeicao.name ?? "Refeição"}
                    </div>

                    <div className="mt-2 text-[14px] text-white/50">
                      {proximaRefeicao.horario ?? proximaRefeicao.time ?? "Horário a definir"}
                    </div>

                    {Array.isArray(proximaRefeicao.alimentos) &&
                    proximaRefeicao.alimentos.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {proximaRefeicao.alimentos.slice(0, 3).map((item: any, idx: number) => (
                          <div
                            key={`${item?.nome ?? item?.name ?? "item"}-${idx}`}
                            className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white/75"
                          >
                            {item?.nome ?? item?.name ?? "Alimento"}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 text-[13px] text-white/45">
                        Nenhum alimento listado ainda.
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={goPremium}
                    size="lg"
                    variant="outline"
                    className="w-full rounded-[18px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
                  >
                    Ver plano alimentar completo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 text-[13px] text-white/50">
                    Ainda não encontramos a próxima refeição no plano salvo.
                  </div>

                  <Button
                    onClick={goPremium}
                    size="lg"
                    variant="outline"
                    className="w-full rounded-[18px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
                  >
                    Desbloquear premium
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Programa de treino</CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    {treinoModalidade} • {Number.isFinite(treinoFrequencia) ? treinoFrequencia : 0}x por semana
                  </CardDescription>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  <Lock className="h-3 w-3" />
                  Premium
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Button
                onClick={goPremium}
                size="lg"
                className="w-full rounded-[18px] border border-cyan-300/20 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Desbloquear treino
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Planejamento nutricional</CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    {refeicoes.length} refeições • {caloriasMeta} kcal/dia
                  </CardDescription>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  <Lock className="h-3 w-3" />
                  Premium
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Button
                onClick={goPremium}
                size="lg"
                className="w-full rounded-[18px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
                variant="outline"
              >
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Ver dieta completa
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;