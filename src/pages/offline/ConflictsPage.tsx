
import { useOffline } from "@/hooks/useOffline/useOffline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function ConflictsPage() {
  const { conflicts, resolveConflict } = useOffline();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 p-3 rounded-xl">
            <AlertTriangle className="w-10 h-10 text-orange-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-orange-400">Conflitos</h1>
            <p className="text-gray-400">Resolução manual de sincronização</p>
          </div>
        </div>

        {conflicts.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-gray-400">Nenhum conflito pendente. ✅</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conflicts.map((c) => (
              <Card key={c.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Conflito: {c.id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => resolveConflict(c.id, "local")} className="bg-blue-600 hover:bg-blue-700">
                      Manter Local
                    </Button>
                    <Button onClick={() => resolveConflict(c.id, "remote")} variant="outline" className="border-gray-700">
                      Usar Remoto
                    </Button>
                    <Button onClick={() => resolveConflict(c.id, "merge")} className="bg-green-600 hover:bg-green-700">
                      Mesclar
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    <pre className="bg-gray-800 p-3 rounded-lg overflow-auto border border-gray-700">
{JSON.stringify(c.localData, null, 2)}
                    </pre>
                    <pre className="bg-gray-800 p-3 rounded-lg overflow-auto border border-gray-700">
{JSON.stringify(c.remoteData, null, 2)}
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
