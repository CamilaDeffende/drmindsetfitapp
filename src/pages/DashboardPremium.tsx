import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/branding/BrandIcon";
import {
  Activity,
  TrendingUp,
  Footprints,
  Dumbbell,
  MapPin,
  UtensilsCrossed,
  Calendar,
  Target,
  Zap,
  CalendarDays,
  Download,
  Home,
  ChevronDown,
  ChevronUp,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { loadActivePlan } from "@/services/plan.service";
import { getCanonicalTrainingWorkouts } from "@/services/training/activeTrainingSessions.bridge";
import { adaptActivePlanNutrition } from "@/services/nutrition/nutrition.adapter";
import { getCanonicalTrainingLoadHistory } from "@/services/training/trainingExecution.service";

type PassosDia = { data: string; passos: number };
type ConsumoDia = { data: string; consumido: number };
type CargaDia = {
  data: string;
  cargaTotal: number;
  exercicioId?: string;
  exercicioNome?: string;
};

function toNum(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sumMealMacros(meals: any[]) {
  const safeMeals = Array.isArray(meals) ? meals : [];

  return safeMeals.reduce(
    (acc, meal) => {
      const foods = Array.isArray(meal?.alimentos) ? meal.alimentos : [];

      for (const food of foods) {
        acc.protein += toNum(food?.proteinas ?? food?.protein ?? food?.proteinG, 0);
        acc.carbs += toNum(food?.carboidratos ?? food?.carbs ?? food?.carbsG, 0);
        acc.fat += toNum(food?.gorduras ?? food?.fat ?? food?.fatG, 0);
        acc.kcal += toNum(food?.calorias ?? food?.kcal, 0);
      }

      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, kcal: 0 }
  );
}

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

export function DashboardPremium() {
  const { state } = useDrMindSetfit();
  const navigate = useNavigate();

  const [activePlan, setActivePlan] = useState<any>(null);
  const [noPlan, setNoPlan] = useState(false);

  const [passosHoje, setPassosHoje] = useState(0);
  const [cargaHoje, setCargaHoje] = useState(0);
  const [cargaSemana, setCargaSemana] = useState(0);
  const [horaAtual, setHoraAtual] = useState(new Date());

  const [showFullMeals, setShowFullMeals] = useState(false);
  const [showWorkoutWeek, setShowWorkoutWeek] = useState(false);

  const adapted = adaptActivePlanNutrition(activePlan?.nutrition);

  useEffect(() => {
    try {
      setActivePlan(loadActivePlan());
    } catch {
      setActivePlan(null);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const hasCanonicalPlan = () => {
      try {
        const ap = loadActivePlan();
        const workouts = getCanonicalTrainingWorkouts();
        return !!ap || workouts.length > 0;
      } catch {
        return false;
      }
    };

    setNoPlan(!hasCanonicalPlan());

    const interval = window.setInterval(() => {
      setNoPlan(!hasCanonicalPlan());
    }, 1500);

    return () => window.clearInterval(interval);
  }, []);

  const passosDiarios: PassosDia[] = Array.isArray((state as any)?.passosDiarios)
    ? ((state as any).passosDiarios as PassosDia[])
    : [];

  const consumoCalorias: ConsumoDia[] = Array.isArray((state as any)?.consumoCalorias)
    ? ((state as any).consumoCalorias as ConsumoDia[])
    : [];

  const historicoCargas: CargaDia[] = (() => {
    const canonical = getCanonicalTrainingLoadHistory();
    if (Array.isArray(canonical) && canonical.length) return canonical as CargaDia[];
    return Array.isArray((state as any)?.treino?.historicoCargas)
      ? ((state as any).treino.historicoCargas as CargaDia[])
      : [];
  })();

  const nutrition = useMemo(() => {
    return (
      adapted ??
      activePlan?.nutrition ?? {
        kcalTarget: activePlan?.metabolic?.targetKcal ?? null,
        macros: activePlan?.nutrition?.macros ?? activePlan?.macros ?? null,
        meals: activePlan?.nutrition?.meals ?? activePlan?.meals ?? [],
        refeicoes: activePlan?.nutrition?.refeicoes ?? activePlan?.meals ?? [],
      }
    );
  }, [adapted, activePlan]);

  const meals = Array.isArray(nutrition?.refeicoes)
    ? nutrition.refeicoes
    : Array.isArray(nutrition?.meals)
    ? nutrition.meals
    : Array.isArray(activePlan?.meals)
    ? activePlan.meals
    : [];

  const derivedMealMacros = useMemo(() => sumMealMacros(meals), [meals]);

  const kcal =
    toNum(nutrition?.kcalTarget, NaN) ||
    toNum(nutrition?.kcal, NaN) ||
    toNum(activePlan?.nutrition?.kcalTarget, NaN) ||
    toNum(activePlan?.metabolic?.targetKcal, NaN) ||
    toNum(derivedMealMacros.kcal, 0);

  const protein =
    toNum(nutrition?.macros?.proteina, NaN) ||
    toNum(nutrition?.macros?.protein, NaN) ||
    toNum(nutrition?.macros?.proteinG, NaN) ||
    toNum(activePlan?.macros?.proteinG, NaN) ||
    toNum(derivedMealMacros.protein, 0);

  const carbs =
    toNum(nutrition?.macros?.carboidratos, NaN) ||
    toNum(nutrition?.macros?.carbs, NaN) ||
    toNum(nutrition?.macros?.carbsG, NaN) ||
    toNum(nutrition?.macros?.carbG, NaN) ||
    toNum(nutrition?.macros?.carbohydrates, NaN) ||
    toNum(activePlan?.macros?.carbsG, NaN) ||
    toNum(activePlan?.macros?.carbG, NaN) ||
    toNum(activePlan?.macros?.carbohydrates, NaN) ||
    toNum(derivedMealMacros.carbs, 0);

  const fat =
    toNum(nutrition?.macros?.gorduras, NaN) ||
    toNum(nutrition?.macros?.fat, NaN) ||
    toNum(nutrition?.macros?.fatG, NaN) ||
    toNum(activePlan?.macros?.fatG, NaN) ||
    toNum(derivedMealMacros.fat, 0);

  const nextMeal = useMemo(() => getNextMealByTime(meals), [meals]);

  const workoutWeek =
    activePlan?.training?.week ??
    activePlan?.training?.days ??
    activePlan?.workout?.week ??
    activePlan?.workout?.days ??
    [];

  const workoutFrequency =
    toNum(activePlan?.training?.frequency, NaN) ||
    (Array.isArray(activePlan?.training?.selectedDays)
      ? activePlan.training.selectedDays.length
      : NaN) ||
    (Array.isArray(workoutWeek) ? workoutWeek.length : 0);

  const workoutModality =
    activePlan?.training?.modality ??
    activePlan?.workout?.modality ??
    "musculacao";

  const userFirstName =
    (state as any)?.perfil?.nomeCompleto?.split(" ")?.[0] ?? "Usuário";

  useEffect(() => {
    const dataHoje = format(new Date(), "yyyy-MM-dd");
    const passosDia = passosDiarios.find((p) => p.data === dataHoje);
    if (passosDia) {
      setPassosHoje((prev) => Math.max(prev, passosDia.passos));
    } else {
      setPassosHoje(0);
    }
  }, [passosDiarios]);

  useEffect(() => {
    if (!historicoCargas.length) {
      setCargaHoje(0);
      setCargaSemana(0);
      return;
    }

    const hoje = new Date();
    const dataHoje = format(hoje, "yyyy-MM-dd");
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1);

    const cargaDia = historicoCargas
      .filter((c) => c.data === dataHoje)
      .reduce((acc, c) => acc + toNum(c.cargaTotal, 0), 0);

    const cargaTotal = historicoCargas
      .filter((c) => new Date(c.data) >= inicioSemana)
      .reduce((acc, c) => acc + toNum(c.cargaTotal, 0), 0);

    setCargaHoje(cargaDia);
    setCargaSemana(cargaTotal);
  }, [historicoCargas]);

  const dadosEvolucao = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const data = new Date();
      data.setDate(data.getDate() - (29 - i));
      const dataStr = format(data, "yyyy-MM-dd");

      const passos = passosDiarios.find((p) => p.data === dataStr)?.passos || 0;
      const carga =
        historicoCargas
          .filter((c) => c.data === dataStr)
          .reduce((acc, c) => acc + toNum(c.cargaTotal, 0), 0) || 0;

      const calorias =
        consumoCalorias.find((c) => c.data === dataStr)?.consumido || 0;

      return {
        data: format(data, "dd/MM"),
        passos: passos / 100,
        carga,
        calorias: calorias / 10,
      };
    });
  }, [passosDiarios, historicoCargas, consumoCalorias]);

  const metaPassos = 10000;
  const progressoPassos = Math.min((passosHoje / metaPassos) * 100, 100);
  const caloriasQueimadas = Math.floor(passosHoje * 0.04);

  const exportarPDF = async () => {
    try {
      const { exportarPDFCompleto } = await import("@/lib/exportar-pdf");
      await exportarPDFCompleto(state, passosHoje, cargaHoje, cargaSemana);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };

  if (!state.concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-full max-w-md mx-4 border-white/10 bg-white/5 text-white">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Complete seu Perfil</h2>
            <p className="text-gray-400 mb-6">
              Inicie o questionário para desbloquear sua experiência premium
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Iniciar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (noPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Card className="w-full max-w-xl mx-4 border-white/10 bg-white/5 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Nenhum plano ativo encontrado</h2>
                <p className="mt-2 text-sm text-gray-400">
                  Finalize a criação do seu plano ou abra um plano ativo para desbloquear o Dashboard Premium.
                </p>
              </div>
              <Target className="w-6 h-6 text-white/80" />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button className="w-full" onClick={() => navigate("/")}>
                Criar / Recriar plano
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => navigate("/planos-ativos")}
              >
                Ver planos ativos
              </Button>
            </div>

            <div className="mt-4 text-xs text-white/40">
              Dica: finalize o onboarding e confirme o plano para salvar tudo corretamente.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen mf-app-bg mf-bg-neon text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(5,8,16,0.78)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">

          <div className="grid grid-cols-[1fr_auto_1fr] items-center">

            {/* ESQUERDA */}
            <div className="flex items-center gap-3">

              <BrandIcon
                size={30}
                className="drop-shadow-[0_0_10px_rgba(0,190,255,0.35)] bg-transparent"
              />

              <div className="text-sm text-white/70">
                Seu plano completo liberado
              </div>

            </div>


            {/* CENTRO — relógio menor */}
            <div className="flex justify-center">

              <div className="rounded-xl border border-cyan-300/10 bg-[rgba(10,18,30,0.85)] px-4 py-2 text-center">
              
                <div className="text-[20px] font-semibold tracking-[0.08em] text-cyan-300">
                  {format(horaAtual, "HH:mm:ss")}
                </div>

                <div className="text-[10px] text-white/50">
                  {format(horaAtual, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </div>

              </div>

            </div>


            {/* DIREITA */}
            <div className="flex justify-end gap-2">

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/")}
                className="border-white/10 bg-black/20 text-white hover:bg-white/5"
              >
                <Home className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                onClick={exportarPDF}
                className="border-white/10 bg-black/20 text-white hover:bg-white/5"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>

            </div>

          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white overflow-hidden shadow-[0_0_40px_rgba(0,149,255,0.06)]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-300">
                  <Crown className="h-3.5 w-3.5" />
                  Premium ativo
                </div>

                <h2 className="mt-3 text-[28px] leading-[1.05] font-semibold tracking-tight text-white">
                  Olá, {userFirstName}
                </h2>

                <p className="mt-2 text-[14px] leading-6 text-white/60">
                  Seu plano completo já está liberado com alimentação, treino e acompanhamento.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] text-white/40">Meta diária</div>
                  <div className="mt-1 text-[24px] font-semibold text-white">{kcal || "—"}</div>
                  <div className="text-[11px] text-white/40">kcal</div>
                </div>

                <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="text-[11px] text-white/40">Treino semanal</div>
                  <div className="mt-1 text-[24px] font-semibold text-emerald-300">{workoutFrequency || 0}x</div>
                  <div className="text-[11px] text-white/40">{workoutModality}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white overflow-hidden shadow-[0_0_32px_rgba(0,149,255,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-[20px] font-semibold text-white">Resumo metabólico</h2>
                <p className="text-[13px] text-white/55 mt-1">
                  Base principal do seu plano atual.
                </p>
              </div>
              <Target className="w-5 h-5 text-cyan-300" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] text-white/40">Proteína</div>
                <div className="mt-1 text-[24px] font-semibold text-cyan-300">{protein || "—"}g</div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] text-white/40">Carboidratos</div>
                <div className="mt-1 text-[24px] font-semibold text-cyan-300">{carbs || "—"}g</div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] text-white/40">Gorduras</div>
                <div className="mt-1 text-[24px] font-semibold text-cyan-300">{fat || "—"}g</div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] text-white/40">Refeições</div>
                <div className="mt-1 text-[24px] font-semibold text-white">{meals.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white overflow-hidden shadow-[0_0_32px_rgba(0,149,255,0.04)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Atividade de Hoje</h2>
                  <p className="text-sm text-gray-400">{format(horaAtual, "HH:mm:ss")}</p>
                </div>
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>

              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.1)" strokeWidth="16" fill="none" />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradientPremium)"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressoPassos / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="gradientPremium" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgb(0, 149, 255)" />
                      <stop offset="100%" stopColor="rgb(34, 197, 94)" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Footprints className="w-8 h-8 text-[#1E6BFF] mb-2" />
                  <div className="text-3xl font-bold text-cyan-300">{passosHoje.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">de {metaPassos.toLocaleString()}</div>
                  <div className="text-sm text-green-400 mt-1">{progressoPassos.toFixed(0)}%</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1E6BFF]">{caloriasQueimadas}</div>
                  <div className="text-xs text-gray-400">KCAL</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{(passosHoje / 1312).toFixed(1)}</div>
                  <div className="text-xs text-gray-400">KM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1E6BFF]">{cargaHoje}</div>
                  <div className="text-xs text-gray-400">KG HOJE</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white overflow-hidden shadow-[0_0_32px_rgba(0,149,255,0.04)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Evolução - 30 Dias</h3>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dadosEvolucao}>
                  <defs>
                    <linearGradient id="colorPassos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(0, 149, 255)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="rgb(0, 149, 255)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCarga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(34, 197, 94)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="rgb(34, 197, 94)" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <XAxis dataKey="data" stroke="#666" style={{ fontSize: "10px" }} />
                  <YAxis stroke="#666" style={{ fontSize: "10px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area type="monotone" dataKey="passos" stroke="rgb(0, 149, 255)" fillOpacity={1} fill="url(#colorPassos)" />
                  <Area type="monotone" dataKey="carga" stroke="rgb(34, 197, 94)" fillOpacity={1} fill="url(#colorCarga)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white overflow-hidden shadow-[0_0_32px_rgba(0,149,255,0.04)]">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Plano alimentar</CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    {meals.length} refeições • {kcal || "—"} kcal/dia
                  </CardDescription>
                </div>
                <UtensilsCrossed className="w-5 h-5 text-cyan-300" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {nextMeal ? (
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[16px] font-semibold text-white">
                    Próxima refeição: {nextMeal?.nome ?? nextMeal?.name ?? "Refeição"}
                  </div>
                  <div className="mt-1 text-[13px] text-white/50">
                    {nextMeal?.horario ?? nextMeal?.time ?? "Horário a definir"}
                  </div>

                  {Array.isArray(nextMeal?.alimentos) && nextMeal.alimentos.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {nextMeal.alimentos.slice(0, 4).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white/75"
                        >
                          {item?.nome ?? item?.name ?? "Alimento"}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 text-sm text-white/50">
                  Nenhuma refeição encontrada no plano ativo.
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setShowFullMeals((v) => !v)}
                className="w-full rounded-[18px] border-white/15 bg-black/20 text-white hover:bg-white/5"
              >
                {showFullMeals ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ocultar plano alimentar
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver plano alimentar
                  </>
                )}
              </Button>

              {showFullMeals ? (
                <div className="space-y-4">
                  {meals.map((meal: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-[20px] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center gap-2 text-[14px] font-semibold text-white">
                        <CalendarDays className="h-4 w-4 text-cyan-300" />
                        {meal?.nome ?? meal?.name ?? `Refeição ${idx + 1}`}
                      </div>

                      <div className="mt-1 text-[13px] text-white/50">
                        {meal?.horario ?? meal?.time ?? "Horário a definir"}
                      </div>

                      {Array.isArray(meal?.alimentos) && meal.alimentos.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {meal.alimentos.map((item: any, i: number) => (
                            <div
                              key={i}
                              className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white/75"
                            >
                              {item?.nome ?? item?.name ?? "Alimento"}
                              {item?.gramas ? ` • ${item.gramas}g` : ""}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-[13px] text-white/45">
                          Nenhum alimento listado.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white overflow-hidden shadow-[0_0_32px_rgba(0,149,255,0.04)]">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Programa de treino</CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    {workoutModality} • {workoutFrequency}x por semana
                  </CardDescription>
                </div>
                <Dumbbell className="w-5 h-5 text-cyan-300" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-[16px] font-semibold text-white">Resumo semanal</div>
                <div className="mt-1 text-[13px] text-white/50">
                  {workoutFrequency} dias planejados • modalidade principal: {workoutModality}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowWorkoutWeek((v) => !v)}
                className="w-full rounded-[18px] border-white/15 bg-black/20 text-white hover:bg-white/5"
              >
                {showWorkoutWeek ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ocultar semana de treino
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver semana de treino
                  </>
                )}
              </Button>

              {showWorkoutWeek ? (
                Array.isArray(workoutWeek) && workoutWeek.length ? (
                  <div className="space-y-3">
                    {workoutWeek.slice(0, 7).map((day: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-[16px] border border-white/10 bg-black/20 p-4"
                      >
                        <div className="text-sm font-semibold text-white">
                          {day?.day ?? day?.dia ?? day?.label ?? `Dia ${idx + 1}`}
                        </div>
                        <div className="mt-1 text-xs text-white/50">
                          {day?.modality ?? day?.type ?? workoutModality}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 text-sm text-white/50">
                    Nenhum treino encontrado no plano ativo.
                  </div>
                )
              ) : null}

              <Button
                onClick={() => navigate("/treino")}
                variant="outline"
                className="w-full rounded-[18px] border-white/15 bg-black/20 text-white hover:bg-white/5"
              >
                Abrir treino
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white overflow-hidden shadow-[0_0_32px_rgba(0,149,255,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-100">Fases Avançadas</h2>
                <p className="text-sm text-gray-400">IA, GPS, wearables e progresso — acesso rápido</p>
              </div>
              <Target className="w-6 h-6 text-white/80" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Button variant="outline" className="justify-start gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/ai")}>
                <Activity className="w-4 h-4" />
                IA
              </Button>

              <Button variant="outline" className="justify-start gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/live-workout")}>
                <MapPin className="w-4 h-4" />
                GPS Live
              </Button>

              <Button variant="outline" className="justify-start gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/wearables")}>
                <Dumbbell className="w-4 h-4" />
                Wearables
              </Button>

              <Button variant="outline" className="justify-start gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/progress")}>
                <TrendingUp className="w-4 h-4" />
                Progresso
              </Button>

              <Button variant="outline" className="justify-start gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/achievements")}>
                <Zap className="w-4 h-4" />
                Conquistas
              </Button>

              <Button variant="outline" className="justify-start gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/conflicts")}>
                <Calendar className="w-4 h-4" />
                Offline
              </Button>

              {import.meta.env.DEV ? (
                <Button variant="outline" className="justify-start gap-2 border-white/10 bg-white/5 hover:bg-white/10 sm:col-span-3" onClick={() => navigate("/dev/engine")}>
                  <Target className="w-4 h-4" />
                  Dev Engine
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default DashboardPremium;