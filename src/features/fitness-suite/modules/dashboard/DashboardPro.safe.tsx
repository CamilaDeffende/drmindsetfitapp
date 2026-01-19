

const mfEduGutStressSleep = (v: any) => {
  const intestinal = (v?.intestinalFrequencia ?? "").toString().trim();
  const fezes = (v?.fezesConsistencia ?? "").toString().trim();
  const sono = (v?.sonoQualidade ?? "").toString().trim();
  const est = Number(v?.estresseNivel ?? 0);

  const gutTip =
    /diarre|mole/i.test(fezes) ? "Intestino: fezes muito moles podem indicar gatilhos alimentares. Ajuste gordura/ultraprocessados e hidrate-se. Persistindo, avalie com profissional."
  : /resseca|duro|bolinha|pris/i.test(fezes + " " + intestinal) ? "Intestino: sinais de constipação pedem mais água, fibras graduais e rotina. Caminhada leve diária ajuda."
  : "Intestino: mantenha hidratação, fibras e horários regulares para estabilidade.";

  const stressTip =
    est >= 8 ? "Estresse alto: inclua pausas curtas (2–5 min), respiração guiada e reduza telas/cafeína à noite. Persistindo, procure suporte profissional."
  : est >= 5 ? "Estresse moderado: crie 1 hábito diário de descarga (caminhada, alongamento, 10 min sem tela) e mantenha sono consistente."
  : "Estresse baixo: mantenha consistência e um hábito leve de relaxamento para prevenção.";

  const sleepTip =
    /ruim|pessim|péssim/i.test(sono) ? "Sono ruim: horário fixo, reduzir telas 60 min antes, luz baixa à noite e sol pela manhã."
  : /regular/i.test(sono) ? "Sono regular: ajuste consistência, evite refeições pesadas tarde e faça rotina de desaceleração."
  : sono ? "Sono bom: mantenha ambiente escuro/fresco e cafeína até no máximo 8h antes de dormir."
  : "Sono: informe como ruim/regular/bom/ótimo para orientar ajustes.";

  return `
    <section style="margin-top:16px;padding:14px;border:1px solid rgba(255,255,255,0.10);border-radius:12px;">
      <h3 style="margin:0 0 8px 0;font-size:16px;">Equilíbrio: intestino, estresse e sono</h3>
      <p style="margin:0 0 8px 0;opacity:0.9;font-size:13px;line-height:1.45;">
        <strong>Intestino:</strong> ${intestinal || "não informado"} • <strong>Consistência:</strong> ${fezes || "não informado"}<br/>
        <strong>Estresse:</strong> ${Number.isFinite(est) ? est : 0}/10 • <strong>Sono:</strong> ${sono || "não informado"}
      </p>
      <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.45;opacity:0.92;">
        <li>${gutTip}</li>
        <li>${stressTip}</li>
        <li>${sleepTip}</li>
      </ul>
      <p style="margin:10px 0 0 0;font-size:12px;opacity:0.85;line-height:1.45;">
        Observação: orientações educativas. Se houver sintomas persistentes, dor, sangue nas fezes, insônia severa ou sofrimento emocional, busque avaliação profissional.
      </p>
    </section>
  `;
};

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
      ${mfEduGutStressSleep({})}
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
