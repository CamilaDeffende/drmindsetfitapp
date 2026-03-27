import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ChevronLeft } from "lucide-react";
import { getHomeRoute } from "@/lib/subscription/premium";


function getParams(search: string) {
  try {
    return new URLSearchParams(search);
  } catch {
    return new URLSearchParams();
  }
}

const PENDING_IMPORT_KEY = "mf:pendingProfileImport:v1";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = React.useMemo(() => getParams(location.search), [location.search]);

  const next = params.get("next") || getHomeRoute();
  const source = params.get("source") || "";
  const premiumFromUrl = params.get("premium") === "1";
  const planFromUrl = params.get("plan") || "mensal";
  const shouldImportGuestState = params.has("next");

  const { user, signIn, signOut, loading } = useAuth();

  const [email, setEmail] = React.useState(user?.email ?? "");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const signupHref = React.useMemo(() => {
    const nextParams = new URLSearchParams();
    nextParams.set("next", next);
    if (source) nextParams.set("source", source);

    if (premiumFromUrl) nextParams.set("premium", "1");
    if (planFromUrl) nextParams.set("plan", planFromUrl);

    return `/signup?${nextParams.toString()}`;
  }, [next, premiumFromUrl, planFromUrl]);

  React.useEffect(() => {
    if (!loading && user) {
      if (premiumFromUrl) {
        try {
          localStorage.setItem("mindsetfit:isSubscribed", "true");
        } catch {}

        try {
          localStorage.setItem(
            "mindsetfit:subscription:v1",
            JSON.stringify({
              planId: planFromUrl,
              kind: "paid",
              active: true,
              activatedAt: Date.now(),
            })
          );
        } catch {}
      }

      navigate(next, { replace: true });
    }
  }, [user, loading, next, navigate, premiumFromUrl, planFromUrl]);

  const backTarget =
    source === "onboarding"
      ? "/onboarding/step-1"
      : params.get("next")
        ? "/assinatura"
        : "/onboarding/step-1";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const eMail = email.trim();

    if (!eMail) {
      setError("Informe seu email.");
      return;
    }

    if (!password.trim()) {
      setError("Informe sua senha.");
      return;
    }

    setSubmitting(true);

    try {
      try {
        if (shouldImportGuestState) {
          localStorage.setItem(PENDING_IMPORT_KEY, "1");
        } else {
          localStorage.removeItem(PENDING_IMPORT_KEY);
        }
      } catch {}

      const { error } = await signIn(eMail, password);

      if (error) {
        setError(error.message || "Não foi possível entrar. Verifique seus dados.");
        return;
      }

      if (premiumFromUrl) {
        try {
          localStorage.setItem("mindsetfit:isSubscribed", "true");
        } catch {}

        try {
          localStorage.setItem(
            "mindsetfit:subscription:v1",
            JSON.stringify({
              planId: planFromUrl,
              kind: "paid",
              active: true,
              activatedAt: Date.now(),
            })
          );
        } catch {}
      }

      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh mf-app-bg mf-bg-neon text-white">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-10 pt-8">
        <div className="flex items-center gap-3">
          <BrandIcon size={80} className="drop-shadow-[0_0_16px_rgba(0,190,255,0.35)]" />

          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-tight text-white/90">
              Entrar
            </div>
            <div className="text-[12px] text-white/60">
              MindsetFit • Acesse sua conta
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(backTarget)}
            className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/10 active:scale-[0.99]"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </button>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-6 shadow-[0_0_40px_rgba(0,149,255,0.08)]">
          <div className="mb-5 text-center">
            <BrandIcon
              size={120}
              className="mx-auto mb-4 drop-shadow-[0_0_16px_rgba(0,190,255,0.35)]"
            />

            <h1 className="text-[24px] font-semibold tracking-tight text-white">
              Bem-vindo de volta
            </h1>

            <p className="mt-2 text-[13px] leading-5 text-white/60">
              Entre para acessar seu plano, acompanhar a evolução e continuar de onde parou.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error ? (
              <Alert className="border-red-500/20 bg-red-500/10 text-red-100">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-white/80">
                <Mail className="h-4 w-4" />
                Email
              </Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                inputMode="email"
                disabled={loading || submitting}
                className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-white/80">
                <Lock className="h-4 w-4" />
                Senha
              </Label>

              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading || submitting}
                className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || submitting}
              variant="ghost"
              className="mt-2 h-12 w-full overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 hover:bg-transparent"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </Button>

            <div className="pt-1 text-center text-[12px] text-white/60">
              Não tem conta?{" "}
              <Link
                className="font-semibold text-white/85 hover:text-white"
                to={signupHref}
              >
                Criar conta
              </Link>
            </div>

            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="w-full text-center text-[11px] text-white/45 transition hover:text-white/70"
              >
                Sair
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
