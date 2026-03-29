import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useOffline } from "@/hooks/useOffline/useOffline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getHomeRoute } from "@/lib/subscription/premium";

export function ConflictsPage() {
  const navigate = useNavigate();
  const { conflicts, resolveConflict } = useOffline();

  return (
    <div className="min-h-screen mf-app-bg mf-bg-neon text-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(getHomeRoute())}
              className="rounded-xl text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="rounded-xl bg-orange-500/10 p-3">
              <AlertTriangle className="h-10 w-10 text-orange-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-orange-400 sm:text-4xl">Conflitos</h1>
              <p className="text-sm text-white/60">Resolução manual de sincronização</p>
            </div>
          </div>
        </div>

        {conflicts.length === 0 ? (
          <Card className="mt-6 border-white/10 bg-[rgba(8,10,18,0.82)]">
            <CardContent className="p-6 text-white/60">Nenhum conflito pendente.</CardContent>
          </Card>
        ) : (
          <div className="mt-6 space-y-4">
            {conflicts.map((conflict: any) => (
              <Card key={conflict.id} className="border-white/10 bg-[rgba(8,10,18,0.82)]">
                <CardHeader>
                  <CardTitle className="text-white">Conflito: {conflict.id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => resolveConflict(conflict.id, "local")} className="bg-blue-600 hover:bg-blue-700">
                      Manter local
                    </Button>
                    <Button
                      onClick={() => resolveConflict(conflict.id, "remote")}
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      Usar remoto
                    </Button>
                    <Button onClick={() => resolveConflict(conflict.id, "merge")} className="bg-green-600 hover:bg-green-700">
                      Mesclar
                    </Button>
                  </div>

                  <div className="grid gap-3 text-xs md:grid-cols-2">
                    <pre className="overflow-auto rounded-lg border border-white/10 bg-black/30 p-3">
{JSON.stringify(conflict.localData, null, 2)}
                    </pre>
                    <pre className="overflow-auto rounded-lg border border-white/10 bg-black/30 p-3">
{JSON.stringify(conflict.remoteData, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
