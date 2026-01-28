const fs = require("fs");
const path = require("path");

function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p,s,"utf8"); }
function backup(p, tag){
  const ts = new Date().toISOString().replace(/[:.]/g,"-");
  const out = `.backups/${p.replace(/[\/\\]/g,"__")}.before_${tag}.${ts}.bak`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(p, out);
  console.log("🧷 Backup:", out);
}

const ENGINE = "src/engine/nutrition/NutritionEngine.ts";
const PLAN   = "src/pages/NutritionPlan.tsx";

function patchNutritionEngine(){
  let s = read(ENGINE);
  const before = s;

  if (!s.includes("buildDietExportTextPhase3E")) {
    s += `

/** Phase 3E — texto editável premium do plano (para copiar/colar) */
export function buildDietExportTextPhase3E(params: { stateLike: any; nutricao: any; tolerancePct?: number }): string {
  try {
    const anySelf: any = (exports as any);
    if (typeof (anySelf as any).buildDietExportPayload === "function") {
      return (anySelf as any).buildDietExportPayload({
        stateLike: params.stateLike,
        nutricao: params.nutricao,
        tolerancePct: params.tolerancePct ?? 10
      });
    }
  } catch {}

  const nutricao = params?.nutricao ?? {};
  const refeicoes = Array.isArray(nutricao?.refeicoes) ? nutricao.refeicoes : [];
  const lines: string[] = [];

  lines.push("MINDSETFIT — PLANO NUTRICIONAL (EDITÁVEL)");
  lines.push("");
  lines.push(\`Meta (kcal): \${nutricao?.macros?.calorias ?? "—"}\`);
  lines.push(\`P: \${nutricao?.macros?.proteina ?? "—"} g | C: \${nutricao?.macros?.carboidratos ?? "—"} g | G: \${nutricao?.macros?.gorduras ?? "—"} g\`);
  lines.push("");
  lines.push("REFEIÇÕES");
  lines.push("--------");

  refeicoes.forEach((r: any, i: number) => {
    lines.push(\`\${i+1}) \${r?.horario ?? "—"} — \${r?.nome ?? "Refeição"}\`);
    const alimentos = Array.isArray(r?.alimentos) ? r.alimentos : [];
    alimentos.forEach((a: any) => {
      const nome = a?.nome ?? a?.alimento ?? "Alimento";
      const qtd  = a?.quantidade ?? a?.qtd ?? a?.porcao ?? "";
      const uni  = a?.unidade ?? a?.unit ?? "";
      lines.push(\`   - \${nome} \${qtd}\${uni}\`.trim());
    });
    lines.push("");
  });

  return lines.join("\\n");
}

/** Phase 3E — copiar texto com fallback (clipboard/textarea) */
export async function copyTextFallbackPhase3E(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && (navigator as any).clipboard?.writeText) {
      await (navigator as any).clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok === true;
    }
  } catch {}

  return false;
}
`;
    console.log("✅ NutritionEngine.ts: Phase 3E helpers adicionados.");
  } else {
    console.log("ℹ️ NutritionEngine.ts: Phase 3E já existe.");
  }

  if (s !== before) { backup(ENGINE, "phase3E"); write(ENGINE, s); }
}

function patchNutritionPlan(){
  let s = read(PLAN);
  const before = s;

  // garantir imports
  const needA = "buildDietExportTextPhase3E";
  const needB = "copyTextFallbackPhase3E";
  const re = /import\s+\{\s*([^}]+)\s*\}\s+from\s+["']@\/engine\/nutrition\/NutritionEngine["'];?/;

  if (re.test(s)) {
    s = s.replace(re, (m, inner) => {
      const items = inner.split(",").map(x => x.trim()).filter(Boolean);
      if (!items.includes(needA)) items.push(needA);
      if (!items.includes(needB)) items.push(needB);
      return `import { ${items.join(", ")} } from "@/engine/nutrition/NutritionEngine";`;
    });
  } else {
    const idx = s.indexOf("export function NutritionPlan");
    if (idx > 0) {
      s = s.slice(0, idx) + `import { ${needA}, ${needB} } from "@/engine/nutrition/NutritionEngine";\n` + s.slice(idx);
    }
  }

  // inserir botão
  if (!s.includes("Copiar plano (texto)")) {
    const anchor = /Exportar Nutrição\s*\(PDF\)[\s\S]*?<\/Button>/m;
    const m = s.match(anchor);
    if (!m) throw new Error("NutritionPlan.tsx: não achei o botão Exportar Nutrição (PDF) para ancorar o botão de copiar.");

    const insert = `
            <Button
              variant="outline"
              onClick={async () => {
                const text = buildDietExportTextPhase3E({ stateLike: state, nutricao: nutricaoSafe, tolerancePct: 10 });
                const ok = await copyTextFallbackPhase3E(text);
                if (!ok) alert("Não foi possível copiar. Tente novamente.");
              }}
              className="h-10 border-white/15 text-white hover:bg-white/10"
            >
              Copiar plano (texto)
            </Button>`;

    s = s.replace(m[0], m[0] + insert);
    console.log("✅ NutritionPlan.tsx: botão Copiar plano (texto) inserido.");
  } else {
    console.log("ℹ️ NutritionPlan.tsx: botão Copiar plano (texto) já existe.");
  }

  if (s !== before) { backup(PLAN, "phase3E"); s = s.replace(/\n{4,}/g, "\n\n\n"); write(PLAN, s); }
}

patchNutritionEngine();
patchNutritionPlan();
console.log("✅ Phase 3E patch aplicado.");
