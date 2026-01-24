import React from "react";

type Props = { children: React.ReactNode; name?: string };
type State = { error?: Error; info?: React.ErrorInfo };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // loga no console para aparecer no DevTools
    // (não quebra o app, apenas expõe o crash)
    console.error("[ErrorBoundary]", this.props.name || "boundary", error, info);
    this.setState({ error, info });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-3xl mx-auto rounded-2xl border border-red-500/30 bg-white/5 p-5">
          <div className="text-[12px] text-red-300/90 font-semibold tracking-wide">
            CRASH DETECTADO {this.props.name ? `— ${this.props.name}` : ""}
          </div>
          <div className="mt-2 text-[18px] font-bold text-white/95">{error.message}</div>

          <div className="mt-4 text-[12px] text-white/70">
            Stack (primeiras linhas):
          </div>
          <pre className="mt-2 whitespace-pre-wrap break-words text-[12px] text-white/80 bg-black/40 border border-white/10 rounded-xl p-3">
{String(error.stack || "").split("\n").slice(0, 20).join("\n")}
          </pre>

          {info?.componentStack ? (
            <>
              <div className="mt-4 text-[12px] text-white/70">Component stack:</div>
              <pre className="mt-2 whitespace-pre-wrap break-words text-[12px] text-white/70 bg-black/40 border border-white/10 rounded-xl p-3">
{info.componentStack.trim().split("\n").slice(0, 18).join("\n")}
              </pre>
            </>
          ) : null}

          <div className="mt-4 text-[12px] text-white/55">
            Dica: esse overlay só existe para DEV e diagnóstico. Quando resolvermos o erro, podemos remover.
          </div>
        </div>
      </div>
    );
  }
}
