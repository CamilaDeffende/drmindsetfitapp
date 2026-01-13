export default function DashboardProSafe() {
  const exportReportPdf = () => {
    try {
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) return;
      const html = `<!doctype html><html><head><meta charset="utf-8"/>
      <title>Relatório</title>
      <style>
        body{font-family:ui-sans-serif,system-ui;padding:24px;background:#0b1220;color:#eaf1ff}
        .card{border:1px solid rgba(255,255,255,.10);border-radius:16px;padding:16px;background:rgba(255,255,255,.04);margin:12px 0}
        a,button{color:inherit}
        button{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);border-radius:12px;padding:10px 12px;cursor:pointer}
      </style></head><body>
      <h1>Dashboard Pro — Modo Seguro</h1>
      <p>O Dashboard Pro original está em recuperação (parser corrompido). Este modo mantém o app rodando com BUILD VERDE.</p>
      <div class="card">
        <h2>Exportar Relatório PDF</h2>
        <p>Exportação em modo seguro (template premium será restaurado após estabilização).</p>
      </div>
      <div class="card">
        <h2>Atalhos</h2>
        <p><a href="/assinatura">Assinatura</a></p>
      </div>
      <p style="opacity:.8">${new Date().toLocaleString("pt-BR")}</p>
      </body></html>`;
      w.document.open();
      w.document.write(html);
      w.document.close();
      window.setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 250);
    } catch {}
  };

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <a
          href="/assinatura"
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/10 active:scale-[0.99]"
        >
          Assinatura
        </a>
        <button type="button" onClick={exportReportPdf}>
          Exportar PDF (modo seguro)
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-[14px] font-semibold text-white/90">Dashboard Pro — Safe Mode</div>
        <div className="mt-2 text-[12px] text-white/70">
          O componente original será restaurado a partir de um backup válido. Enquanto isso, o app permanece operacional.
        </div>
      </div>
    </div>
  );
}
