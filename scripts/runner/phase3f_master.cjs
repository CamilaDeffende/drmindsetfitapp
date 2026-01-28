#!/usr/bin/env node
"use strict";

const fs = require("fs");

const TARGET = "src/pages/NutritionPlan.tsx";

function die(msg) { console.error("❌ " + msg); process.exit(1); }
function ok(msg) { console.log("✅ " + msg); }
function info(msg) { console.log("==> " + msg); }

if (!fs.existsSync(TARGET)) die("Alvo não encontrado: " + TARGET);

const s = fs.readFileSync(TARGET, "utf8");

// NO-OP seguro: se Phase 3F já está aplicada, não tocar no arquivo
const hasUI = s.includes("PHASE_3F_PLAN_TEXT_DIALOG_UI");
const hasHooks = s.includes("const [planTextOpen, setPlanTextOpen]") && s.includes("const getPlanText");

if (hasUI && hasHooks) {
  ok("Phase3F já aplicada em NutritionPlan.tsx. Patcher NO-OP (seguro).");
  process.exit(0);
}

die(
  "Phase3F não detectada no arquivo alvo. " +
  "Este patcher está em modo seguro (NO-OP) e não aplica mudanças automaticamente. " +
  "Restaure/garanta o estado correto do arquivo e aplique Phase3F manualmente com patch controlado."
);
