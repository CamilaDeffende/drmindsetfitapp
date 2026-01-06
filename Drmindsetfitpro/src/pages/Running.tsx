import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, Home, MapPin, TrendingUp, Timer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Running() {
  const navigate = useNavigate()
  const [correndo, setCorrendo] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [tempo, setTempo] = useState(0)
  const [distancia, setDistancia] = useState(0)
  const [velocidade, setVelocidade] = useState(0)
  const [elevacao, setElevacao] = useState(0)

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (correndo && !pausado) {
      interval = setInterval(() => {
        setTempo(t => t + 1)
        // Simular distância (em produção viria do GPS)
        setDistancia(d => d + (velocidade / 3600))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [correndo, pausado, velocidade])

  // GPS tracking (simulado - em produção usaria navigator.geolocation)
  useEffect(() => {
    if (correndo && !pausado) {
      // Simular velocidade entre 8-12 km/h
      setVelocidade(10 + Math.random() * 2)
      // Simular elevação
      setElevacao(prev => prev + (Math.random() - 0.5) * 2)
    }
  }, [correndo, pausado, tempo])

  const iniciarCorrida = () => {
    setCorrendo(true)
    setPausado(false)
  }

  const pausarCorrida = () => {
    setPausado(!pausado)
  }

  const finalizarCorrida = () => {
    setCorrendo(false)
    setPausado(false)
    // Aqui salvaria a corrida no estado global
    alert(`Corrida finalizada!\nTempo: ${formatarTempo(tempo)}\nDistância: ${distancia.toFixed(2)} km`)
    setTempo(0)
    setDistancia(0)
    setVelocidade(0)
    setElevacao(0)
  }

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
  }

  const calcularPace = () => {
    if (distancia === 0) return '--:--'
    const minutosPorKm = tempo / 60 / distancia
    const minutos = Math.floor(minutosPorKm)
    const segundos = Math.round((minutosPorKm - minutos) * 60)
    return `${minutos}:${segundos.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Running
          </h1>
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
            <Home className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Estatísticas em Tempo Real */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarTempo(tempo)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Distância
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{distancia.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">km</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Pace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calcularPace()}</div>
              <p className="text-xs text-muted-foreground">min/km</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Velocidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{velocidade.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">km/h</p>
            </CardContent>
          </Card>
        </div>

        {/* Mapa (Placeholder) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Trajeto GPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-950 dark:to-green-950 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                <p className="text-muted-foreground">
                  {correndo ? 'Rastreando sua localização...' : 'Inicie a corrida para rastrear'}
                </p>
                {correndo && (
                  <div className="mt-2">
                    <p className="text-sm">Elevação: {elevacao.toFixed(1)}m</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controles */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center gap-4">
              {!correndo && (
                <Button size="lg" onClick={iniciarCorrida} className="w-32">
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar
                </Button>
              )}

              {correndo && (
                <>
                  <Button size="lg" variant="outline" onClick={pausarCorrida} className="w-32">
                    <Pause className="w-5 h-5 mr-2" />
                    {pausado ? 'Retomar' : 'Pausar'}
                  </Button>
                  <Button size="lg" variant="destructive" onClick={finalizarCorrida} className="w-32">
                    <Square className="w-5 h-5 mr-2" />
                    Finalizar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico Placeholder */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Histórico de Corridas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Suas corridas aparecerão aqui após serem finalizadas</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
