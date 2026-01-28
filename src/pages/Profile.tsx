import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const { state } = useDrMindSetfit();

  const nome =
    (state as any)?.perfil?.nome ??
    (state as any)?.user?.name ??
    (state as any)?.usuario?.nome ??
    "Usuário";

  const email =
    (state as any)?.perfil?.email ??
    (state as any)?.user?.email ??
    "—";

  const objetivo =
    (state as any)?.perfil?.objetivo ??
    (state as any)?.objetivo ??
    "—";

  const peso =
    (state as any)?.avaliacaoFisica?.peso ??
    (state as any)?.peso ??
    "—";

  const altura =
    (state as any)?.avaliacaoFisica?.altura ??
    (state as any)?.altura ??
    "—";

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl space-y-4">
        <Card className="glass-effect neon-border">
          <CardHeader>
            <CardTitle className="text-2xl">Perfil</CardTitle>
            <div className="text-sm text-gray-400">Dados do usuário (modo seguro, sem crash)</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Nome</span>
              <span className="font-semibold">{String(nome)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Email</span>
              <span className="font-semibold">{String(email)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Objetivo</span>
              <span className="font-semibold">{String(objetivo)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="text-xs text-gray-400">Peso</div>
                <div className="text-lg font-semibold">{String(peso)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="text-xs text-gray-400">Altura</div>
                <div className="text-lg font-semibold">{String(altura)}</div>
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
