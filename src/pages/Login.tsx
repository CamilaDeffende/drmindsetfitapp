import { useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const next = useMemo(() => {
    try {
      const n = new URLSearchParams(location.search).get("next");
      return n || "/dashboard";
    } catch {
      return "/dashboard";
    }
  }, [location.search]);

  return (
    <div className="min-h-dvh bg-[#070A12] text-white">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-10 pt-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-tight text-white/90">Entrar</div>
            <div className="text-[12px] text-white/60">DrMindSetFit • Acesse sua conta</div>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
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

          {/* Copy */}
          <div className="mt-5 text-center space-y-1">
            <h1 className="text-[16px] font-semibold text-white/90">Bem-vindo de volta 👋</h1>
            {user?.email ? (
              <p className="text-[12px] text-white/60">{user.email}</p>
            ) : (
              <p className="text-[12px] text-white/60">Entre para acessar seu plano e continuar sua jornada.</p>
            )}
          </div>

          {/* Continue */}
          <Button
            onClick={() => navigate(next)}
            className="mt-5 w-full h-12 text-[13px] font-semibold rounded-2xl bg-white text-black hover:opacity-95 active:scale-[0.99]"
          >
            Continuar
          </Button>

          {/* Link opcional (caso você queira guiar para signup) */}
          <div className="mt-4 text-center text-[12px] text-white/60">
            Não tem conta?{" "}
            <Link
              className="font-semibold text-white/85 hover:text-white"
              to={`/signup?next=${encodeURIComponent(next)}`}
            >
              Criar conta
            </Link>
          </div>

          {/* Logout */}
          <button
            onClick={signOut}
            className="mt-4 w-full text-center text-[11px] text-white/45 hover:text-white/70 transition"
          >
            Sair
          </button>
        </div>

        <div className="mt-6 text-center text-[11px] text-white/45">MindsetFit • Auth (next)</div>
      </div>
    </div>
  );
}