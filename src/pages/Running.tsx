import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getHomeRoute } from "@/lib/subscription/premium";
import { Play, Pause, Square, ArrowLeft, MapPin, TrendingUp, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Running() {
  const navigate = useNavigate();
  const [correndo, setCorrendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [distancia, setDistancia] = useState(0);
  const [velocidade, setVelocidade] = useState(0);
  const [elevacao, setElevacao] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (correndo && !pausado) {
      interval = setInterval(() => {
        setTempo((t) => t + 1);
        setDistancia((d) => d + velocidade / 3600);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [correndo, pausado, velocidade]);

  useEffect(() => {
    if (correndo && !pausado) {
      setVelocidade(10 + Math.random() * 2);
      setElevacao((prev) => prev + (Math.random() - 0.5) * 2);
    }
  }, [correndo, pausado, tempo]);

  const iniciarCorrida = () => {
    setCorrendo(true);
    setPausado(false);
  };

  const pausarCorrida = () => {
    setPausado(!pausado);
  };

  const finalizarCorrida = () => {
    setCorrendo(false);
    setPausado(false);
    alert(`Corrida finalizada!\nTempo: ${formatarTempo(tempo)}\nDistância: ${distancia.toFixed(2)} km`);
    setTempo(0);
    setDistancia(0);
    setVelocidade(0);
    setElevacao(0);
  };

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  };

  const calcularPace = () => {
    if (distancia === 0) return "--:--";
    const minutosPorKm = tempo / 60 / distancia;
    const minutos = Math.floor(minutosPorKm);
    const segundos = Math.round((minutosPorKm - minutos) * 60);
    return `${minutos}:${segundos.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(getHomeRoute())}
            className="hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] bg-clip-text text-2xl font-bold text-transparent">
            Running
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Timer className="h-4 w-4" />
                Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarTempo(tempo)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
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
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Trajeto GPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 w-full items-center justify-center rounded-lg bg-gradient-to-br from-[#1E6BFF] to-green-100 dark:from-[#1E6BFF] dark:to-green-950">
              <div className="text-center">
                <MapPin className="mx-auto mb-2 h-12 w-12 text-[#1E6BFF]" />
                <p className="text-muted-foreground">
                  {correndo ? "Rastreando sua localização..." : "Inicie a corrida para rastrear"}
                </p>
                {correndo ? (
                  <div className="mt-2">
                    <p className="text-sm">Elevação: {elevacao.toFixed(1)}m</p>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center gap-4">
              {!correndo ? (
                <Button size="lg" onClick={iniciarCorrida} className="w-32">
                  <Play className="mr-2 h-5 w-5" />
                  Iniciar
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="outline" onClick={pausarCorrida} className="w-32">
                    <Pause className="mr-2 h-5 w-5" />
                    {pausado ? "Retomar" : "Pausar"}
                  </Button>
                  <Button size="lg" variant="destructive" onClick={finalizarCorrida} className="w-32">
                    <Square className="mr-2 h-5 w-5" />
                    Finalizar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Histórico de corridas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Suas corridas aparecerão aqui após serem finalizadas.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
