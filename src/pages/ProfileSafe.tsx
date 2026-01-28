import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ProfileSafe() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl space-y-4">
        <Card className="glass-effect neon-border">
          <CardHeader>
            <CardTitle className="text-2xl">Perfil</CardTitle>
            <div className="text-sm text-gray-400">
              Tela segura (sem dependência de contexto). Se algo do app estiver fora do Provider, aqui não crasha.
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm text-gray-400">Status</div>
              <div className="text-lg font-semibold">OK</div>
              <div className="text-xs text-gray-500 mt-1">
                Se a navegação pro Perfil quebrava por contexto/estado indefinido, esse fallback elimina o crash.
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button className="glow-blue" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
              <Button variant="outline" onClick={() => navigate("/planos")}>Planos Ativos</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
