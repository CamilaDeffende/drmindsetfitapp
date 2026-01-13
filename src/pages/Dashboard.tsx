import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, Footprints, Dumbbell, Home, MapPin, UtensilsCrossed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

export function Dashboard() {
  const { state } = useDrMindSetfit()
  const navigate = useNavigate()
  const [passosHoje, setPassosHoje] = useState(0)
  const [cargaSemana, setCargaSemana] = useState(0)
  const [horaAtual, setHoraAtual] = useState(new Date())

  // Atualizar hora a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraAtual(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simular contador de passos (em produção viria de um sensor)
  useEffect(() => {
    const dataHoje = format(new Date(), 'yyyy-MM-dd')
    const passosDia = state.passosDiarios.find(p => p.data === dataHoje)
    if (passosDia) {
      setPassosHoje(passosDia.passos)
    }
  }, [state.passosDiarios])

  // Calcular carga total da semana
  useEffect(() => {
    if (state.treino?.historicoCargas) {
      const hoje = new Date()
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1) // Segunda-feira

      const cargaTotal = state.treino.historicoCargas
        .filter(c => new Date(c.data) >= inicioSemana)
        .reduce((acc, c) => acc + c.cargaTotal, 0)

      setCargaSemana(cargaTotal)
    }
  }, [state.treino])

  // Dados para gráfico de calorias (últimos 7 dias)
  const dadosCalorias = Array.from({ length: 7 }, (_, i) => {
    const data = new Date()
    data.setDate(data.getDate() - (6 - i))
    const dataStr = format(data, 'yyyy-MM-dd')
    const consumo = state.consumoCalorias.find(c => c.data === dataStr)

    return {
      dia: format(data, 'EEE'),
      consumido: consumo?.consumido || 0,
      meta: state.nutricao?.macros.calorias || 2000
    }
  })

  // Dados para gráfico de carga semanal
  const dadosCarga = Array.from({ length: 7 }, (_, i) => {
    const data = new Date()
    const hoje = data.getDay()
    const diaSemana = (hoje === 0 ? 6 : hoje - 1) // Segunda = 0
    data.setDate(data.getDate() - diaSemana + i)
    const dataStr = format(data, 'yyyy-MM-dd')

    const cargaDia = state.treino?.historicoCargas
      .filter(c => c.data === dataStr)
      .reduce((acc, c) => acc + c.cargaTotal, 0) || 0

    return {
      dia: format(data, 'EEE'),
      carga: cargaDia
    }
  })

  if (!state.concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Complete seu Perfil</CardTitle>
            <CardDescription>
              Você precisa completar o questionário inicial para acessar o dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Iniciar Questionário
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header Mobile Optimized */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] bg-clip-text text-transparent hover:from-[#1E6BFF] hover:via-[#00B7FF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
              Dashboard
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate('/')}>
                <Home className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigate('/running')} className="hidden sm:flex">
                <MapPin className="w-4 h-4" />
              </Button>
              <Button onClick={() => navigate('/treino')} size="sm" className="sm:size-default">
                <Dumbbell className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Treinar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Resumo Rápido - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span className="truncate">Calorias</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{state.consumoCalorias[state.consumoCalorias.length - 1]?.consumido || 0}</div>
              <p className="text-xs text-muted-foreground truncate">Meta: {state.nutricao?.macros.calorias || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Footprints className="w-3 h-3 sm:w-4 sm:h-4 text-[#1E6BFF]" />
                <span className="truncate">Passos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{passosHoje.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground truncate">Meta: 10k</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4 text-[#1E6BFF]" />
                <span className="truncate">Carga</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{cargaSemana.toLocaleString()} kg</div>
              <p className="text-xs text-muted-foreground truncate">Semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                <span className="truncate">Hora</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{format(horaAtual, 'HH:mm:ss')}</div>
              <p className="text-xs text-muted-foreground truncate">{format(horaAtual, 'dd/MM/yyyy')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Calorias */}
          <Card>
            <CardHeader>
              <CardTitle>Consumo Calórico - Últimos 7 Dias</CardTitle>
              <CardDescription>Acompanhe seu consumo vs meta diária</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosCalorias}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="consumido" stroke="#3b82f6" name="Consumido" strokeWidth={2} />
                  <Line type="monotone" dataKey="meta" stroke="#10b981" name="Meta" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Carga */}
          <Card>
            <CardHeader>
              <CardTitle>Carga Total Semanal</CardTitle>
              <CardDescription>Volume de treino por dia (Segunda a Domingo)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosCarga}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="carga" fill="#8b5cf6" name="Carga (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Programas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {state.treino && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Programa de Treino</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {state.treino.divisaoSemanal} • {state.treino.frequencia}x por semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/treino')} size="lg" className="w-full">
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Iniciar Treino
                </Button>
              </CardContent>
            </Card>
          )}

          {state.nutricao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Planejamento Nutricional</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {state.nutricao.refeicoes.length} refeições • {state.nutricao.macros.calorias} kcal/dia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/nutrition')} size="lg" className="w-full" variant="outline">
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  Ver Dieta
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
