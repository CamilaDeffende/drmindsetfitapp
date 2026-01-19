import { useEffect, useMemo, useState } from "react";
import { REPORT_HISTORY_BASE_KEY, CURRENT_PATIENT_KEY, reportHistoryKey, PATIENTS_KEY, PDF_VARIANT_KEY } from "@/lib/storageKeys";

type ReportHistoryItem = {
  id: string;
  createdAtISO: string;
  variant: "coach" | "patient";
  fileName: string;
  metaSource?: string;
  summary?: string;
  pinned?: boolean;
  label?: string;
};

function safeParse(raw: string | null): any[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

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

function formatBytes(n: number): string {
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let x = n;
  while (x >= 1024 && i < u.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function Chip({ variant }: { variant: "coach" | "patient" }) {
  const isPatient = variant === "patient";
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.2,
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: isPatient ? "rgba(16,185,129,0.10)" : "rgba(0,149,255,0.12)",
        color: "rgba(255,255,255,0.92)",
      }}
      title={isPatient ? "Versão Paciente (clean)" : "Versão Coach (com assinatura)"}
    >
      {isPatient ? "Paciente" : "Coach"}
    </span>
  );
}

export default function HistoryReports() {
  const [patientId, _setPatientId] = useState<string>(() => {
  try { return localStorage.getItem(CURRENT_PATIENT_KEY) || "default"; } catch { return "default"; }
});
type Patient = { id: string; name: string; createdAtISO: string };

const safeParsePatients = (raw: string | null): Patient[] => {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as Patient[]) : [];
  } catch {
    return [];
  }
};

const slugify = (x: string) =>
  String(x ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 32) || "paciente";

const reportKey = useMemo(() => reportHistoryKey(patientId), [patientId]);

const [patients, setPatients] = useState<Patient[]>(() => {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY);
    const list = safeParsePatients(raw);
    // garante 'default'
    if (!list.find((p) => p.id === "default")) {
      return [{ id: "default", name: "Padrão", createdAtISO: new Date().toISOString() }, ...list].slice(0, 50);
    }
    return list.slice(0, 50);
  } catch {
    return [{ id: "default", name: "Padrão", createdAtISO: new Date().toISOString() }];
  }
});

const [newPatientName, setNewPatientName] = useState<string>("");

// Sprint 9C.1 | Timeline + filtros + insights (SAFE)
const [rangeDays, setRangeDays] = useState<number>(28);

const timeline_9c1 = useMemo(() => {
  let list: any[] = [];
  try {
    const raw = localStorage.getItem(reportKey);
    const parsed = raw ? JSON.parse(raw) : [];
    list = Array.isArray(parsed) ? parsed : [];
  } catch {
    list = [];
  }
  const days = Number(rangeDays) || 0;
  const now = Date.now();
  const cutoff = days > 0 ? (now - days * 24 * 60 * 60 * 1000) : -Infinity;

  const within = (iso: any) => {
    try {
      const t = Date.parse(String(iso || ""));
      return Number.isFinite(t) ? t >= cutoff : true;
    } catch {
      return true;
    }
  };

  const picked = list
    .filter((it) => it && within((it as any).createdAtISO))
    .slice(0, 120);

  // Sprint 9C.2 | Métricas (SAFE) a partir do histórico
  const toTime = (iso: unknown): number => {
    try {
      const t = Date.parse(String(iso || ""));
      return Number.isFinite(t) ? t : 0;
    } catch { return 0; }
  };

  // score por item: coach pesa mais (tende a ser mais completo), patient pesa menos
  const scoreOf = (it: any): number => {
    const v = String((it && it.variant) || "coach");
    return v === "coach" ? 2 : 1;
  };

  const sorted = picked.slice().sort((a,b) => toTime(b?.createdAtISO) - toTime(a?.createdAtISO));
  const last = sorted[0] || null;
  const prev = sorted[1] || null;

  const sumScore = (arr: any[]): number => (arr || []).reduce((acc: number, it: any) => acc + scoreOf(it), 0);

  const windowSlice = (daysN: number): any[] => {
    const now = Date.now();
    const cutoff = now - Number(daysN) * 24 * 60 * 60 * 1000;
    return sorted.filter((it) => toTime(it?.createdAtISO) >= cutoff);
  };

  const w7 = windowSlice(7);
  const w14 = windowSlice(14);
  const w28 = windowSlice(28);

  const s7 = sumScore(w7);
  const s14 = sumScore(w14);
  const s28 = sumScore(w28);

  const trend = (a: number, b: number): string => {
    const da = Number(a) || 0;
    const db = Number(b) || 0;
    if (db <= 0 && da <= 0) return "—";
    if (db <= 0 && da > 0) return "↑";
    if (da === db) return "→";
    return da > db ? "↑" : "↓";
  };

  // insights textuais (sem “inventar”): apenas contagem/score e variação
  const lastLabel = last ? (last.variant === "patient" ? "Paciente" : "Coach") : "—";
  const prevLabel = prev ? (prev.variant === "patient" ? "Paciente" : "Coach") : "—";
  const deltaLP = last && prev ? (scoreOf(last) - scoreOf(prev)) : 0;

  const qualityHint = (it: any): string => {
    if (!it) return "Sem dados";
    return it.variant === "coach" ? "Relatório completo" : "Relatório simplificado";
  };
  const groups = new Map<string, any[]>();
  for (const it of picked) {
    const iso = String((it as any).createdAtISO || "");
    const key = iso ? iso.slice(0, 10) : "sem-data";
    const arr = groups.get(key) || [];
    arr.push(it);
    groups.set(key, arr);
  }

  const keys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));
  const rows = keys.map((k) => ({ date: k, items: (groups.get(k) || []).slice(0, 20) }));

  // Insights simples e confiáveis (sem inventar métrica): volume + frequência
  const total = picked.length;
  const daysActive = keys.length;
  const rate = days > 0 ? (total / Math.max(1, days)) : 0;
  const badge = total >= 10 ? "Alta" : total >= 4 ? "Boa" : total >= 1 ? "Baixa" : "—";

  return { rows, total, daysActive, rate, badge, last, prev, lastLabel, prevLabel, deltaLP, qualityHint, s7, s14, s28, trend };
}, [reportKey, rangeDays]);

const writePatients = (list: Patient[]) => {
  const next = (Array.isArray(list) ? list : []).slice(0, 50);
  setPatients(next);
  try { localStorage.setItem(PATIENTS_KEY, JSON.stringify(next)); } catch {}
};

const ensureDefaultPatient = () => {
  if (!patients.find((p) => p.id === "default")) {
    writePatients([{ id: "default", name: "Padrão", createdAtISO: new Date().toISOString() }, ...patients]);
  }
};

useEffect(() => {
  ensureDefaultPatient();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const createPatient = (name: string) => {
  const nm = String(name ?? "").trim();
  if (!nm) return;
  const base = slugify(nm);
  const id = base + "-" + String(Date.now()).slice(-6);
  const item = { id, name: nm, createdAtISO: new Date().toISOString() };
  const next = [item, ...patients.filter((p) => p.id !== id)].slice(0, 50);
  writePatients(next);
  try { localStorage.setItem(CURRENT_PATIENT_KEY, id); } catch {}
  _setPatientId(id);
  setNewPatientName("");
};

const selectPatient = (id: string) => {
  const pid = String(id || "default");
  try { localStorage.setItem(CURRENT_PATIENT_KEY, pid); } catch {}
  _setPatientId(pid);
};

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
const [items, setItems] = useState<ReportHistoryItem[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "coach" | "patient">("all");
  const [showAll, setShowAll] = useState(false);

  // Sprint 8A | feedback (toast)
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"good" | "warn" | "bad">("good");
  const pushToast = (msg: string, tone: "good" | "warn" | "bad" = "good") => {
    setToastMsg(msg);
    setToastTone(tone);
    window.setTimeout(() => setToastMsg(null), 3200);
  };

  const normalizeItem = (x: any): ReportHistoryItem | null => {
    try {
      const id = String(x?.id || "").trim();
      const createdAtISO = String(x?.createdAtISO || "").trim();
      const variant: "coach" | "patient" = x?.variant === "patient" ? "patient" : "coach";
      const fileName = String(x?.fileName || "").trim();

      if (!id || !createdAtISO || !fileName) return null;

      const pinned = Boolean(x?.pinned);
      const label = typeof x?.label === "string" ? x.label.trim() : undefined;
      const summary = typeof x?.summary === "string" ? x.summary.trim() : undefined;
      const metaSource = typeof x?.metaSource === "string" ? x.metaSource : undefined;

      return {
        id,
        createdAtISO,
        variant,
        fileName,
        metaSource,
        summary,
        pinned,
        label: label || undefined,
      };
    } catch {
      return null;
    }
  };

  const normalizeList = (rawList: any): ReportHistoryItem[] => {
    const arr = Array.isArray(rawList) ? rawList : [];
    const out: ReportHistoryItem[] = [];
    for (const it of arr) {
      const n = normalizeItem(it);
      if (n) out.push(n);
    }
    out.sort((a, b) => (a.createdAtISO < b.createdAtISO ? 1 : -1));
    return out.slice(0, 30);
  };

  const mergeById = (incoming: ReportHistoryItem[], current: ReportHistoryItem[]) => {
    const map = new Map<string, ReportHistoryItem>();
    for (const it of incoming) map.set(it.id, it);
    for (const it of current) if (!map.has(it.id)) map.set(it.id, it);
    const merged = Array.from(map.values()).sort((a, b) => (a.createdAtISO < b.createdAtISO ? 1 : -1));
    return merged.slice(0, 30);
  };

  const refresh = () => {
    if (typeof window === "undefined") return;
    const parsed = safeParse(window.localStorage.getItem(reportKey));
    setItems(normalizeList(parsed));
  };

  const write = (list: any) => {
    const next = normalizeList(list);
    try {
      window.localStorage.setItem(reportKey, JSON.stringify(next));
    } catch {}
    setItems(next);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bytes = useMemo(() => {
    try {
      return new Blob([JSON.stringify(items || [])]).size;
    } catch {
      return 0;
    }
  }, [items]);

  const filtered = useMemo(() => {
    const qq = String(q || "").toLowerCase().trim();
    const byFilter = (it: ReportHistoryItem) => (filter === "all" ? true : it.variant === filter);
    const byQuery = (it: ReportHistoryItem) => {
      if (!qq) return true;
      const hay = [it.label || "", it.fileName || "", it.summary || "", it.metaSource || "", it.createdAtISO || ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    };

    const list = normalizeList(items || []);
    const pinned = list.filter((x) => x.pinned).filter(byFilter).filter(byQuery);
    const normal = list.filter((x) => !x.pinned).filter(byFilter).filter(byQuery);
    const desc = (a: ReportHistoryItem, b: ReportHistoryItem) => (a.createdAtISO < b.createdAtISO ? 1 : -1);
    return [...pinned.sort(desc), ...normal.sort(desc)];
  }, [items, q, filter]);

  const visible = useMemo(() => (showAll ? filtered : filtered.slice(0, 12)), [filtered, showAll]);

  const nearLimit = (items?.length || 0) >= 26;

  const togglePin = (id: string) => {
    write((items || []).map((x: any) => (x.id === id ? { ...x, pinned: !x.pinned } : x)));
  };

  const rename = (id: string) => {
    const cur: any = (items || []).find((x: any) => x.id === id);
    const nextLabel = window.prompt("Nome do relatório (label):", String(cur?.label || ""));
    if (nextLabel === null) return;
    const label = String(nextLabel || "").trim();
    write((items || []).map((x: any) => (x.id === id ? { ...x, label: label || undefined } : x)));
    pushToast("Nome atualizado.", "good");
  };

  const remove = (id: string) => {
    const ok = window.confirm("Excluir este relatório do histórico?");
    if (!ok) return;
    write((items || []).filter((x) => x.id !== id));
    pushToast("Relatório excluído.", "warn");
  };

  const clearAll = () => {
    const ok = window.confirm("Limpar TODO o histórico de relatórios?");
    if (!ok) return;
    write([]);
    pushToast("Histórico limpo.", "warn");
  };

  const exportJson = () => {
    try {
      const payload = normalizeList(items || []);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mindsetfit-report-history.json";
      a.click();
      URL.revokeObjectURL(url);
      pushToast(`Exportado: ${payload.length} item(ns)`, "good");
    } catch {
      pushToast("Falha ao exportar. Tente novamente.", "bad");
    }
  };

  const importJson = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.onchange = async () => {
        try {
          const file = input.files?.[0];
          if (!file) return;

          if (file.size > 1024 * 1024) {
            pushToast("Arquivo muito grande (limite ~1MB).", "warn");
            return;
          }

          const text = await file.text();
          let parsed: any;
          try {
            parsed = JSON.parse(text);
          } catch {
            pushToast("JSON inválido. Verifique o arquivo.", "bad");
            return;
          }

          const incoming = normalizeList(parsed);
          if (!incoming.length) {
            pushToast("Arquivo válido, mas sem itens reconhecidos.", "warn");
            return;
          }

          const before = (items || []).length;
          const merged = mergeById(incoming, normalizeList(items || []));
          write(merged);

          const added = Math.max(0, merged.length - before);
          pushToast(`Importado: ${incoming.length} • Mesclado: ${merged.length} ( +${added} )`, "good");
        } catch {
          pushToast("Falha ao importar. Tente novamente.", "bad");
        }
      };
      input.click();
    } catch {
      pushToast("Importação indisponível neste navegador.", "bad");
    }
  };

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      {/* Sprint 9B.2 | Seletor de Paciente */}
      <div data-ui="patient-switcher" className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[12px] uppercase tracking-wide text-white/50">Paciente</div>
            <div className="mt-1 text-[14px] font-semibold text-white/90">{patients.find(p => p.id === patientId)?.name || patientId}</div>
            <div className="mt-1 text-[12px] text-white/60">Histórico isolado por paciente (local, sem login).</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={patientId}
              onChange={(e) => selectPatient(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-white/85 outline-none"
            >
              {(patients?.length ? patients : [{id:"default",name:"Padrão",createdAtISO:""}]).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="Novo paciente…"
                className="w-40 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-white/85 placeholder:text-white/35 outline-none"
              />
              <button
                type="button"
                onClick={() => createPatient(newPatientName)}
                className="rounded-xl border border-[rgba(0,149,255,0.35)] bg-[rgba(0,149,255,0.12)] px-3 py-2 text-[12px] text-white hover:bg-[rgba(0,149,255,0.18)] active:scale-[0.98] transition"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      </div>

  {/* Sprint 9C.1 | Timeline + Insights */}
  <div data-ui="timeline-9c1" className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="text-[12px] uppercase tracking-wide text-white/50">Timeline</div>
        <div className="mt-1 text-[12px] text-white/70">
          <span className="font-semibold text-white/85">{timeline_9c1.total}</span> relatórios •
          <span className="font-semibold text-white/85"> {timeline_9c1.daysActive}</span> dias ativos •
          Frequência: <span className="font-semibold text-white/85">{timeline_9c1.badge}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setRangeDays(7)} className={`rounded-xl border border-white/10 px-3 py-2 text-[12px] text-white/85 transition ${rangeDays===7 ? "bg-[rgba(0,149,255,0.18)] border-[rgba(0,149,255,0.35)]" : "bg-black/30 hover:bg-black/40"}`}>7d</button>
        <button type="button" onClick={() => setRangeDays(14)} className={`rounded-xl border border-white/10 px-3 py-2 text-[12px] text-white/85 transition ${rangeDays===14 ? "bg-[rgba(0,149,255,0.18)] border-[rgba(0,149,255,0.35)]" : "bg-black/30 hover:bg-black/40"}`}>14d</button>
        <button type="button" onClick={() => setRangeDays(28)} className={`rounded-xl border border-white/10 px-3 py-2 text-[12px] text-white/85 transition ${rangeDays===28 ? "bg-[rgba(0,149,255,0.18)] border-[rgba(0,149,255,0.35)]" : "bg-black/30 hover:bg-black/40"}`}>28d</button>
        <button type="button" onClick={() => setRangeDays(0)} className={`rounded-xl border border-white/10 px-3 py-2 text-[12px] text-white/85 transition ${rangeDays===0 ? "bg-[rgba(0,149,255,0.18)] border-[rgba(0,149,255,0.35)]" : "bg-black/30 hover:bg-black/40"}`}>Tudo</button>
      </div>
    </div>
    {/* Sprint 9C.2 | Insights */}
    <div data-ui="insights-9c2" className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[12px] uppercase tracking-wide text-white/50">Insights</div>
          <div className="mt-1 text-[12px] text-white/70">
            Último: <span className="font-semibold text-white/85">{timeline_9c1.lastLabel}</span> • {timeline_9c1.qualityHint(timeline_9c1.last)}
            {timeline_9c1.prev ? (
              <>
                {" "}• Anterior: <span className="font-semibold text-white/85">{timeline_9c1.prevLabel}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white/75">
            7d: <span className="font-semibold text-white/85">{timeline_9c1.s7}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white/75">
            14d: <span className="font-semibold text-white/85">{timeline_9c1.s14}</span> <span className="text-white/55">{timeline_9c1.trend(timeline_9c1.s14, timeline_9c1.s7)}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white/75">
            28d: <span className="font-semibold text-white/85">{timeline_9c1.s28}</span> <span className="text-white/55">{timeline_9c1.trend(timeline_9c1.s28, timeline_9c1.s14)}</span>
          </div>
        </div>
      </div>

      {timeline_9c1.last && timeline_9c1.prev ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-[12px] text-white/70">
          Comparação rápida: {timeline_9c1.deltaLP > 0 ? (
            <span className="font-semibold text-white/85">↑ Mais completo</span>
          ) : timeline_9c1.deltaLP < 0 ? (
            <span className="font-semibold text-white/85">↓ Mais simples</span>
          ) : (
            <span className="font-semibold text-white/85">→ Mesmo nível</span>
          )}
          <span className="text-white/55"> (coach=2, paciente=1)</span>
        </div>
      ) : null}
    </div>

    <div className="mt-4 grid gap-3">
      {(timeline_9c1.rows?.length ? timeline_9c1.rows : []).slice(0, 10).map((g: any) => (
        <div key={g.date} className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] font-semibold text-white/85">{g.date === "sem-data" ? "Sem data" : g.date}</div>
            <div className="text-[11px] text-white/55">{(g.items?.length || 0)} itens</div>
          </div>
          <div className="mt-2 grid gap-2">
            {(g.items?.length ? g.items : []).slice(0, 5).map((it: any) => (
              <div key={it.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold text-white/85">{it.fileName || "Relatório"}</div>
                  <div className="text-[11px] text-white/55">{it.variant === "patient" ? "Paciente" : "Coach"} • {it.summary || ""}</div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Regerar (mantém lógica existente do app: set variant e aciona botão principal)
                      try { localStorage.setItem(PDF_VARIANT_KEY, it.variant); } catch {}
                      try { localStorage.setItem("mindsetfit:currentPatient:v1", patientId || "default"); } catch {}
                      setTimeout(() => {
                        const btn = document.querySelector('button[data-action="download-premium-pdf"]');
                        (btn as any)?.click?.();
                      }, 60);
                    }}
                    className="rounded-xl border border-[rgba(0,149,255,0.35)] bg-[rgba(0,149,255,0.12)] px-3 py-2 text-[11px] text-white hover:bg-[rgba(0,149,255,0.18)] active:scale-[0.98] transition"
                  >
                    Gerar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!timeline_9c1.total ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-[12px] text-white/70">
          Sem relatórios no período selecionado. Gere um PDF para alimentar a timeline.
        </div>
      ) : null}
    </div>
  </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Histórico de Relatórios</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Até 30 relatórios no dispositivo • Uso atual: {formatBytes(bytes)}
            {nearLimit ? " • Perto do limite (30)" : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="#/"
            style={{
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "transparent",
              color: "white",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            Voltar ao Dashboard
          </a>
          <button
            onClick={refresh}
            style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
          >
            Atualizar
          </button>
          <button
            onClick={clearAll}
            style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
          >
            Limpar
          </button>
          <button
            onClick={exportJson}
            style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(0,149,255,0.35)", background: "rgba(0,149,255,0.10)", color: "white", cursor: "pointer", fontSize: 12 }}
          >
            Exportar
          </button>
          <button
            onClick={importJson}
            style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "white", cursor: "pointer", fontSize: 12 }}
          >
            Importar
          </button>
        </div>
      </div>

      {toastMsg ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              toastTone === "good"
                ? "rgba(16,185,129,0.10)"
                : toastTone === "warn"
                ? "rgba(245,158,11,0.10)"
                : "rgba(239,68,68,0.10)",
            color: "rgba(255,255,255,0.92)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {toastMsg}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ((e.target as HTMLInputElement).value)}
          placeholder="Buscar (nome, data, resumo...)"
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.18)",
            color: "white",
            fontSize: 12,
            outline: "none",
            minWidth: 240,
          }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter((e.target as HTMLSelectElement).value as any)}
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

        {filtered.length > 12 ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "white", cursor: "pointer", fontSize: 12 }}
          >
            {showAll ? "Mostrar menos" : "Mostrar todos"}
          </button>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {visible.map((it) => (
          <div
            key={it.id}
            style={{
              padding: 12,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: it.pinned ? "rgba(0,149,255,0.10)" : "rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 520 }}>
                    {it.label ? it.label : it.fileName}
                  </div>
                  <Chip variant={it.variant} />
                  {it.pinned ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,149,255,0.35)",
                        background: "rgba(0,149,255,0.10)",
                        opacity: 0.95,
                      }}
                      title="Fixado no topo"
                    >
                      PIN
                    </span>
                  ) : null}
                </div>

                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }} title={it.createdAtISO}>
                  {fmtDateHuman(it.createdAtISO)} • {it.summary || "—"}
                </div>

                {it.metaSource ? (
                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7, wordBreak: "break-word" }}>
                    Fonte: {it.metaSource}
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  onClick={() => togglePin(it.id)}
                  style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
                >
                  {it.pinned ? "Despin" : "Pin"}
                </button>
                <button
                  onClick={() => rename(it.id)}
                  style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
                >
                  Renomear
                </button>
                <button
                  onClick={() => remove(it.id)}
                  style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "white", cursor: "pointer", fontSize: 12 }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}

        {!filtered.length ? (
          <div style={{ padding: 12, borderRadius: 16, border: "1px dashed rgba(255,255,255,0.18)", opacity: 0.85, fontSize: 12 }}>
            Ainda não há relatórios aqui. Gere seu primeiro PDF Premium e ele ficará salvo neste dispositivo.
          </div>
        ) : null}
      </div>
    </div>
  );
}
