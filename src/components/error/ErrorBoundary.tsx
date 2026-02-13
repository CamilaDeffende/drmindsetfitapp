/**
 * MF_ERROR_BOUNDARY_V1
 */
import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; errorMessage?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    const msg =
      typeof err === "object" && err && "message" in err
        ? String((err as any).message)
        : "Erro inesperado";
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: unknown) {
    if (import.meta?.env?.DEV) {
      console.error("MF ErrorBoundary caught:", error, info);
    }
  }

  render() {
    const { hasError, errorMessage } = this.state;
    const { fallback } = this.props;

    if (!hasError) return this.props.children;
    if (fallback) return <>{fallback}</>;

    return (
      <div className="min-h-[70vh] px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-lg">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">DrMindSetFit</div>
          <h1 className="mt-2 text-lg font-semibold text-zinc-100">Opa… algo saiu do esperado</h1>
          <p className="mt-2 text-sm text-zinc-300">
            A interface encontrou um erro e foi protegida para evitar travar o app.
          </p>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-400">Detalhe</div>
            <div className="mt-1 text-xs text-zinc-200 break-words" data-testid="mf-error-message">
              {errorMessage || "Erro inesperado"}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-800"
              onClick={() => window.location.reload()}
              data-testid="mf-error-reload"
            >
              Recarregar
            </button>
            <button
              type="button"
              className="rounded-xl border border-zinc-800 bg-transparent px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-900/40"
              onClick={() => this.setState({ hasError: false, errorMessage: undefined })}
              data-testid="mf-error-try-again"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }
}
