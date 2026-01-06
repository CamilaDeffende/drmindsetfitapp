import React, { useEffect, useMemo, useState } from "react";
import { tokens } from "../../ui/tokens";

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }

export function WorkoutTimer() {
  const [mode, setMode] = useState<"Countdown"|"Intervals">("Countdown");
  const [seconds, setSeconds] = useState(30);
  const [running, setRunning] = useState(false);

  const [work, setWork] = useState(30);
  const [rest, setRest] = useState(15);
  const [rounds, setRounds] = useState(6);
  const [phase, setPhase] = useState<"work"|"rest">("work");
  const [round, setRound] = useState(1);

  const display = useMemo(() => {
    const s = seconds % 60;
    const m = Math.floor(seconds / 60);
    return `${m}:${String(s).padStart(2,"0")}`;
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          if (mode === "Intervals") {
            if (phase === "work") { setPhase("rest"); return rest; }
            if (round >= rounds) { setRunning(false); setPhase("work"); setRound(1); return work; }
            setRound(r => r + 1); setPhase("work"); return work;
          }
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, mode, phase, rest, work, round, rounds]);

  const total = mode === "Countdown" ? 30 : (phase === "work" ? work : rest);
  const pct = total ? clamp(seconds / total, 0, 1) : 0;

  const ringSize = 220;
  const r = 92;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  function reset() {
    setRunning(false);
    if (mode === "Countdown") setSeconds(30);
    else { setPhase("work"); setRound(1); setSeconds(work); }
  }

  function start() {
    if (mode === "Countdown") setRunning(true);
    else { setPhase("work"); setRound(1); setSeconds(work); setRunning(true); }
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 950 }}>Timer</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted }}>Countdown + HIIT</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["Countdown","Intervals"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); reset(); }}
              style={{
                borderRadius: 999, border: "1px solid " + tokens.colors.border,
                background: mode === m ? tokens.colors.blue : tokens.colors.panel2,
                color: mode === m ? "#001018" : tokens.colors.text,
                padding: "8px 10px", fontWeight: 1000, cursor: "pointer", fontSize: 12
              }}
            >{m === "Countdown" ? "Simples" : "HIIT"}</button>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 12, borderRadius: tokens.radius.xl, border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel2, padding: 14, display: "grid", placeItems: "center"
      }}>
        <svg width={ringSize} height={ringSize}>
          <circle cx={ringSize/2} cy={ringSize/2} r={r} stroke={tokens.colors.border} strokeWidth="14" fill="none" />
          <circle cx={ringSize/2} cy={ringSize/2} r={r} stroke={tokens.colors.blue} strokeWidth="14" fill="none"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - dash}
            transform={`rotate(-90 ${ringSize/2} ${ringSize/2})`}
          />
          <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle"
            style={{ fontSize: 56, fontWeight: 950, fill: tokens.colors.text }}
          >{display}</text>
          <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle"
            style={{ fontSize: 12, fontWeight: 950, fill: tokens.colors.muted }}
          >
            {mode === "Intervals" ? `${phase.toUpperCase()} • Round ${round}/${rounds}` : "Countdown"}
          </text>
        </svg>

        {mode === "Intervals" && (
          <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
            <Config label="Work" value={work} onChange={setWork} />
            <Config label="Rest" value={rest} onChange={setRest} />
            <Config label="Rounds" value={rounds} onChange={setRounds} min={1} max={20} />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 12, width: "100%" }}>
          {!running ? (
            <button onClick={start} style={btnPrimary}>Iniciar</button>
          ) : (
            <button onClick={() => setRunning(false)} style={btnPrimary}>Pausar</button>
          )}
          <button onClick={reset} style={btnGhost}>Parar</button>
        </div>
      </div>
    </div>
  );
}

function Config({ label, value, onChange, min = 5, max = 600 }: {
  label: string; value: number; onChange: (n: number) => void; min?: number; max?: number;
}) {
  return (
    <div style={{ borderRadius: 16, border: "1px solid " + tokens.colors.border, background: tokens.colors.panel, padding: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 950, color: tokens.colors.muted }}>{label}</div>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", marginTop: 6, borderRadius: 12, border: "1px solid " + tokens.colors.border,
          background: tokens.colors.panel2, color: tokens.colors.text, padding: "10px 10px",
          fontWeight: 950, outline: "none"
        }}
      />
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  flex: 1, borderRadius: 16, border: "1px solid " + tokens.colors.border,
  background: tokens.colors.blue, color: "#001018", padding: 12, fontWeight: 1000, cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  borderRadius: 16, border: "1px solid " + tokens.colors.border,
  background: tokens.colors.panel, color: tokens.colors.text, padding: 12, fontWeight: 1000, cursor: "pointer",
};
