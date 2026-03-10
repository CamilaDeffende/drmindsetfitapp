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

export function Dashboard() {
  const { state } = useDrMindSetfit();
  const navigate = useNavigate();

  const [passosHoje, setPassosHoje] = useState(0);
  const [cargaSemana, setCargaSemana] = useState(0);
  const [horaAtual, setHoraAtual] = useState(new Date());

  const consumoCalorias = Array.isArray(state?.consumoCalorias)
    ? state.consumoCalorias
    : [];

  const passosDiarios = Array.isArray(state?.passosDiarios)
    ? state.passosDiarios
    : [];

  const historicoCargas = Array.isArray(state?.treino?.historicoCargas)
    ? state.treino.historicoCargas
    : [];

  const refeicoes = Array.isArray(state?.nutricao?.refeicoes)
    ? state.nutricao.refeicoes
    : [];

  const caloriasMeta = Number(state?.nutricao?.macros?.calorias ?? 2000);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dataHoje = format(new Date(), "yyyy-MM-dd");

    const passosDia = passosDiarios.find(
      (p: any) => p?.data === dataHoje
    );

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
      .reduce(
        (acc: number, c: any) => acc + Number(c?.cargaTotal ?? 0),
        0
      );

    setCargaSemana(cargaTotal);
  }, [historicoCargas]);

  const dadosCalorias = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const data = new Date();

        data.setDate(data.getDate() - (6 - i));

        const dataStr = format(data, "yyyy-MM-dd");

        const consumo = consumoCalorias.find(
          (c: any) => c?.data === dataStr
        );

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
            .reduce(
              (acc: number, c: any) =>
                acc + Number(c?.cargaTotal ?? 0),
              0
            ) || 0;

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

  if (!state?.concluido && !onboardingDone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Complete seu perfil</CardTitle>

            <CardDescription>
              Você precisa completar o questionário inicial
              para acessar o dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              onClick={() => navigate("/onboarding/step-1")}
              className="w-full"
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

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(5,8,16,0.78)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">
              <BrandIcon size={32} />

              <h1 className="text-[30px] font-semibold tracking-tight text-white">
                Olá, {nomeUsuario}
              </h1>
            </div>

            <div className="flex gap-2">

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

      {/* CTA PREMIUM */}

      <main className="mx-auto max-w-7xl px-4 py-6">

        <section className="mb-6 rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
                <Crown className="h-3.5 w-3.5" />
                Upgrade disponível
              </div>

              <h2 className="mt-3 text-[24px] font-semibold text-white">
                Seu plano premium está pronto
              </h2>

              <p className="mt-2 text-[14px] text-white/60">
                Desbloqueie treino completo, plano alimentar detalhado
                e recursos avançados do MindsetFit.
              </p>

            </div>

            <Button onClick={goPremium}>
              Ver premium
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

          </div>

        </section>

        {/* MÉTRICAS */}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-green-400" />
                Calorias
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-3xl font-semibold">
                {ultimoConsumo}
              </div>

              <p className="text-xs opacity-60">
                Meta: {caloriasMeta}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Footprints className="w-4 h-4 text-cyan-300" />
                Passos
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-3xl font-semibold">
                {passosHoje.toLocaleString()}
              </div>

              <p className="text-xs opacity-60">
                Meta: 10k
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Dumbbell className="w-4 h-4 text-cyan-300" />
                Carga
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-3xl font-semibold">
                {cargaSemana} kg
              </div>

              <p className="text-xs opacity-60">
                Semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                Hora
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-3xl font-semibold">
                {format(horaAtual, "HH:mm:ss")}
              </div>

              <p className="text-xs opacity-60">
                {format(horaAtual, "dd/MM/yyyy")}
              </p>
            </CardContent>
          </Card>

        </section>

      </main>
    </div>
  );
}

export default Dashboard;