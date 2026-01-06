import { Suspense, lazy, useMemo, useState } from "react";
import { tokens } from "../ui/tokens";
import { ProgressProPanel } from "../modules/progress/ProgressProPanel";

type Tab = "Library" | "BodyMap" | "Builder" | "Timer" | "Progress" | "Programs";

const ExerciseLibrary = lazy(() => import("../modules/exercises/ExerciseLibrary").then(m => ({ default: m.ExerciseLibrary })));
const BodyMap = lazy(() => import("../modules/bodymap/BodyMap").then(m => ({ default: m.BodyMap })));
const WorkoutBuilder = lazy(() => import("../modules/workout/WorkoutBuilder").then(m => ({ default: m.WorkoutBuilder })));
const WorkoutTimer = lazy(() => import("../modules/timer/WorkoutTimer").then(m => ({ default: m.WorkoutTimer })));
const Programs = lazy(() => import("../modules/programs/Programs").then(m => ({ default: m.Programs })));

function PremiumFallback({ label }: { label?: string }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: tokens.radius.xl,
      border: "1px solid " + tokens.colors.border,
      background: tokens.colors.panel2,
      margin: 14
    }}>
      <div style={{ fontWeight: 1000, fontSize: 14 }}>Carregando…</div>
      <div style={{ marginTop: 6, fontSize: 12, color: tokens.colors.muted }}>
        {label ?? "Otimizando performance (code split)"} 
      </div>
      <div style={{
        marginTop: 12,
        height: 120,
        borderRadius: 16,
        border: "1px dashed " + tokens.colors.border,
        display: "grid",
        placeItems: "center",
        color: tokens.colors.muted,
        fontWeight: 950
      }}>Loading</div>
    </div>
  );
}

export function FitnessSuiteDemo() {
  const tabs: Tab[] = useMemo(() => ["Library","BodyMap","Builder","Timer","Progress","Programs"], []);
  const [tab, setTab] = useState<Tab>("Library");
  return (
    <div style={{ minHeight: "100vh", background: tokens.colors.bg, color: tokens.colors.text, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: .2 }}>DrMindSetFit — Premium Fitness Suite</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 2 }}>
            Demo interna (suite=1) • Jovial • Clean • Premium
          </div>
        </div>
        <div style={{
          background: tokens.colors.panel, border: "1px solid " + tokens.colors.border,
          borderRadius: tokens.radius.xl, padding: "8px 10px", boxShadow: tokens.shadow
        }}>
          <span style={{ fontSize: 12, color: tokens.colors.muted }}>v1.0</span>
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        gap: 8, marginBottom: 12
      }}>
        {tabs.map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            style={{
              borderRadius: tokens.radius.lg,
              border: "1px solid " + tokens.colors.border,
              background: tab === t ? tokens.colors.panel2 : tokens.colors.panel,
              color: tokens.colors.text,
              padding: "10px 8px",
              fontWeight: 950,
              boxShadow: tab === t ? tokens.shadow : "none",
              cursor: "pointer",
              fontSize: 12
            }}
          >{t}</button>
        ))}
      </div>

      <Suspense fallback={<PremiumFallback /> }>
      <div style={{
        borderRadius: tokens.radius.xl,
        border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel,
        boxShadow: tokens.shadow,
        overflow: "hidden"
      }}>
        {tab === "Library" && <ExerciseLibrary />}
        {tab === "BodyMap" && <BodyMap />}
        {tab === "Builder" && <WorkoutBuilder />}
        {tab === "Timer" && <WorkoutTimer />}
        {tab === "Progress" && <ProgressProPanel />}
        {tab === "Programs" && <Programs />}
      </div>
      </Suspense>
    </div>
  );
}
