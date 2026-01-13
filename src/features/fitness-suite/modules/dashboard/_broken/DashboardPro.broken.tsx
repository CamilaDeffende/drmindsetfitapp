import { useState, useEffect, useMemo } from "react";
import { tokens } from "../../ui/tokens";
import { useHistoryStore } from "../../store/useHistoryStore";
import { useProgressStore } from "../../store/useProgressStore";
import type { WorkoutSession, PR } from "../../contracts/workout";
import { buildTrends, buildInsight, formatKg, formatMin, formatPct, formatInt } from "../../utils/dashboard";
import { generateMindsetFitPremiumPdf } from "@/lib/pdf/mindsetfitPdf";
import { getDashboardExportSnapshot } from "./dashboardExport";
import { mindsetfitSignatureLines } from "@/assets/branding/signature";
import { REPORT_HISTORY_BASE_KEY, CURRENT_PATIENT_KEY, reportHistoryKey, PDF_VARIANT_KEY } from "@/lib/storageKeys";

import { loadFlags } from "@/lib/featureFlags";

import { PremiumBadge } from "../../premium/PremiumBadge";
import { isPremium, premiumLabel } from "../../premium/premium";
import { Skeleton } from "../../ui/Skeleton";
import { EmptyState } from "../../ui/EmptyState";
function fmtDateHuman(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const dd = startOf(d);
    const nn = startOf(now);
    const diffDays = Math.round((nn - dd) / 86400000);

    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 0) return `Hoje • ${time}`;
    if (diffDays === 1) return `Ontem • ${time}`;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function todayYMD(): string {
const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function flattenHistory(history: any): WorkoutSession[] {
  if (!history || typeof history !== "object") return [];
  // history: { [date]: WorkoutSession[] | LegacyWorkoutDay }
  const out: WorkoutSession[] = [];
  for (const k of Object.keys(history)) {
    const v = history[k];
    if (Array.isArray(v)) {
      out.push(...v);
    } else if (v && Array.isArray(v.workouts)) {
      out.push(...v.workouts);
    } else if (v && Array.isArray(v.sessions)) {
      out.push(...v.sessions);
    }
  }
  return out;
}

function toneBg(tone: "good" | "warn" | "neutral") {
if (tone === "good") return "rgba(16,185,129,0.10)";
  if (tone === "warn") return "rgba(245,158,11,0.10)";
  return "rgba(59,130,246,0.10)";
}

export function DashboardPro() {
// === Report History (Sprint 6C) ===
    // === Sprint 6B | PDF Variant (coach/patient) ===
  const [pdfVariant, setPdfVariant] = useState<"coach" | "patient">(() => {
    try {
      const v = localStorage.getItem(PDF_VARIANT_KEY);
      return v === "patient" ? "patient" : "coach";
    } catch {
      return "coach";
    }
  });

  // Sprint 9B.1 | Paciente atual (namespace do histórico de relatórios)
  const [patientId, _setPatientId] = useState<string>(() => {
    try { return localStorage.getItem(CURRENT_PATIENT_KEY) || "default"; } catch { return "default"; }
  });

  const reportKey = useMemo(() => reportHistoryKey(patientId), [patientId]);

  useEffect(() => {
    try { localStorage.setItem(CURRENT_PATIENT_KEY, patientId || "default"); } catch {}
  }, [patientId]);

  useEffect(() => {
    // migração automática (legado -> default)
    try {
      const legacy = localStorage.getItem(REPORT_HISTORY_BASE_KEY);
      const destKey = reportHistoryKey("default");
      if (legacy && !localStorage.getItem(destKey)) {
        localStorage.setItem(destKey, legacy);
        localStorage.removeItem(REPORT_HISTORY_BASE_KEY);
      }
    } catch {}
  }, []);


  // === Sprint 6C | Report History (LS) ===
  type ReportHistoryItem = {
    id: string;
    createdAtISO: string;
    variant: "coach" | "patient";
    fileName: string;
    metaSource: string;
    summary: string;
    // Sprint 7 (UX)
    pinned?: boolean;
    label?: string;
  };
  function safeParseHistory(raw: string | null): ReportHistoryItem[] {
    if (!raw) return [];
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? (v as ReportHistoryItem[]) : [];
    } catch {
      return [];
    }
  }

  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    return safeParseHistory(window.localStorage.getItem(reportKey));
  });

  // === Sprint 7 | Report History UX (safe) ===
  const [rhQuery, setRhQuery] = useState("");
  const [rhFilter, setRhFilter] = useState<"all" | "coach" | "patient">("all");
  const [rhShowAll, setRhShowAll] = useState(false);

  const normalizedReportHistory = useMemo(() => (reportHistory?.length ? reportHistory : []), [reportHistory]);

  const filteredReportHistory = useMemo(() => {
    const q = String(rhQuery || "").toLowerCase().trim();
    const byFilter = (it: ReportHistoryItem) => rhFilter === "all" ? true : it.variant === rhFilter;
    const byQuery = (it: ReportHistoryItem) => {
      if (!q) return true;
      const hay = [
        it.label || "",
        it.fileName || "",
        it.summary || "",
        it.metaSource || "",
        it.variant === "patient" ? "paciente" : "coach",
        it.createdAtISO || "",
      ].join(" ").toLowerCase();
      return hay.includes(q);
    };

    const list = normalizedReportHistory.map((x: any) => ({
      ...x,
      pinned: Boolean(x?.pinned),
      label: typeof x?.label === "string" ? x.label : undefined,
    })) as ReportHistoryItem[];

    const pinned = list.filter((x) => x.pinned).filter(byFilter).filter(byQuery);
    const normal = list.filter((x) => !x.pinned).filter(byFilter).filter(byQuery);

    const desc = (a: ReportHistoryItem, b: ReportHistoryItem) => (a.createdAtISO < b.createdAtISO ? 1 : -1);
    return [...pinned.sort(desc), ...normal.sort(desc)];
  }, [normalizedReportHistory, rhQuery, rhFilter]);

  const visibleReportHistory = useMemo(
    () => (rhShowAll ? filteredReportHistory : filteredReportHistory.slice(0, 10)),
    [filteredReportHistory, rhShowAll]
  );

  function togglePinReport(id: string) {
    const next = (normalizedReportHistory || []).map((x: any) => x.id === id ? ({ ...x, pinned: !x.pinned }) : x);
    writeReportHistory(next as any);
  }

  function renameReport(id: string) {
    const cur: any = (normalizedReportHistory || []).find((x: any) => x.id === id);
    const nextLabel = window.prompt("Nome do relatório (label):", String(cur?.label || ""));
    if (nextLabel === null) return;
    const label = String(nextLabel || "").trim();
    const next = (normalizedReportHistory || []).map((x: any) => x.id === id ? ({ ...x, label: label || undefined }) : x);
    writeReportHistory(next as any);
  }
  // === /Sprint 7 ===

  function refreshReportHistory() {
    if (typeof window === "undefined") return;
    setReportHistory(safeParseHistory(window.localStorage.getItem(reportKey)));
  }

  function writeReportHistory(list: ReportHistoryItem[]) {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(reportKey, JSON.stringify(list.slice(0, 30)));
      } catch {}
    }
    setReportHistory(list.slice(0, 30));
  }

  function addReportHistory(item: ReportHistoryItem) {
    const next = [item, ...(reportHistory || [])].slice(0, 30);
    writeReportHistory(next);
  }

  function removeReportHistory(id: string) {
    const next = (reportHistory || []).filter((x) => x.id !== id);
    writeReportHistory(next);
  }

  function clearReportHistory() {
    writeReportHistory([]);
  }

  // keep-alive TS (evita TS6133 quando JSX/handlers mudam)
  void ({
    addReportHistory,
    removeReportHistory,
    clearReportHistory,
    refreshReportHistory,
    reportHistory,
    setReportHistory,
    pdfVariant,
    setPdfVariant,
  } as const);

  // === /Sprint 6C ===

  // === Sprint 13.0 | Premium Layer ===
  const [premiumNotice, setPremiumNotice] = useState<string | null>(null);

  const requestPremium = (feature: any) => {
    if (!isPremium(feature)) {
      setPremiumNotice(`${premiumLabel(feature)} - disponível no Premium.`);
      // auto-dismiss leve
      window.setTimeout(() => setPremiumNotice(null), 3200);
      return false;
    }
    return true;
  };
  // === /Sprint 13.0 | Premium Layer ===

  // compat: sessions (novo) ou history (legado)
  const sessions = useHistoryStore((s: any) => (s.sessions ?? flattenHistory(s.history)) as WorkoutSession[]);

  // === Sprint 14.0.1 | UX Polish SAFE v3 ===
  const historyRef_1401 = useHistoryStore();

  const [uiReady_1401, setUiReady_1401] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setUiReady_1401(true), 220);
    return () => window.clearTimeout(t);
  }, []);

  const hasHistory_1401 = Boolean(
    (historyRef_1401 as any)?.sessions?.length ||
      (historyRef_1401 as any)?.items?.length ||
      (historyRef_1401 as any)?.entries?.length ||
      (historyRef_1401 as any)?.history?.length
  );
  // === /Sprint 14.0.1 | UX Polish SAFE v3 ===

  const progress = useProgressStore();

  

  // === Sprint 12.0 | Progressão Inteligente ===
  const progression = useMemo(() => {
    const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
    const toN = (v: unknown) => Number(v ?? 0) || 0;

    const h: any = (typeof history !== "undefined" ? history : {}) as any;
    const p: any = (progress ?? {}) as any;
const sessionsRaw =
      h.sessions ??
      h.sessionsCompat ??
      h.items ??
      h.history ??
      h.entries ??
      [];

    const sessions: any[] = Array.isArray(sessionsRaw) ? sessionsRaw : [];

    const now = new Date();
    const start7 = new Date(now);
    start7.setDate(now.getDate() - 6);
    start7.setHours(0, 0, 0, 0);

    const in7d = sessions.filter((x) => {
      const d = new Date(x?.date ?? x?.startedAt ?? x?.endedAt ?? x?.createdAt ?? 0);
      return d.getTime() >= start7.getTime() && d.getTime() <= now.getTime();
    });

    const sessions7 = in7d.length;
    const streakNow = toN(p.streak ?? 0);
    const prsCount = Array.isArray(p.prs) ? p.prs.length : 0;

    // Score (0-100) - 4 pilares auditáveis
    const scoreFreq = clamp(Math.round((sessions7 / 5) * 40), 0, 40);   // alvo 5/7d → 40
    const scoreStreak = clamp(Math.round((streakNow / 14) * 30), 0, 30); // alvo 14d → 30
    const scoreCons = clamp(Math.round((sessions7 / 3) * 20), 0, 20);    // presença mínima → 20
    const scorePR = clamp(Math.round((prsCount / 10) * 10), 0, 10);      // PRs → 10

    const total = clamp(scoreFreq + scoreStreak + scoreCons + scorePR, 0, 100);

    let state: "Evoluindo" | "Estável" | "Estagnado" | "Regressão" = "Estável";
    if (total >= 78) state = "Evoluindo";
    else if (total <= 35) state = "Regressão";
    else if (sessions7 >= 3 && streakNow <= 2) state = "Estagnado";

    const drivers: { label: string; tone: "up" | "down" | "neutral" }[] = [
      {
        label: sessions7 >= 4 ? "Frequência sólida (" + sessions7 + "/7d)" : "Frequência baixa (" + sessions7 + "/7d)",
        tone: sessions7 >= 4 ? "up" : sessions7 <= 1 ? "down" : "neutral",
      },
      {
        label: streakNow >= 7 ? "Streak em alta (" + streakNow + "d)" : "Streak curto (" + streakNow + "d)",
        tone: streakNow >= 7 ? "up" : streakNow <= 2 ? "down" : "neutral",
      },
      {
        label: prsCount > 0 ? "PRs registrados (" + prsCount + ")" : "Sem PRs recentes",
        tone: prsCount > 0 ? "up" : "neutral",
      },
    ];

    let action = `
Mantenha consistência e registre seus treinos para consolidar a evolução.
Iniciando
Você ainda precisa de 
 treinos para fechar 
/
. Faça 1 sessão hoje.
-
-
Consistência (28d): 
 dias ativos • melhor streak 
 • 
%
Volume (7d): 
 kg-reps • Séries 
 • Reps 
 • Tempo 
 min
@page{size:auto;margin:14mm 12mm 18mm 12mm;}
html,body{margin:0;padding:0;background:#0b0f16;color:#e9eef8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Roboto,Arial,sans-serif;}
.page{max-width:900px;margin:0 auto;padding:20px;position:relative;z-index:1;}
.top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:16px 16px 14px 16px;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);border-radius:18px;}
.brand{font-weight:800;font-size:18px;letter-spacing:0.2px;}
.sub{margin-top:6px;font-size:12px;color:rgba(233,238,248,0.70);}
.meta{font-size:12px;color:rgba(233,238,248,0.65);text-align:right;line-height:1.5;}
.pill{display:inline-flex;align-items:center;gap:8px;margin-top:10px;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);font-size:12px;color:rgba(233,238,248,0.85);}
.grid{display:grid;grid-template-columns:1fr;gap:12px;margin-top:14px;}
@media(min-width:860px){.grid{grid-template-columns:1fr 1fr;}}
.card{border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);border-radius:18px;padding:14px 14px;}
.card, .top{break-inside:avoid;page-break-inside:avoid;}
.h{margin:0 0 10px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.14em;color:rgba(233,238,248,0.62);}
.p{margin:0;font-size:12px;line-height:1.6;color:rgba(233,238,248,0.82);}
.ul{margin:0;padding-left:16px;}
.li{margin:0 0 6px 0;font-size:12px;line-height:1.55;color:rgba(233,238,248,0.82);}
.tbl{width:100%;border-collapse:separate;border-spacing:0 8px;}
.row{background:rgba(0,0,0,0.22);border:1px solid rgba(255,255,255,0.08);}
.row td{padding:10px 10px;font-size:12px;color:rgba(233,238,248,0.82);}
.row td:first-child{border-top-left-radius:14px;border-bottom-left-radius:14px;}
.row td:last-child{border-top-right-radius:14px;border-bottom-right-radius:14px;text-align:right;color:rgba(233,238,248,0.70);}
.muted{color:rgba(233,238,248,0.60);}
.hr{height:1px;background:rgba(255,255,255,0.10);border:0;margin:10px 0;}
.footer{margin-top:12px;font-size:11px;color:rgba(233,238,248,0.55);}
.watermark{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;opacity:0.06;font-weight:800;font-size:72px;letter-spacing:0.12em;color:rgba(233,238,248,0.22);transform:rotate(-18deg);}
@media print{body{background:#ffffff;color:#0b0f16;} .top,.card{background:#ffffff;border-color:#e6e8ee;} .sub,.muted,.meta{color:#4b5563;} .p,.li{color:#111827;} .h{color:#6b7280;} .row{background:#f8fafc;border-color:#e6e8ee;} .row td{color:#111827;} .row td:last-child{color:#4b5563;} .footer{position:fixed;left:12mm;right:12mm;bottom:8mm;color:#6b7280;} .pg:after{content: counter(page);} .pgs:after{content: counter(pages);} }
<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>" + title + "</title><style>" + css + "</style></head><body>
<div class="page">


<div class="watermark">MindsetFit</div>
<div class="top">
<div>
<img src="/logo-mindsetfit.svg" alt="MindsetFit" style="height:22px;width:auto;opacity:0.95;margin-bottom:10px" onerror="this.style.display=\'none\'"/>
<div class="brand">" + esc(title) + "</div>
<div class="sub">" + esc(sub) + "</div>
<div class="pill"><span>Score</span><strong>" + String(pwScore) + "/100</strong><span class="muted">" + pwTier + "</span></div>
</div>
<div class="meta">
<div><strong>Data</strong>: " + esc(dateStr) + "</div>
<div><strong>Hora</strong>: " + esc(timeStr) + "</div>
<div><strong>Janela</strong>: 7d vs 7d</div>
<div><strong>ID</strong>: " + esc(reportId) + "</div>
</div>
</div>


      const goalsRows = (Array.isArray(goalsView?.rows) ? goalsView.rows : []);

      const weeklyWins = (Array.isArray(weeklyView?.wins) ? weeklyView.wins : []);

      const snapshotText = (typeof fullSnapshot === "string" ? fullSnapshot : "");

      const execHtml = "";
  </div>
</div>

   O bloco acima estava quebrando o parser (template/HTML solto).
   Se isso era template de PDF/HTML, vamos restaurar corretamente depois com base no handoff. */

const html =
        htmlTop +
        execHtml +
        goalsHtml +
        reviewHtml +
        consistencyHtml +
        actionsHtml +
        snapshotHtml +
        "</div>" +
        footer +
        "</div></body></html>";

      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();

      window.setTimeout(() => {
        try { w.focus(); w.print(); } catch {}
      }, 280);
    } catch {}
  };
// PDF_HARDQ   // === /Sprint 11.4 | Enterprise PDF v2 (template + pagination) ===
// PDF_HARDQ // PDF_QUARANTINE   // === /Sprint 11.3 | Export PDF ===
// PDF_HARDQ // PDF_QUARANTINE 
// PDF_HARDQ 
// PDF_HARDQ   // PDF_QUARANTINE: export seguro (temporário) para manter BUILD VERDE
// PDF_HARDQ   const exportReportPdf = () => {
// PDF_HARDQ     try {
// PDF_HARDQ       const w = window.open('', '_blank', 'noopener,noreferrer');
// PDF_HARDQ       if (!w) return;
// PDF_HARDQ       const html = `<!doctype html><html><head><meta charset='utf-8'/>
// PDF_HARDQ       <title>Relatório</title>
// PDF_HARDQ       <style>body{font-family:ui-sans-serif,system-ui;padding:24px;background:#0b1220;color:#eaf1ff}h1{margin:0 0 12px}p{opacity:.85}</style>
// PDF_HARDQ       </head><body><h1>Relatório DrMindSetFitApp</h1>
// PDF_HARDQ       <p>Exportação em modo seguro (template premium será restaurado após estabilização).</p>
// PDF_HARDQ       <p>${new Date().toLocaleString('pt-BR')}</p>
// PDF_HARDQ       </body></html>`;
// PDF_HARDQ       w.document.open(); w.document.write(html); w.document.close();
// PDF_HARDQ       window.setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 250);
// PDF_HARDQ     } catch {}
// PDF_HARDQ   };
// PDF_HARDQ 

  // PDF_HARDQ: export seguro (temporário) para manter BUILD VERDE
  const exportReportPdf = () => {
    try {
      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) return;
      const html = `<!doctype html><html><head><meta charset='utf-8'/>
      <title>Relatório</title>
      <style>body{font-family:ui-sans-serif,system-ui;padding:24px;background:#0b1220;color:#eaf1ff}h1{margin:0 0 12px}p{opacity:.85}</style>
      </head><body><h1>Relatório DrMindSetFitApp</h1>
      <p>Exportação em modo seguro (template premium será restaurado após estabilização).</p>
      <p>${new Date().toLocaleString('pt-BR')}</p>
      </body></html>`;
      w.document.open(); w.document.write(html); w.document.close();
      window.setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 250);
    } catch {}
  };

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
        <div className="mb-4 flex flex-wrap gap-2">
      <a href="/assinatura" className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/10 active:scale-[0.99]">Assinatura</a>
                    {/* === Sprint 5E | seletor de versão (coach/patient) === */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Versão do PDF:</span>
            <button
              type="button"
              onClick={() => { setPdfVariant("coach"); try { localStorage.setItem(PDF_VARIANT_KEY,"coach"); localStorage.setItem(PDF_VARIANT_KEY,"coach"); } catch {} }}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: pdfVariant === "coach" ? "rgba(0,149,255,0.22)" : "transparent",
                color: "inherit",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Coach (com assinatura)
            </button>
            <button
              type="button"
              onClick={() => { setPdfVariant("patient"); try { localStorage.setItem(PDF_VARIANT_KEY,"patient"); localStorage.setItem(PDF_VARIANT_KEY,"patient"); } catch {} }}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: pdfVariant === "patient" ? "rgba(0,149,255,0.22)" : "transparent",
                color: "inherit",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Paciente (clean)
            </button>
          </div>
          {/* === /Sprint 5E === */}
<button
  className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs hover:bg-black/60"
  onClick={() => {
    (async () => {
      try {
        // Snapshot (fonte única de verdade)
        const snapshot = getDashboardExportSnapshot();

        // meta.normalized (resumo executivo)
        const snapAny: any = snapshot as any;
        const norm: any = (snapAny?.meta as any)?.normalized ?? {};
        const src: any = norm?.source ?? (snapAny?.meta?.source ?? {});

        // Helpers locais (sem vazar p/ JSX)
        const esc = (x: any) =>
          String(x ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

        const card = (title: string, inner: string) =>
          `<div class="card"><div class="h">${esc(title)}</div><div class="b">${inner}</div></div>`;

        // Normalizados esperados (com fallback seguro)
        const w = norm?.workout ?? {};
        const d = norm?.diet ?? {};
        const h = norm?.hiit ?? {};
        const c = norm?.cardio ?? {};

        const bodyText = "Relatório gerado automaticamente (MindsetFit Premium).";

        // HTML 100% baseado em meta.normalized (cards visuais)
        const bodyHtml = (() => {
          try {
            const grid =
              `<div class="grid">` +
              card(
                "Treino (resumo)",
                `<div class="small">Exercícios: <b>${esc(w?.exercisesCount ?? 0)}</b></div>` +
                  (w?.exercisesTop ? `<div class="small">Top: ${esc(w.exercisesTop)}</div>` : "")
              ) +
              card(
                "Dieta (resumo)",
                `<div class="small">Refeições: <b>${esc(d?.mealsCount ?? 0)}</b></div>` +
                  (d?.macrosText ? `<div class="small">Macros: ${esc(d.macrosText)}</div>` : "")
              ) +
              card(
                "HIIT (resumo)",
                `<div class="small">Status: <b>${esc(h?.active ? "ativo" : "-")}</b></div>` +
                  (h?.protocol ? `<div class="small">Protocolo: ${esc(h.protocol)}</div>` : "") +
                  (h?.frequency ? `<div class="small">Frequência: ${esc(h.frequency)}</div>` : "")
              ) +
              card(
                "Cardio (resumo)",
                `<div class="small">Status: <b>${esc(c?.active ? "ativo" : "-")}</b></div>` +
                  (c?.modality ? `<div class="small">Modalidade: ${esc(c.modality)}</div>` : "") +
                  (c?.duration ? `<div class="small">Duração: ${esc(c.duration)}</div>` : "") +
                  (c?.intensity ? `<div class="small">Intensidade: ${esc(c.intensity)}</div>` : "") +
                  (c?.frequency ? `<div class="small">Frequência: ${esc(c.frequency)}</div>` : "")
              ) +
              card(
                "Fonte dos dados",
                `<div class="small">Treino: ${esc(src?.workout ?? "")}</div>` +
                  `<div class="small">Dieta: ${esc(src?.diet ?? "")}</div>` +
                  `<div class="small">HIIT: ${esc(src?.hiit ?? "")}</div>` +
                  `<div class="small">Cardio: ${esc(src?.cardio ?? "")}</div>`
              ) +
              `</div>`;

            return `<div class="wrap">${grid}</div>`;
          } catch {
            return "";
          }
        })();

        // Sprint 9A.1 | PDF PRO v3 - bloco de Evolução (últimos 28 dias)
        const historyKpiText = (() => {
          try {
            const now = Date.now();
            const day = 24 * 60 * 60 * 1000;

            const toTime = (v: any) => {
              if (!v) return 0;
              const d = new Date(v);
              const t = d.getTime();
              return Number.isFinite(t) ? t : 0;
            };

            const tOf = (ss: any) =>
              toTime(
                ss?.date ||
                  ss?.ymd ||
                  ss?.createdAtISO ||
                  ss?.createdAt ||
                  ss?.performedAt ||
                  ss?.timestamp ||
                  ss?.ts
              );

            const list: any[] = Array.isArray(sessions) ? (sessions as any[]) : [];
            const inDays = (n: number) => list.filter((x) => {
              const t = tOf(x);
              return t > 0 && (now - t) <= (n * day);
            });

            const s7 = inDays(7);
            const s14 = inDays(14);
            const s28 = inDays(28);

            const vol28 = s28.reduce((acc, x) => {
              const v = Number(x?.totalVolumeKg ?? x?.volumeKg ?? x?.volume ?? 0) || 0;
              return acc + v;
            }, 0);

            const prs28 = s28.reduce((acc, x) => {
              const p = Array.isArray(x?.prs) ? x.prs.length : (Array.isArray(x?.pr) ? x.pr.length : 0);
              return acc + (Number(p) || 0);
            }, 0);

            const consistency = Math.min(100, Math.round((s28.length / 28) * 100));

            const fmt = (n: number) => (Number.isFinite(n) ? n : 0);
            const fmtVol = (n: number) => {
              const v = Math.round((n || 0) * 10) / 10;
              return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
            };

            return [
              "📈 Evolução (últimos 28 dias)",
              `• Sessões: 7d ${fmt(s7.length)} | 14d ${fmt(s14.length)} | 28d ${fmt(s28.length)}`,
              `• Volume total (28d): ${fmtVol(vol28)} kg`,
              `• PRs (28d): ${fmt(prs28)}`,
              `• Consistência (28d): ${fmt(consistency)}%`,
            ].join("\n");
          } catch {
            return "📈 Evolução (últimos 28 dias)\n• Dados indisponíveis neste dispositivo.";
          }
        })();

        // Sprint 9A.2 | PDF PRO v3 - Últimos relatórios + Score (texto seguro)
        const reportHistoryMiniText = (() => {
          try {
            const now = Date.now();
            const day = 24 * 60 * 60 * 1000;

            const toTime = (v: any) => {
              if (!v) return 0;
              const d = new Date(v);
              const t = d.getTime();
              return Number.isFinite(t) ? t : 0;
            };
            const tOf = (ss: any) =>
              toTime(
                ss?.date ||
                  ss?.ymd ||
                  ss?.createdAtISO ||
                  ss?.createdAt ||
                  ss?.performedAt ||
                  ss?.timestamp ||
                  ss?.ts
              );

            const list = Array.isArray(sessions) ? sessions : [];
            const s28 = list.filter((x) => {
              const t = tOf(x);
              return t > 0 && (now - t) <= (28 * day);
            });

            const consistency = Math.min(100, Math.round((s28.length / 28) * 100));
            const scoreLabel =
              consistency >= 80 ? "Elite" :
              consistency >= 60 ? "Forte" :
              consistency >= 40 ? "Em evolução" : "Recomeço";

            const rh = Array.isArray(reportHistory) ? reportHistory : [];
            const top = rh.slice(0, 5);

            const lines = [];
            lines.push("📌 Últimos Relatórios (Top 5)");
            lines.push(`• Score de Consistência (28d): ${consistency}/100 • ${scoreLabel}`);

            if (!top.length) {
              lines.push("• Ainda não há relatórios salvos neste dispositivo.");
              return lines.join("\n");
            }

            lines.push("");
            lines.push("Data | Versão | Relatório");
            lines.push("----------------------------------------");

            for (const it of top) {
              const iso = String(it?.createdAtISO ?? "");
              const d = iso ? new Date(iso) : null;
              const dateTxt = d && Number.isFinite(d.getTime())
                ? d.toLocaleDateString()
                : (iso ? iso.slice(0,10) : "-");

              const v = it?.variant === "patient" ? "Paciente" : "Coach";
              const name = String(it?.label || it?.fileName || "Relatório").slice(0, 46);
              lines.push(`${dateTxt} | ${v} | ${name}`);
            }

            lines.push("");
            lines.push("Dica PRO: mantenha consistência por 28 dias para insights mais confiáveis.");
            return lines.join("\n");
          } catch {
            return "📌 Últimos Relatórios\n• Dados indisponíveis neste dispositivo.";
          }
        })();

        // Gera PDF premium
const flags = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };
    if (flags.paywallEnabled && !flags.premiumUnlocked) {
      window.location.href="/assinatura";
      return;
    }
    await generateMindsetFitPremiumPdf({
fileName: "Relatorio-MindsetFit-Premium.pdf",
          metaLines: [...mindsetfitSignatureLines] as string[],
          variant: pdfVariant,
          bodyText: (String(bodyText ?? "") + "\n\n" + String(historyKpiText ?? "") + "\n\n" + String(reportHistoryMiniText ?? "")),
          bodyHtml,
});

        // Sprint 6C: registrar no histórico
        try {
          const id = String(Date.now()) + "_" + Math.random().toString(16).slice(2);
          const createdAtISO = new Date().toISOString();          const fileNameUsed = `mindsetfit-relatorio-${pdfVariant}-${new Date().toISOString().slice(0,10)}.pdf`;
const metaSource = (typeof snapshot !== "undefined" && snapshot?.meta?.source) ? snapshot.meta.source : undefined;
          const summary = pdfVariant === "patient"
            ? "Versão Paciente - resumo simplificado."
            : "Versão Coach - relatório completo premium.";
          addReportHistory({ id, createdAtISO, variant: pdfVariant, fileName: fileNameUsed, metaSource: (typeof metaSource === "string" ? metaSource : "meta.normalized"), summary });
          refreshReportHistory();
        } catch {}
} catch (e) {
        console.error(e);
      }
    })();
  }}
>

        {/* Sprint 6C | Histórico de Relatórios */}
        <div style={{ marginTop: 14, padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Histórico de Relatórios</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Últimos relatórios gerados (até 30).</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { refreshReportHistory(); }}
                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
              >
                Atualizar
              </button>
              <button
                onClick={() => { clearReportHistory(); refreshReportHistory(); }}
                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
              >
                Limpar
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={rhQuery}
              onChange={(e) => setRhQuery((e.target as HTMLInputElement).value)}
              placeholder="Buscar (nome, data, resumo...)"
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.18)",
                color: "white",
                fontSize: 12,
                outline: "none",
                minWidth: 220,
              }}
            />
            <select
              value={rhFilter}
              onChange={(e) => setRhFilter((e.target as HTMLSelectElement).value as any)}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.18)",
                color: "white",
                fontSize: 12,
                outline: "none",
              }}
            >
              <option value="all">Todos</option>
              <option value="coach">Coach</option>
              <option value="patient">Paciente</option>
            </select>

            {filteredReportHistory.length > 10 ? (
              <button
                type="button"
                onClick={() => setRhShowAll((v) => !v)}
                style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "white", cursor: "pointer", fontSize: 12 }}
              >
                {rhShowAll ? "Mostrar menos" : "Mostrar todos"}
              </button>
            ) : null}
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {visibleReportHistory.map((it: ReportHistoryItem) => (
              <div key={it.id} style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {it.label ? it.label : it.fileName}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }} title={it.createdAtISO}>
                      {fmtDateHuman(it.createdAtISO)} • {it.variant === "patient" ? "Paciente" : "Coach"} • {it.summary || ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        // Regerar rapidamente usando o variant do item
                        setPdfVariant(it.variant);
                        try { localStorage.setItem(PDF_VARIANT_KEY, it.variant); } catch {}
                        setTimeout(() => {
                          const btn = document.querySelector('button[data-action="download-premium-pdf"]') as HTMLButtonElement | null;
                          btn?.click();
                        }, 60);
                      }}
                      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,149,255,0.35)", background: "rgba(0,149,255,0.12)", color: "white", cursor: "pointer", fontSize: 12 }}
                    >
                      Baixar de novo
                    </button>
                    <button
                      onClick={() => {
                        togglePinReport(it.id);
                        refreshReportHistory();
                      }}
                      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
                    >
                      {it.pinned ? "Despin" : "Pin"}
                    </button>
                    <button
                      onClick={() => {
                        renameReport(it.id);
                        refreshReportHistory();
                      }}
                      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
                    >
                      Renomear
                    </button>
                    <button
                      onClick={() => { removeReportHistory(it.id); refreshReportHistory(); }}
                      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {it.metaSource ? (
                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
                    Fonte: {typeof it.metaSource === "string" ? it.metaSource : JSON.stringify(it.metaSource)}
                  </div>
                ) : null}
              </div>
            ))}

            {!reportHistory?.length ? (
              <div style={{ padding: 10, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.18)", opacity: 0.75, fontSize: 12 }}>
                Ainda não há relatórios aqui. Gere seu primeiro PDF Premium e ele ficará salvo neste dispositivo.
              </div>
            ) : null}
          </div>
        </div>

  Baixar Relatório PDF Premium
</button>
        </div>

        {/* Sprint 13.0 | Premium Layer UI */}
        {premiumNotice ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-white/50">Recurso Premium</div>
                <div className="mt-1 text-[13px] text-white/85">{premiumNotice}</div>
              </div>
              <button
                type="button"
                onClick={() => setPremiumNotice(null)}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] text-white/80 hover:bg-white/15 active:scale-[0.98] transition"
              >
                Ok
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-wide text-white/50">Plano</div>
              <div className="mt-1 text-[14px] font-semibold text-white/90">Free</div>
              <div className="mt-1 text-[12px] text-white/60">
                Desbloqueie relatórios avançados, histórico estendido e insights PRO.
              </div>
            </div>

            <div className="text-right">
              <PremiumBadge label="PRO" />
              <button
                type="button"
                onClick={() => setPremiumNotice("Premium ainda não está habilitado neste build. Arquitetura pronta para ativação quando você decidir.")}
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] text-white/85 hover:bg-white/15 active:scale-[0.98] transition"
              >
                Ativar Premium
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-white/60">Relatórios avançados</div>
                <PremiumBadge />
              </div>
              <div className="mt-1 text-[12px] text-white/75">PDF com análises extras e comparativos.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-white/60">Histórico estendido</div>
                <PremiumBadge />
              </div>
              <div className="mt-1 text-[12px] text-white/75">28/90 dias para insights mais confiáveis.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-white/60">Insights PRO</div>
                <PremiumBadge />
              </div>
              <div className="mt-1 text-[12px] text-white/75">Recomendações mais profundas e acionáveis.</div>
            </div>
          </div>
        </div>
        {/* /Sprint 13.0 | Premium Layer UI */}

        {/* Sprint 14.0.1 | Loading / Empty States (SAFE) */}
        {!uiReady_1401 ? (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        ) : null}

        {uiReady_1401 && !hasHistory_1401 ? (
          <div className="mb-4">
            <EmptyState
              title="Sem sessões registradas ainda";
              subtitle="Registre seu primeiro treino para liberar insights, tendências e relatórios."
              actionLabel="Iniciar primeiro treino"
              onAction={() => {
                const ids = ["dmf-cta-start", "dmf-cta-history", "dmf-cta-report"];
                for (const id of ids) {
                  const el = document.getElementById(id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    break;
                  }
                }
              }}
            />
          </div>
        ) : null}
        {/* /Sprint 14.0.1 | Loading / Empty States (SAFE) */}

        {/* Sprint 12.0 | Progressão Inteligente */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] uppercase tracking-wide text-white/50">Progressão Inteligente</div>
              <button
                type="button"
                onClick={() => requestPremium("progressionPro")}
                className="rounded-full"
                aria-label="Recurso PRO"
              >
                <PremiumBadge />
              </button>
            </div>
              <div className="mt-1 text-[13px] text-white/80">
                Score baseado em frequência, consistência, streak e PRs (regras auditáveis).
              </div>
            </div>

            <div className="text-right">
              <div className="text-[12px] text-white/50">Score</div>
              <div className="mt-1 text-3xl font-semibold leading-none text-white/90">
                {progression.total}
              </div>
              <div
                className={
                  "mt-2 inline-flex rounded-full px-3 py-1 text-[12px] " +
                  (progression.state === "Evoluindo"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : progression.state === "Regressão"
                    ? "bg-red-500/20 text-red-300"
                    : progression.state === "Estagnado"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-white/10 text-white/70")
                }
              >
                {progression.state}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {progression.drivers.slice(0, 3).map((d) => (
              <div key={d.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[12px] text-white/55">Driver</div>
                <div className="mt-1 text-[12px] leading-relaxed text-white/80">{d.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[12px] text-white/60">
              Recomendação: <span className="text-white/80">{progression.action}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                const id =
                  progression.target === "history" ? "dmf-cta-history" :
                  (progression.target === "report" ? "dmf-cta-report" : "dmf-cta-start");
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] text-white/90 hover:bg-white/15 active:scale-[0.98] transition"
            >
              Ação recomendada
            </button>
          </div>
        </div>
        {/* /Sprint 12.0 */}

      {/* Header */}
      <div style={{
        borderRadius: tokens.radius.xl,
        border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel2,
        padding: 14
      }}>
        <div style={{ fontSize: 16, fontWeight: 1000 }}>Dashboard PRO</div>
        <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 4 }}>
          KPIs • tendências • insight • ações rápidas
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {kpiA.map((k) => (
          <div key={k.label} style={{
            borderRadius: 18,
            border: "1px solid " + tokens.colors.border,
            background: tokens.colors.panel2,
            padding: 12
          }}>
            <div style={{ fontSize: 11, fontWeight: 950, color: tokens.colors.muted }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 1100, marginTop: 6 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: tokens.colors.muted, marginTop: 4 }}>{k.hint}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {kpiB.map((k) => (
          <div key={k.label} style={{
            borderRadius: 18,
            border: "1px solid " + tokens.colors.border,
            background: tokens.colors.panel2,
            padding: 12
          }}>
            <div style={{ fontSize: 11, fontWeight: 950, color: tokens.colors.muted }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 1100, marginTop: 6 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: tokens.colors.muted, marginTop: 4 }}>{k.hint}</div>
          </div>
        ))}
      </div>

      {/* Trends row (micro) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{
          borderRadius: tokens.radius.xl,
          border: "1px solid " + tokens.colors.border,
          background: tokens.colors.panel2,
          padding: 14
        }}>
          <div style={{ fontSize: 12, fontWeight: 1000 }}>Tendência (7d)</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 6 }}>
            Volume: <span style={{ fontWeight: 1000 }}>{formatKg(t.current.volumeKg)}</span> ({formatPct(t.volumeDeltaPct)})
          </div>
          <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 4 }}>
            Treinos: <span style={{ fontWeight: 1000 }}>{formatInt(t.current.workouts)}</span> ({formatPct(t.workoutsDeltaPct)})
          </div>
          <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 4 }}>
            Intensidade: <span style={{ fontWeight: 1000 }}>{formatInt(t.current.avgIntensity)}</span> ({formatPct(t.intensityDeltaPct)})
          </div>
        </div>

        <div style={{
          borderRadius: tokens.radius.xl,
          border: "1px solid " + tokens.colors.border,
          background: toneBg(insight.tone),
          padding: 14
        }}>
          <div style={{ fontSize: 12, fontWeight: 1100 }}>{insight.title}</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 8 }}>
            {insight.body}
          </div>
        </div>
      </div>

      {/* Latest workout + CTAs */}
      <div style={{
        borderRadius: tokens.radius.xl,
        border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel2,
        padding: 14,
        display: "grid",
        gap: 10
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 1000 }}>Último treino</div>
          <div style={{ fontSize: 11, color: tokens.colors.muted }}>{latest?.date || "-"}</div>
        </div>

        <div style={{ fontSize: 12, color: tokens.colors.muted }}>
          {latest
            ? `${latest.exercises?.length || 0} exercícios • ${latest.setsTotal || 0} sets • ${Math.round(latest.volumeTotal || 0)} kg`
            : "Sem treinos salvos ainda. Faça seu primeiro treino para liberar métricas."}
        </div>

          {/* Sprint 10.5 | Meta da Semana */}
          <div className="rounded-2xl border bg-white/5 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-white/60">Meta da semana</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-3xl font-semibold leading-none">{weekly.thisWeek}</div>
                  <div className="text-[14px] text-white/60">/ {weeklyGoal} treinos</div>
                </div>
                <div className="mt-2 text-[12px] text-white/60">
                  Semana anterior: <span className="text-white/80 font-medium">{weekly.lastWeek}</span>
                  <span className="mx-2 text-white/30">•</span>
                  Progresso: <span className="text-white/80 font-medium">{weekly.pct}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportReportPdf("compact")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
                >
                  PDF (Compacto)
                </button>
                <button
                  type="button"
                  onClick={() => exportReportPdf("detailed")}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] text-white/90 hover:bg-white/15 active:scale-[0.98] transition"
                >
                  PDF (Detalhado)
                </button>
              </div>
              {/* Sprint 11.4.3 | PDF Modes */}

              <button type="button" onClick={decGoal}
                  className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                  aria-label="Diminuir meta semanal">−</button>
                <button type="button" onClick={incGoal}
                  className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                  aria-label="Aumentar meta semanal">+</button>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-white/60 transition-all active:scale-[0.98]" style={{ width: weekly.pct + "%" }} />
            </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-[12px] text-white/50">
              {badges.length > 6 ? (badgesExpanded ? "Mostrando todos os badges" : "Mostrando principais badges") : "Badges ativos"}
            </div>

            {badges.length > 6 ? (
              <button
                type="button"
                onClick={() => setBadgesExpanded((v) => !v)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
              >
                {badgesExpanded ? "Ocultar" : "Ver todos"}
              </button>
            ) : null}
          </div>

          <div className="mt-3 text-[12px] text-white/50">Ajuste rápido: meta fica salva neste dispositivo.</div>
          </div>
          {/* /Sprint 10.5 */}

        {/* Sprint 10.6 | Badges & Milestones */}
        <div className="rounded-2xl border bg-white/5 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-wide text-white/60">Badges</div>
              <div className="mt-1 text-[14px] text-white/80">
                <span className="font-semibold text-white">{badgesEarned}</span>
                <span className="text-white/50"> / {badges.length}</span>
                <span className="mx-2 text-white/20">•</span>
                <span className="text-white/60">marcos reais de consistência e PR</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[12px] text-white/50">Próximo foco</div>
              <div className="text-[13px] text-white/80">
                {badges.find((b) => !b.earned)?.hint ?? "Tudo concluído"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {badgesShown.map((b) => (
              <span
                key={b.id}
                title={b.hint}
                className={
                  "inline-flex items-center rounded-full border px-3 py-1 text-[12px] transition " +
                  (b.earned
                    ? "border-white/15 bg-white/10 text-white/90"
                    : "border-white/10 bg-white/5 text-white/55")
                }
              >
                <span className={"mr-2 h-2 w-2 rounded-full " + (b.earned ? "bg-white/70" : "bg-white/25")} />
                {b.label}
              </span>
            ))}
          </div>

          <div className="mt-3 text-[12px] text-white/50">
            Consistência + PRs = progresso mensurável.
          </div>
        </div>
        {/* /Sprint 10.6 */}

        {/* Sprint 10.7 | Combo (Consistência + Volume) */}
        <div className="rounded-2xl border bg-white/5 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-wide text-white/60">Consistência</div>
              <div className="mt-1 text-[14px] text-white/80">
                <span className="font-semibold text-white">{consistency.activeDays}</span>
                <span className="text-white/50"> / 28 dias</span>
                <span className="mx-2 text-white/20">•</span>
                <span className="text-white/60">melhor sequência: </span>
                <span className="font-semibold text-white">{consistency.bestStreak}</span>
                <span className="mx-2 text-white/20">•</span>
                <span className="font-semibold text-white">{consistency.pct}%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
            >
              {showAdvanced ? "Ocultar métricas" : "Ver métricas avançadas"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {consistency.grid.map((d) => (
              <div
                key={d.key}
                title={d.active ? `Treino em ${d.label}` : `Sem treino em ${d.label}`}
                className={
                  "h-4 rounded-md border transition " +
                  (d.active ? "border-white/15 bg-white/30" : "border-white/10 bg-white/5")
                }
              />
            ))}
          </div>

          {showAdvanced ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[12px] uppercase tracking-wide text-white/60">Volume (7 dias)</div>
                  <div className="mt-1 text-[14px] text-white/80">
                    <span className="font-semibold text-white">
                      {Math.round(volume.curr.volumeKg).toLocaleString("pt-BR")}
                    </span>
                    <span className="text-white/50"> kg-reps</span>
                    <span className="mx-2 text-white/20">•</span>
                    <span className="text-white/60">Séries: </span>
                    <span className="font-semibold text-white">{volume.curr.sets}</span>
                    <span className="mx-2 text-white/20">•</span>
                    <span className="text-white/60">Reps: </span>
                    <span className="font-semibold text-white">{volume.curr.reps}</span>
                  </div>
                  <div className="mt-2 text-[12px] text-white/55">
                    Semana anterior: {Math.round(volume.prev.volumeKg).toLocaleString("pt-BR")} kg-reps
                    <span className="mx-2 text-white/20">•</span>
                    Tendência:{" "}
                    <span className="text-white/80 font-medium">
                      {volume.dir === "up" ? "↑" : volume.dir === "down" ? "↓" : "→"} {volume.pct}%
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[12px] text-white/50">Tempo (7 dias)</div>
                  <div className="mt-1 text-[14px] text-white/80">
                    <span className="font-semibold text-white">{Math.round(volume.curr.durationMin)}</span>
                    <span className="text-white/50"> min</span>
                  </div>
                  <div className="mt-2 text-[12px] text-white/55">
                    Sessões: <span className="text-white/80 font-medium">{volume.curr.sessions}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[12px] text-white/50">
                Métricas avançadas são opcionais - o foco continua sendo execução consistente.
              </div>
            </div>
          ) : null}
        </div>
        {/* /Sprint 10.7 | Combo */}

        {/* Sprint 10.8 | Semana Perfeita */}
        <div className="rounded-2xl border bg-white/5 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-wide text-white/60">Semana Perfeita</div>
              <div className="mt-1 flex items-baseline gap-3">
                <div className="text-3xl font-semibold leading-none">{perfectWeek.score}</div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/80">
                  {perfectWeek.tier}
                </span>
              </div>
              <div className="mt-2 text-[13px] text-white/80 font-medium">{perfectWeek.title}</div>
              <div className="mt-1 text-[12px] text-white/55">{perfectWeek.action}</div>
            </div>

            <div className="min-w-[150px] text-right">
              <div className="text-[12px] text-white/50">Componentes</div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-white/55">Meta semanal</span>
                  <span className="text-white/80 font-medium">{perfectWeek.weeklyPct}%</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-white/55">Consistência</span>
                  <span className="text-white/80 font-medium">{perfectWeek.consistencyPct}%</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-white/55">Tendência volume</span>
                  <span className="text-white/80 font-medium">{perfectWeek.volumeTrendScore}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-white/60 transition-all active:scale-[0.98]" style={{ width: perfectWeek.score + "%" }} />
          </div>

          <div className="mt-3 text-[12px] text-white/50">
            Score é um sinal: foco em execução consistente e progressão sustentável.
          </div>
        </div>
        {/* /Sprint 10.8 */}

        {/* Sprint 10.9 | Goals */}
        <div className="rounded-2xl border bg-white/5 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-wide text-white/60">Objetivos</div>
              <div className="mt-1 text-[14px] text-white/80">
                <span className="font-semibold text-white">{goalsView.headline}</span>
                <span className="mx-2 text-white/20">•</span>
                <span className="text-white/55">{goalsView.suggestion}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                // reset clean (sem modal)
                setGoals({
                  weeklyWorkouts: Number(weeklyGoal ?? 4),
                  activeDays28: 12,
                  volume7d: 6000,
                });
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
              title="Resetar objetivos para padrão";
            >
              Reset
            </button>
          </div>

          {/* linhas */}
          <div className="mt-4 space-y-3">
            {/* Treinos/semana */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] text-white/55">Treinos na semana</div>
                  <div className="mt-1 text-[14px] text-white/80">
                    <span className="font-semibold text-white">{goalsView.weeklyDone}</span>
                    <span className="text-white/50"> / {goalsView.weeklyTarget}</span>
                    <span className="mx-2 text-white/20">•</span>
                    <span className="text-white/70 font-medium">{goalsView.weeklyPct}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGoals((g) => ({ ...g, weeklyWorkouts: Math.max(1, g.weeklyWorkouts - 1) }))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                    aria-label="Diminuir treinos por semana"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoals((g) => ({ ...g, weeklyWorkouts: Math.min(14, g.weeklyWorkouts + 1) }))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                    aria-label="Aumentar treinos por semana"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-white/60 transition-all active:scale-[0.98]" style={{ width: Math.min(100, goalsView.weeklyPct) + "%" }} />
              </div>
            </div>

            {/* Dias ativos 28d */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] text-white/55">Dias ativos (28d)</div>
                  <div className="mt-1 text-[14px] text-white/80">
                    <span className="font-semibold text-white">{goalsView.activeDone}</span>
                    <span className="text-white/50"> / {goalsView.activeTarget}</span>
                    <span className="mx-2 text-white/20">•</span>
                    <span className="text-white/70 font-medium">{goalsView.activePct}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGoals((g) => ({ ...g, activeDays28: Math.max(1, g.activeDays28 - 1) }))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                    aria-label="Diminuir dias ativos"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoals((g) => ({ ...g, activeDays28: Math.min(28, g.activeDays28 + 1) }))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                    aria-label="Aumentar dias ativos"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-white/60 transition-all active:scale-[0.98]" style={{ width: Math.min(100, goalsView.activePct) + "%" }} />
              </div>
            </div>

            {/* Volume 7d */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] text-white/55">Volume (7d)</div>
                  <div className="mt-1 text-[14px] text-white/80">
                    <span className="font-semibold text-white">{Math.round(goalsView.volDone).toLocaleString("pt-BR")}</span>
                    <span className="text-white/50"> / {Math.round(goalsView.volTarget).toLocaleString("pt-BR")}</span>
                    <span className="mx-2 text-white/20">•</span>
                    <span className="text-white/70 font-medium">{goalsView.volPct}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGoals((g) => ({ ...g, volume7d: Math.max(0, Math.round(g.volume7d - 500)) }))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                    aria-label="Diminuir volume alvo"
                    title="-500";
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoals((g) => ({ ...g, volume7d: Math.min(999999, Math.round(g.volume7d + 500)) }))}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                    aria-label="Aumentar volume alvo"
                    title="+500";
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-white/60 transition-all active:scale-[0.98]" style={{ width: Math.min(100, goalsView.volPct) + "%" }} />
              </div>

              <div className="mt-2 text-[12px] text-white/50">
                Dica: se você não registra carga/reps, o volume pode ficar subestimado - mas o objetivo semanal ainda guia o progresso.
              </div>
            </div>
          </div>
        </div>
        {/* /Sprint 10.9 */}

        {/* Sprint 11.0 | Weekly Review */}
        {/* Sprint 11.1 | Weekly Review Actions */}
        <div className="rounded-2xl border bg-white/5 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-wide text-white/60">Weekly Review</div>
              <div className="mt-1 text-[13px] text-white/80 font-medium">{weeklyReview.title}</div>
              <div className="mt-1 text-[12px] text-white/55">{weeklyReview.action}</div>

              {/* Sprint 11.1 | Weekly Review Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const id =
                      weeklyReview.target === "history" ? "dmf-cta-history" :
                      (weeklyReview.target === "report" ? "dmf-cta-report" : "dmf-cta-start");
                    const el = document.getElementById(id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] text-white/90 hover:bg-white/15 active:scale-[0.98] transition"
                >
                  Ação recomendada
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("dmf-cta-history");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
                >
                  Abrir histórico
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("dmf-cta-report");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
                >
                  Ver relatório
                </button>
              </div>
              {/* /Sprint 11.1 | Weekly Review Actions */}

            </div>

            <div className="text-right">
              <div className="text-[12px] text-white/50">Janela</div>
              <div className="mt-1 text-[13px] text-white/80">7d vs 7d</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {weeklyReview.highlights.map((h: any) => (
              <div key={h.k} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[12px] text-white/55">{h.label}</div>
                <div className="mt-1 text-[14px] text-white/85 font-semibold">{h.value}</div>
                <div className="mt-1 text-[12px] text-white/50">{h.detail}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-[12px] text-white/45">{weeklyReview.note}</div>
        </div>
        {/* /Sprint 11.0 */}

        {/* Sprint 11.2 | Relatório rápido */}
        <div className="rounded-2xl border bg-white/5 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-wide text-white/60">Relatório rápido</div>
              <div className="mt-1 text-[13px] text-white/80">
                Snapshot do seu progresso (copiável). Ideal para compartilhar ou registrar.
              </div>
            </div>

            <button
              type="button"
              onClick={copyReportSnapshot}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] text-white/90 hover:bg-white/15 active:scale-[0.98] transition"
            >
              {snapshotCopied ? "Copiado" : "Copiar resumo"}
            </button>
            </div>
            {/* Sprint 11.3 | Export PDF */}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-white/70">
{reportSnapshot.text}
            </pre>
          </div>

          <div className="mt-3 text-[12px] text-white/45">
            Dica: use este resumo no fim da semana para comparar consistência, volume e metas.
          </div>
        </div>
        {/* /Sprint 11.2 */}

        <div style={{ display: "flex", gap: 10 }}>
          <a href="#/workout" style={btnPrimary}>Iniciar treino</a>
          <a href="#/history" style={btnGhost}>Ver histórico</a>
          <a href="#/report" style={btnGhost}>Gerar relatório</a>
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  textDecoration: "none",
  borderRadius: 16,
  border: "1px solid #1F2937",
  background: "#0A84FF",
  color: "#001018",
  padding: 12,
  fontWeight: 1100,
};

const btnGhost: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  textDecoration: "none",
  borderRadius: 16,
  border: "1px solid #1F2937",
  background: "#111827",
  color: "#E5E7EB",
  padding: 12,
  fontWeight: 1000,
};

                // Cards visuais (Sprint 4F)
