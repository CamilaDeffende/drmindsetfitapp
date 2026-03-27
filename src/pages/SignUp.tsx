import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Check, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Button } from "@/components/ui/button";
import { loadActivePlan } from "@/services/plan.service";
import { loadOnboardingProgress } from "@/lib/onboardingProgress";

const getPrefilledNameFromOnboarding = (): string => {
  try {
    const candidates = [
      (() => {
        const raw = localStorage.getItem("mf:onboarding:draft:v1");
        if (!raw) return "";
        const draft = JSON.parse(raw);
        return String(
          draft?.step1?.nomeCompleto ??
            draft?.step1?.nome ??
            draft?.step1?.fullName ??
            ""
        ).trim();
      })(),
      (() => {
        const progress = loadOnboardingProgress();
        return String(
          progress?.data?.step1?.nomeCompleto ??
            progress?.data?.step1?.nome ??
            progress?.data?.step1?.fullName ??
            ""
        ).trim();
      })(),
      (() => {
        const plan = loadActivePlan() as any;
        return String(
          plan?.draft?.step1?.nomeCompleto ??
            plan?.draft?.step1?.nome ??
            plan?.draft?.step1?.fullName ??
            plan?.perfil?.nomeCompleto ??
            plan?.perfil?.nome ??
            plan?.profile?.name ??
            plan?.profile?.fullName ??
            ""
        ).trim();
      })(),
    ];

    return candidates.find((value) => value.length >= 3) ?? "";
  } catch {
    return "";
  }
};

const PENDING_IMPORT_KEY = "mf:pendingProfileImport:v1";

const getDefaultPostAuthRoute = (): string => {
  return "/onboarding/step-1";
};

export function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, user, loading } = useAuth();
  const { toast } = useToast();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const next = useMemo(() => {
    try {
      return searchParams.get("next") || getDefaultPostAuthRoute();
    } catch {
      return getDefaultPostAuthRoute();
    }
  }, [searchParams]);

  const premiumFromUrl = searchParams.get("premium") === "1";
  const planFromUrl = searchParams.get("plan") || "mensal";
  const source = searchParams.get("source") || "";
  const shouldImportGuestState = searchParams.has("next");

  const loginHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("next", next);
    if (source) params.set("source", source);

    if (premiumFromUrl) params.set("premium", "1");
    if (planFromUrl) params.set("plan", planFromUrl);

    return `/login?${params.toString()}`;
  }, [next, premiumFromUrl, planFromUrl, source]);

  useEffect(() => {
    const hasRealUser = Boolean(user && user.id !== "demo-user-123");

    if (!loading && hasRealUser) {
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState(() => ({
    fullName: getPrefilledNameFromOnboarding(),
    email: "",
    password: "",
    confirmPassword: "",
  }));

  useEffect(() => {
    const prefilledName = getPrefilledNameFromOnboarding();
    if (!prefilledName) return;

    setFormData((current) =>
      current.fullName.trim().length >= 3
        ? current
        : { ...current, fullName: prefilledName }
    );
  }, [location.key, location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      setError("Informe seu nome completo.");
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      setSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não conferem.");
      setSubmitting(false);
      return;
    }

    try {
      if (shouldImportGuestState) {
        localStorage.setItem(PENDING_IMPORT_KEY, "1");
      } else {
        localStorage.removeItem(PENDING_IMPORT_KEY);
      }
    } catch {}

    const { error: signUpError } = await signUp(
      formData.email.trim(),
      formData.password,
      formData.fullName.trim()
    );

    if (signUpError) {
      if (
        signUpError.message?.toLowerCase().includes("already") ||
        signUpError.message?.toLowerCase().includes("registered")
      ) {
        setError("Este email já está cadastrado. Tente fazer login.");
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
      setSubmitting(false);
      return;
    }

    toast({
      title: "Conta criada com sucesso!",
      description: "Redirecionando...",
    });

    setSubmitting(false);
  };

  return (
    <div className="min-h-dvh mf-app-bg mf-bg-neon text-white">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-10 pt-8">
        <div className="flex items-center gap-3">
          <BrandIcon size={80} className="drop-shadow-[0_0_16px_rgba(0,190,255,0.35)]" />

          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-tight text-white/90">
              Criar conta
            </div>
            <div className="text-[12px] text-white/60">
              MindsetFit • Seu acesso começa aqui
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(loginHref)}
            className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/10 active:scale-[0.99]"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </button>
        </div>

        <Card className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] text-white shadow-[0_0_40px_rgba(0,149,255,0.08)]">
          <CardContent className="p-6">
            <div className="mb-5 text-center">
              <BrandIcon
                size={120}
                className="mx-auto mb-4 drop-shadow-[0_0_16px_rgba(0,190,255,0.35)]"
              />

              <h1 className="text-[24px] font-semibold tracking-tight text-white">
                Crie sua conta
              </h1>

              <p className="mt-2 text-[13px] leading-5 text-white/60">
                Cadastre-se para salvar seu plano, acompanhar evolução e acessar seu app.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <Alert className="border-red-500/20 bg-red-500/10 text-red-100">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white/80">
                  Nome completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Digite o seu Nome"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  disabled={submitting}
                  className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-white/80">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={submitting}
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
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={submitting}
                  className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35"
                />
                <p className="text-[11px] text-white/45">Mínimo de 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-white/80">
                  <Check className="h-4 w-4" />
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={submitting}
                  className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/35"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                variant="ghost"
                className="mt-2 h-12 w-full overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 hover:bg-transparent"
              >
                {submitting ? "Criando conta..." : "Criar conta"}
              </Button>

              <div className="pt-1 text-center text-[12px] text-white/60">
                Já tem uma conta?{" "}
                <Link
                  to={loginHref}
                  className="font-semibold text-white/85 hover:text-white"
                >
                  Fazer login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[11px] text-white/40">
          Ao criar uma conta, você concorda com os termos de uso e a política de privacidade.
        </p>
      </div>
    </div>
  );
}

export default SignUp;
