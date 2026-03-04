import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

function getNext(search: string) {
  try {
    return new URLSearchParams(search).get("next") || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function hasNext(search: string) {
  try {
    return !!new URLSearchParams(search).get("next");
  } catch {
    return false;
  }
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const next = getNext(location.search);

  const { user, signIn, signOut, loading } = useAuth();

  const [email, setEmail] = React.useState(user?.email ?? "");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const backTarget = hasNext(location.search) ? "/assinatura" : "/onboarding/step-1";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const eMail = email.trim();

    if (!eMail) return setError("Informe seu email.");
    if (!password.trim()) return setError("Informe sua senha.");

    setSubmitting(true);
    try {
      const { error } = await signIn(eMail, password);
      if (error) {
        setError(error.message || "Não foi possível entrar. Verifique seus dados.");
        return;
      }

      // ✅ login ok → vai para next
      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white/90 placeholder:text-white/35 outline-none focus:border-[#0095FF]/40 focus:bg-white/[0.06]";
  const labelClass = "text-[12px] font-semibold text-white/80";

  return (
    <div className="min-h-dvh bg-[#070A12] text-white">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-10 pt-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-tight text-white/90">Entrar</div>
            <div className="text-[12px] text-white/60">MindsetFit • Acesse sua conta</div>
          </div>

          <button
            type="button"
            onClick={() => navigate(backTarget)}
            className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/10 active:scale-[0.99]"
          >
            Voltar
          </button>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_-30px_rgba(0,149,255,0.35)]">
          {/* Logo */}
          <div className="text-center">
            <picture>
              <source srcSet="/brand/optimized/mindsetfit-wordmark.avif" type="image/avif" />
              <source srcSet="/brand/optimized/mindsetfit-wordmark.webp" type="image/webp" />
              <img
                src="/brand/mindsetfit-logo.svg"
                className="mx-auto w-40 drop-shadow-lg select-none"
                alt="MindsetFit"
              />
            </picture>
          </div>

          <div className="mt-5 text-center">
            <div className="text-[14px] font-semibold">Bem-vindo(a) de volta</div>
            <div className="mt-1 text-[12px] text-white/65">Entre para acessar seu plano e continuar.</div>
          </div>

          <form onSubmit={onSubmit} className="mt-5">
            <label className={labelClass}>
              Email
              <input
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                inputMode="email"
              />
            </label>

            <label className={`${labelClass} mt-4 block`}>
              Senha
              <input
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] text-red-100">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loading || submitting}
              className="mt-5 w-full h-12 text-[13px] font-semibold rounded-2xl bg-white text-black hover:opacity-95 active:scale-[0.99]"
            >
              {submitting ? "Entrando…" : "Entrar"}
            </Button>

            <div className="mt-4 text-center text-[12px] text-white/60">
              Não tem conta?{" "}
              <Link
                className="font-semibold text-white/85 hover:text-white"
                to={`/signup?next=${encodeURIComponent(next)}`}
              >
                Criar conta
              </Link>
            </div>

            {/* opcional: manter "Sair" só se estiver logado */}
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="mt-4 w-full text-center text-[11px] text-white/45 hover:text-white/70 transition"
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