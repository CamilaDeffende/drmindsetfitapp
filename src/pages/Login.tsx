import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  // DEV-ONLY: ajuste fino do tamanho da logo no Login (persistente)
  const MF_LOGO_KEY = "mf_login_logo_px";
  const [mfLogoPx, setMfLogoPx] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(MF_LOGO_KEY);
      const n = raw ? Number(raw) : NaN;
      if (Number.isFinite(n) && n >= 80 && n <= 260) return n;
    } catch {}
    return 180; // default premium
  });

  useEffect(() => {
    try { localStorage.setItem(MF_LOGO_KEY, String(mfLogoPx)); } catch {}
  }, [mfLogoPx]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await signIn(formData.email, formData.password);

    if (signInError) {
      setError("Email ou senha incorretos. Tente novamente.");
      setLoading(false);
      return;
    }

    toast({
      title: "Login realizado!",
      description: "Bem-vindo de volta ao DrMindSetfit",
    });

    navigate("/onboarding");
    setLoading(false);
  };

  return (
    <div className="bg-[radial-gradient(ellipse_at_top,_rgba(30,107,255,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(0,183,255,0.10),_transparent_60%)] min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-7">
        {/* HERO (premium): wordmark + tagline */}
        <div className="text-center mb-8 pt-2" data-ui="mindsetfit-login-hero">
          <img
          src="/brand/mindsetfit-wordmark.png"
          alt="MindsetFit"
          className="mx-auto w-auto bg-transparent select-none drop-shadow-[0_16px_45px_rgba(0,153,255,0.22)]"
          style={{ height: mfLogoPx }}
          draggable={false}
        />

        {import.meta.env.DEV && (
          <div className="mt-3 w-full max-w-sm px-4" data-ui="mfLoginLogoSlider">
            <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
              <span className="opacity-80">Logo</span>
              <input
                type="range"
                min={80}
                max={260}
                step={2}
                value={mfLogoPx}
                onChange={(e) => setMfLogoPx(Number(e.target.value))}
                className="w-52 accent-[#1E6BFF]"
              />
              <span className="tabular-nums">{mfLogoPx}px</span>
            </div>
          </div>
        )}
          <p className="mt-4 text-sm text-gray-400">
            Acesse sua conta e continue seu progresso com precisão.
          </p>
        </div>

        <Card className="glass-effect neon-border glass-effect neon-border shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_60px_rgba(0,0,0,0.55)] rounded-2xl">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center text-neon">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-center text-gray-300/80 leading-relaxed">
              Entre para acessar seus planos e relatórios premium.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-black/25 border border-white/10 rounded-xl h-12 px-4 focus-visible:ring-2 focus-visible:ring-[#1E6BFF]/40 focus-visible:border-white/20 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-black/25 border border-white/10 rounded-xl h-12 px-4 focus-visible:ring-2 focus-visible:ring-[#1E6BFF]/40 focus-visible:border-white/20 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm text-[#1E6BFF] hover:opacity-90 transition-opacity">
                  Esqueceu a senha?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full glow-blue h-12 font-semibold tracking-wide rounded-xl shadow-[0_10px_30px_rgba(30,107,255,0.20)] hover:opacity-95 transition-opacity">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="text-center text-sm text-gray-400">
                Não tem uma conta?{" "}
                <Link to="/signup" className="text-[#1E6BFF] hover:opacity-90 font-semibold transition-opacity">
                  Criar conta grátis
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          MindsetFit • Performance • Nutrição • Consistência
        </p>
      </div>
    </div>
  );
}
