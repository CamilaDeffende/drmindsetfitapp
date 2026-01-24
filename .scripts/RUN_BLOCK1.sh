#!/usr/bin/env bash
set -euo pipefail

PATCH=".scripts/patches/block-1.patch"
mkdir -p .scripts/patches

cat > "$PATCH" <<'PATCH'
diff --git a/src/features/fitness-suite/engine/weeklyProtocol.ts b/src/features/fitness-suite/engine/weeklyProtocol.ts
--- a/src/features/fitness-suite/engine/weeklyProtocol.ts
+++ b/src/features/fitness-suite/engine/weeklyProtocol.ts
@@ -1,38 +1,18 @@
-export type WorkoutModality =
-  | "musculacao"
-  | "funcional"
-  | "hiit"
-  | "corrida"
-  | "crossfit"
-  | "spinning";
-
-export type ActivityLevel = "iniciante" | "intermediario" | "avancado";
-
-export type WorkoutStructure = {
-  type: "força" | "hipertrofia" | "técnico" | "metabólico" | "resistência";
-  volume: number;
-  intensidade: "baixa" | "moderada" | "alta";
-  descanso: string;
-  duracaoEstimada: string;
-};
+// ✅ CONTRATO ÚNICO (fonte da verdade)
+import type {
+  WeeklyWorkoutProtocol,
+  WorkoutModality,
+  ActivityLevel,
+  WorkoutStructure,
+} from "@/features/fitness-suite/contracts/weeklyWorkoutProtocol";
 
 import { buildSessionPlan } from "./sessionPlanner";
 import type { SessionWorkoutPlan } from "./sessionPlanner";
@@
-const goalByModality: Record<WorkoutModality, string> = {
+const goalByModality: Record<WorkoutModality, string> = {
   musculacao: "Hipertrofia e força com execução técnica",
   funcional: "Capacidade geral e coordenação",
   hiit: "Condicionamento metabólico",
   corrida: "Base aeróbia e eficiência",
   crossfit: "Técnica + capacidade metabólica",
-  spinning: "Resistência e potência em bike",
+  bike_indoor: "Resistência e potência em bike",
 };
@@
-export const buildWeeklyProtocol = (rawState: any): WeeklyWorkoutProtocol => {
+type WeeklyWorkoutProtocolEngine = WeeklyWorkoutProtocol & {
+  sessions: (WeeklyWorkoutProtocol["sessions"][number] & { plan?: SessionWorkoutPlan })[];
+  strategiesByModality?: Record<string, { strategy: string; rationale: string }>;
+};
+
+export const buildWeeklyProtocol = (rawState: any): WeeklyWorkoutProtocolEngine => {
@@
-  const __allowed: WorkoutModality[] = ["musculacao","funcional","corrida","spinning","crossfit"];
+  const __allowed: WorkoutModality[] = ["musculacao","funcional","corrida","bike_indoor","crossfit"];
PATCH

echo "==> (1) Patch criado em: $PATCH"
echo "==> (2) git apply --check"
git apply --check "$PATCH"

echo "==> (3) git apply"
git apply "$PATCH"

echo "==> (4) verify"
npm run verify

echo "==> (5) commit + push"
git add -A
git commit -m "fix(weekly-protocol): unify contract + bike_indoor modality (build green)" || echo "ℹ️ Nada para commitar."
git push origin main

echo "✅ BLOCO 1 OK | BUILD VERDE"
