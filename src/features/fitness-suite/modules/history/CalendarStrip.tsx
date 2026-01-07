import { useMemo } from "react";
import { useHistoryStore } from "../../store/useHistoryStore";
import { tokens } from "../../ui/tokens";

function daysBack(n: number) {
  const out: string[] = [];
  for (let i = n; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function CalendarStrip() {
  const history = useHistoryStore(s => s.history);
  const selectedDate = useHistoryStore(s => s.selectedDate);
  const selectDate = useHistoryStore(s => s.selectDate);

  const days = useMemo(() => daysBack(13), []);

  return (
    <div style={{
      display: "flex",
      gap: 10,
      overflowX: "auto",
      paddingBottom: 6
    }}>
      {days.map(d => {
        const active = d === selectedDate;
        const hasWorkout = !!history[d];

        return (
          <button
            key={d}
            onClick={() => selectDate(d)}
            style={{
              minWidth: 54,
              borderRadius: 16,
              border: "1px solid " + (active ? tokens.colors.blue : tokens.colors.border),
              background: active ? tokens.colors.blue : tokens.colors.panel,
              color: active ? "#001018" : tokens.colors.text,
              padding: "10px 6px",
              cursor: "pointer",
              display: "grid",
              gap: 4,
              fontWeight: 900
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {new Date(d).toLocaleDateString("pt-BR", { weekday: "short" })}
            </div>
            <div style={{ fontSize: 13 }}>
              {d.slice(8, 10)}
            </div>
            {hasWorkout && (
              <div style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: active ? "#001018" : tokens.colors.blue,
                margin: "0 auto"
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
