import React from "react";

type Props = { children: React.ReactNode };

export function DevErrorOverlay({ children }: Props) {
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const msg = e?.error?.message || e.message || "Unknown error";
      const stack = e?.error?.stack ? `\n\n${String(e.error.stack)}` : "";
      setErr(`${msg}${stack}`);
      console.error("[window.onerror]", e.error || e.message, e);
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = (e as any).reason;
      const msg = reason?.message || String(reason || "Unhandled rejection");
      const stack = reason?.stack ? `\n\n${String(reason.stack)}` : "";
      setErr(`${msg}${stack}`);
      console.error("[unhandledrejection]", reason, e);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!err) return <>{children}</>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto rounded-2xl border border-red-500/30 bg-white/5 p-5">
        <div className="text-[12px] text-red-300/90 font-semibold tracking-wide">
          ERRO RUNTIME (window)
        </div>
        <div className="mt-2 text-[14px] text-white/90">
          A tela ficou preta porque ocorreu um erro em runtime. Abaixo está a mensagem/stack.
        </div>
        <pre className="mt-4 whitespace-pre-wrap break-words text-[12px] text-white/80 bg-black/40 border border-white/10 rounded-xl p-3">
{err}
        </pre>
        <button
          className="mt-4 h-10 px-4 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-[12px]"
          onClick={() => setErr(null)}
        >
          Fechar overlay (continuar tentando)
        </button>
      </div>
    </div>
  );
}
