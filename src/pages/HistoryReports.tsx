import { useEffect, useMemo, useState } from "react";

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

const REPORT_HISTORY_KEY = "mindsetfit:reportHistory:v1";

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
    const parsed = safeParse(window.localStorage.getItem(REPORT_HISTORY_KEY));
    setItems(normalizeList(parsed));
  };

  const write = (list: any) => {
    const next = normalizeList(list);
    try {
      window.localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(next));
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
