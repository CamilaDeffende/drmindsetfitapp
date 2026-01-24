 
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Activity,
  TrendingUp,
  Footprints,
  Dumbbell,
  MapPin,
  UtensilsCrossed,
  Calendar,
  Target,
  Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DashboardPremium() {
  
const { state } = useDrMindSetfit()


// SAFE_STATE_DASHBOARD_V1 (anti-crash + typed locally)
type __PassosDia = { data: string; passos: number };
type __ConsumoDia = { data: string; consumido: number };
type __CargaDia = { data: string; cargaTotal: number; exercicioId?: string; exercicioNome?: string };
type __TreinoDia = { dia: string; foco?: string; grupamentos?: string[]; exercicios: any[]; observacoes?: string };

const passosDiarios: __PassosDia[] = Array.isArray((state as any)?.passosDiarios) ? ((state as any).passosDiarios as __PassosDia[]) : [];
const consumoCalorias: __ConsumoDia[] = Array.isArray((state as any)?.consumoCalorias) ? ((state as any).consumoCalorias as __ConsumoDia[]) : [];
const treinosSemana: __TreinoDia[] = Array.isArray((state as any)?.treino?.treinos) ? (((state as any).treino.treinos) as __TreinoDia[]) : [];
const historicoCargas: __CargaDia[] = Array.isArray((state as any)?.treino?.historicoCargas) ? (((state as any).treino.historicoCargas) as __CargaDia[]) : [];
// ===============================
// SAFE STATE (anti-crash)
// ===============================
const navigate = useNavigate()
  const [passosHoje, setPassosHoje] = useState(0)
  const [cargaHoje, setCargaHoje] = useState(0)
  const [cargaSemana, setCargaSemana] = useState(0)
  const [horaAtual, setHoraAtual] = useState(new Date())

  // Atualizar hora em tempo real
  useEffect(() => {
    const interval = setInterval(() => setHoraAtual(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Tracking GPS para passos
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Simular contagem de passos baseado em movimento
          if (position.coords.speed && position.coords.speed > 0.5) {
            setPassosHoje(prev => prev + Math.floor(Math.random() * 3 + 1))
          }
        },
        (error) => console.log('GPS Error:', error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Calcular passos do dia
  useEffect(() => {
    const dataHoje = format(new Date(), 'yyyy-MM-dd')
    const passosDia = passosDiarios.find((p: any) => p.data === dataHoje)
    if (passosDia) {
      setPassosHoje(prev => Math.max(prev, passosDia.passos))
    }
  }, [passosDiarios])

  // Calcular carga total de hoje e da semana
  useEffect(() => {
    if (historicoCargas.length) {
      const hoje = new Date()
      const dataHoje = format(hoje, "yyyy-MM-dd")
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1)

      const cargaDia = historicoCargas
        .filter((c) => c.data === dataHoje)
        .reduce((acc, c) => acc + (Number(c.cargaTotal) || 0), 0)

      const cargaTotal = historicoCargas
        .filter((c) => new Date(c.data) >= inicioSemana)
        .reduce((acc, c) => acc + (Number(c.cargaTotal) || 0), 0)

      setCargaHoje(cargaDia)
      setCargaSemana(cargaTotal)
    }
  }, [historicoCargas])// Dados para gráfico de evolução (últimos 30 dias)
  const dadosEvolucao = Array.from({ length: 30 }, (_, i) => {
    const data = new Date()
    data.setDate(data.getDate() - (29 - i))
    const dataStr = format(data, 'yyyy-MM-dd')

    const passos = passosDiarios.find((p: any) => p.data === dataStr)?.passos || 0
    const carga = historicoCargas
      .filter((c: any) => c.data === dataStr)
      .reduce((acc: any, c: any) => acc + c.cargaTotal, 0) || 0
    const calorias = consumoCalorias.find((c: any) => c.data === dataStr)?.consumido || 0

    return {
      data: format(data, 'dd/MM'),
      passos: passos / 100,
      carga,
      calorias: calorias / 10
    }
  })

  const metaPassos = 10000
  const progressoPassos = Math.min((passosHoje / metaPassos) * 100, 100)
  const caloriasQueimadas = Math.floor(passosHoje * 0.04)

  const exportarPDF = async () => {
    try {
      const { exportarPDFCompleto } = await import('@/lib/exportar-pdf')
      await exportarPDFCompleto(state, passosHoje, cargaHoje, cargaSemana)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    }

  // TS6133 guard (mantém função disponível sem quebrar lint/type-check)
  void exportarPDF;
  }

  if (!state.concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-full max-w-md mx-4 glass-effect neon-border">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-neon mb-4">Complete seu Perfil</h2>
            <p className="text-gray-400 mb-6">Inicie o questionário para desbloquear sua experiência premium</p>
            <Button onClick={() => navigate('/')} className="w-full glow-blue">
              Iniciar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Header Premium Mobile */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neon">Dashboard</h1>
              <p className="text-xs text-gray-400">{format(horaAtual, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Anel de Progresso Principal - Estilo Apple */}
        <Card className="glass-effect neon-border overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-100">Atividade de Hoje</h2>
                <p className="text-sm text-gray-400">{format(horaAtual, 'HH:mm:ss')}</p>
              </div>
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>

            {/* Círculo de Progresso de Passos */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="transform -rotate-90 w-48 h-48">
                {/* Background circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="16"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#gradient)"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressoPassos / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(0, 149, 255)" />
                    <stop offset="100%" stopColor="rgb(34, 197, 94)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Footprints className="w-8 h-8 text-[#1E6BFF] mb-2" />
                <div className="text-3xl font-bold text-neon">{passosHoje.toLocaleString()}</div>
                <div className="text-xs text-gray-400">de {metaPassos.toLocaleString()}</div>
                <div className="text-sm text-green-400 mt-1">{progressoPassos.toFixed(0)}%</div>
              </div>
            </div>

            {/* Métricas Rápidas */}
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

        {/* Cards de Métricas Premium */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-effect border-[#1E6BFF]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-[#1E6BFF]/20">
                  <Activity className="w-5 h-5 text-[#1E6BFF]" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Calorias</div>
                  <div className="text-xl font-bold">{((consumoCalorias && consumoCalorias.length) ? (consumoCalorias[consumoCalorias.length-1]?.consumido ?? 0) : 0)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Meta: {(state.nutricao?.macros?.calorias ?? 0)}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-green-500/20">
                  <Dumbbell className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Carga Semana</div>
                  <div className="text-xl font-bold">{cargaSemana.toLocaleString()}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">kg totais</div>
            </CardContent>
          </Card>
        </div>


        {/* DASH_ACTIVE_WORKOUTS_V1 */}
        <Card className="glass-effect neon-border overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-100">Treinos Ativos</h3>
                <p className="text-xs text-gray-400">
                  Mesmo plano gerado no Step 5 (Protocolo semanal)
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/treino")}
                className="border-white/10 bg-white/5 hover:bg-white/10"
              >
                Abrir Treino
              </Button>
            </div>

            {treinosSemana.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {treinosSemana.slice(0, 4).map((dia, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{dia?.dia || "Dia"}</div>
                      <div className="text-xs text-gray-400">
                        {(dia?.exercicios?.length ?? 0)} exercícios
                      </div>
                    </div>

                    {dia?.foco ? (
                      <div className="mt-1 text-xs text-gray-400">{dia.foco}</div>
                    ) : null}

                    <div className="mt-3 space-y-1">
                      {(dia?.exercicios ?? []).slice(0, 4).map((ex: any, eIdx: number) => (
                        <div key={eIdx} className="text-xs text-muted-foreground">
                          • <span className="text-foreground/90">{ex?.nome ?? ex?.exercicio?.nome ?? "Exercício"}</span>
                          {ex?.series ? <> — {ex.series}x{ex?.reps ?? ""}</> : null}
                          {ex?.repeticoes ? <> — {String(ex.repeticoes)}</> : null}
                          {ex?.descanso ? <> • Desc: {ex.descanso}</> : null}
                        </div>
                      ))}
                      {(dia?.exercicios?.length ?? 0) > 4 ? (
                        <div className="text-xs text-gray-500">+ {(dia.exercicios.length - 4)} exercícios</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <div className="text-sm font-semibold text-gray-100">Nenhum treino ativo ainda</div>
                <div className="mt-1 text-xs text-gray-400">
                  Vá no onboarding (Step 5) e clique em <span className="font-medium">Gerar minha semana</span>.
                </div>
                <div className="mt-4">
                  <Button onClick={() => navigate("/onboarding")} className="glow-blue">
                    Ir para Onboarding
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Evolução - 30 Dias */}
        <Card className="glass-effect neon-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Evolução - 30 Dias</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dadosEvolucao}>
                <defs>
                  <linearGradient id="colorPassos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(0, 149, 255)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="rgb(0, 149, 255)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCarga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(34, 197, 94)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="rgb(34, 197, 94)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="data" stroke="#666" style={{ fontSize: '10px' }} />
                <YAxis stroke="#666" style={{ fontSize: '10px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="passos" stroke="rgb(0, 149, 255)" fillOpacity={1} fill="url(#colorPassos)" />
                <Area type="monotone" dataKey="carga" stroke="rgb(34, 197, 94)" fillOpacity={1} fill="url(#colorCarga)" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1E6BFF]"></div>
                <span className="text-gray-400">Passos (x100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-400">Carga (kg)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-2 gap-4 pb-6">
          <Button
            onClick={() => navigate('/planos-ativos')}
            className="h-16 glass-effect border-green-500/50 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
          >
            <div className="flex flex-col items-center gap-1">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-xs text-green-400 font-semibold">Planos Ativos</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/report')}
            variant="outline"
            className="h-16 glass-effect border-[#1E6BFF]/50 bg-gradient-to-br from-[#1E6BFF]/10 to-[#00B7FF]/5"
          >
            <div className="flex flex-col items-center gap-1">
              <Activity className="w-5 h-5 text-[#1E6BFF]" />
              <span className="text-xs text-[#1E6BFF] font-semibold">Relatório</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/treino')}
            variant="outline"
            className="h-16 glass-effect border-[#1E6BFF]/50"
          >
            <div className="flex flex-col items-center gap-1">
              <Dumbbell className="w-5 h-5 text-[#1E6BFF]" />
              <span className="text-xs">Treinar</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/nutrition')}
            variant="outline"
            className="h-16 glass-effect border-yellow-500/50"
          >
            <div className="flex flex-col items-center gap-1">
              <UtensilsCrossed className="w-5 h-5 text-yellow-400" />
              <span className="text-xs">Nutrição</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/running')}
            variant="outline"
            className="h-16 glass-effect border-[#1E6BFF]/50"
          >
            <div className="flex flex-col items-center gap-1">
              <MapPin className="w-5 h-5 text-[#1E6BFF]" />
              <span className="text-xs">Corrida</span>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="h-16 glass-effect border-cyan-500/50"
          >
            <div className="flex flex-col items-center gap-1">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span className="text-xs">Perfil</span>
            </div>
          </Button>
        </div>
      </main>
    </div>
  )
}
