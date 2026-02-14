import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { historyService, WorkoutRecord } from "@/services/history/HistoryService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function fmt(n: any, suffix = "") {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${Math.round(x)}${suffix}`;
}
function fmt1(n: any, suffix = "") {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x < 10 ? x.toFixed(2) : x.toFixed(1)}${suffix}`;
}

export default function WorkoutDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();

  const workout = useMemo(() => {
    if (!id) return null;
    const fn = (historyService as any).getWorkoutById;
    const list = (historyService as any).listWorkouts?.() ?? [];
    if (typeof fn === "function") return (fn as (id: string) => WorkoutRecord | null)(id);
    return (list as WorkoutRecord[]).find((w) => String((w as any)?.id) === String(id)) ?? null;
  }, [id]);

  const ts = Number((workout as any)?.ts ?? Date.now());
  const title = String((workout as any)?.title ?? (workout as any)?.type ?? "Sessão");
  const type = String((workout as any)?.type ?? "other");
  const modality = String((workout as any)?.modality ?? (workout as any)?.type ?? "other");

  const durationS =
    typeof (workout as any)?.durationS === "number"
      ? (workout as any).durationS
      : typeof (workout as any)?.durationMin === "number"
      ? (workout as any).durationMin * 60
      : undefined;

  const distanceM =
    typeof (workout as any)?.distanceM === "number"
      ? (workout as any).distanceM
      : typeof (workout as any)?.distanceKm === "number"
      ? (workout as any).distanceKm * 1000
      : undefined;

  const calories =
    typeof (workout as any)?.caloriesKcal === "number" ? (workout as any).caloriesKcal : undefined;

  const pse = typeof (workout as any)?.pse === "number" ? (workout as any).pse : undefined;
  const hr = typeof (workout as any)?.avgHeartRate === "number" ? (workout as any).avgHeartRate : undefined;

  const onDelete = () => {
    if (!workout || !id) return;
    const ok = window.confirm("Excluir esta sessão do histórico?");
    if (!ok) return;

    const del = (historyService as any).deleteWorkout;
    if (typeof del === "function") del(id);
    else {
      const list = ((historyService as any).listWorkouts?.() ?? []) as WorkoutRecord[];
      const next = list.filter((w) => String((w as any)?.id) !== String(id));
      try {
        localStorage.setItem("mf:history:workouts:v1", JSON.stringify(next));
      } catch {}
    }
    nav("/progress");
  };

  if (!workout) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Sessão não encontrada</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Essa sessão pode ter sido removida, ou o histórico ainda está vazio.
            <div className="mt-4">
              <Button variant="secondary" onClick={() => nav("/progress")}>
                Voltar para Progresso
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Button variant="outline" onClick={() => nav(-1)}>
          Voltar
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          Excluir sessão
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">{new Date(ts).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="border-white/10 bg-black/20">
                {type}
              </Badge>
              <Badge className="border-white/10 bg-white/10 text-white">{modality}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] text-muted-foreground">Duração</div>
              <div className="text-white font-semibold text-lg">
                {durationS != null ? fmt1(durationS / 60, " min") : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] text-muted-foreground">Distância</div>
              <div className="text-white font-semibold text-lg">
                {distanceM != null ? fmt1(distanceM / 1000, " km") : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] text-muted-foreground">Calorias</div>
              <div className="text-white font-semibold text-lg">{calories != null ? fmt(calories, " kcal") : "—"}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] text-muted-foreground">Esforço (PSE)</div>
              <div className="text-white font-semibold text-lg">{pse != null ? String(pse) : "—"}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-[11px] text-muted-foreground">FC média</div>
              <div className="text-white font-semibold text-lg">{hr != null ? fmt(hr, " bpm") : "—"}</div>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-muted-foreground">
            Dica: salve sessões GPS em <span className="text-white/80">/live-workout</span> para alimentar seu histórico automaticamente.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
