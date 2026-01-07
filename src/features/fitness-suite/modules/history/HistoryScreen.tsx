import { CalendarStrip } from "./CalendarStrip";
import { HistoryPanel } from "./HistoryPanel";
import { tokens } from "../../ui/tokens";

export function HistoryScreen() {
  return (
    <div style={{ padding: 14 }}>
      <div style={{
        borderRadius: tokens.radius.xl,
        border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel,
        padding: 14
      }}>
        <div style={{ fontSize: 16, fontWeight: 950 }}>Calendário</div>
        <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 2 }}>
          Selecione um dia para ver o treino salvo.
        </div>
        <div style={{ marginTop: 10 }}>
          <CalendarStrip />
        </div>
      </div>

      <HistoryPanel />
    </div>
  );
}
