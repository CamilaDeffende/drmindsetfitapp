import { BrandIcon } from "@/components/branding/BrandIcon";
import { useNavigate } from "react-router-dom";

export function AuthShell({
  title,
  subtitle,
  children,
  showBack = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBack?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-[#070A12] text-white">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-10 pt-8">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <BrandIcon size={28} />
          </div>
          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-tight text-white/90">{title}</div>
            {subtitle ? <div className="text-[12px] text-white/60">{subtitle}</div> : null}
          </div>

          {showBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/10 active:scale-[0.99]"
            >
              Voltar
            </button>
          ) : null}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_-30px_rgba(0,149,255,0.35)]">
          {children}
        </div>

        <div className="mt-6 text-center text-[11px] text-white/45">
          MindsetFit • Auth (next)
        </div>
      </div>
    </div>
  );
}