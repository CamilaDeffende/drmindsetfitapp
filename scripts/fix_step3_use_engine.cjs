/* ESM project: use .cjs */
const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "src/components/steps/Step3Metabolismo.tsx");
let s = fs.readFileSync(file, "utf8");

// We patch inside the useEffect branch:
// if (state.perfil && state.avaliacao && !state.metabolismo) { ... }
const re = /if\s*\(\s*state\.perfil\s*&&\s*state\.avaliacao\s*&&\s*!\s*state\.metabolismo\s*\)\s*\{\s*([\s\S]*?)\s*\}\s*else\s*if\s*\(\s*state\.metabolismo\s*\)\s*\{/m;
const m = s.match(re);
if (!m) {
  console.error("PATCH_FAIL: could not locate useEffect branch in Step3Metabolismo.tsx");
  process.exit(1);
}

const block = m[1];

// If already patched, avoid duplicating.
if (block.includes("inferNivelTreinoFromState") && block.includes("getActivityFactor") && block.includes("computeGET")) {
  console.log("PATCH_SKIP: Step3 already uses activity engine.");
  process.exit(0);
}

// Replace the old calc/updateState sequence with a version that computes GET by activity level.
const replaced = block.replace(
  /const\s+calc\s*=\s*calcularMetabolismo\(\s*state\.perfil\s*,\s*state\.avaliacao\s*\)\s*[\r\n]+(\s*)setResultado\(\s*calc\s*\)\s*[\r\n]+\s*updateState\(\s*\{\s*metabolismo:\s*calc\s*\}\s*\)\s*/m,
  [
    "const calc = calcularMetabolismo(state.perfil, state.avaliacao)\n",
    "\n",
    "      // GET by activity level (iniciante/intermediario/avancado)\n",
    "      const nivel = inferNivelTreinoFromState(state as any)\n",
    "      const fator = getActivityFactor(nivel)\n",
    "      const get = computeGET((calc as any).tmb, fator)\n",
    "\n",
    "      ;(calc as any).nivelAtividade = nivel\n",
    "      ;(calc as any).fatorAtividade = fator\n",
    "      ;(calc as any).get = get\n",
    "\n",
    "      setResultado(calc)\n",
    "      updateState({ metabolismo: calc } as any)\n"
  ].join("")
);

if (replaced === block) {
  console.error("PATCH_FAIL: expected calc/setResultado/updateState pattern not found.");
  process.exit(1);
}

s = s.replace(block, replaced);
fs.writeFileSync(file, s, "utf8");
console.log("PATCH_OK: Step3 now computes GET via activity engine (imports used).");
