import { useState } from "react";
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
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* HERO (premium): wordmark + tagline */}
        <div className="text-center mb-8 pt-2" data-ui="mindsetfit-login-hero">
          <img
            src="/brand/mindsetfit-wordmark.png"
            alt="MindsetFit"
            className="mx-auto h-16 sm:h-20 md:h-24 w-auto bg-transparent select-none"
            draggable={false}
          />
          <p className="mt-4 text-sm text-gray-400">
            Acesse sua conta e continue seu progresso com precisão.
          </p>
        </div>

        <Card className="glass-effect neon-border">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl text-center text-neon font-extrabold">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-center text-gray-300/80">
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
                  className="bg-black/20"
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
                  className="bg-black/20"
                />
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm text-[#1E6BFF] hover:opacity-90 transition-opacity">
                  Esqueceu a senha?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full glow-blue h-12">
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
