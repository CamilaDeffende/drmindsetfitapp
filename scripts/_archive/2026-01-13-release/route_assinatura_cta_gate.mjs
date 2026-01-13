import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ASSINATURA_IMPORT = `import Assinatura from "@/pages/Assinatura";`;
const PREMIUMGATE_IMPORT = `import { PremiumGate } from "@/components/monetization/PremiumGate";`;

function p(rel){ return path.join(ROOT, rel); }
function exists(rel){ return fs.existsSync(p(rel)); }
function read(rel){ return fs.readFileSync(p(rel), "utf8"); }
function write(rel, s){
  fs.mkdirSync(path.dirname(p(rel)), { recursive: true });
  fs.writeFileSync(p(rel), s, "utf8");
}
function patchFile(rel, fn){
  if(!exists(rel)) return { changed:false, reason:"missing" };
  const before = read(rel);
  const after = fn(before);
  if(after !== before){
    write(rel, after);
    return { changed:true };
  }
  return { changed:false };
}

// --------------------
// (A) Detectar router file
// --------------------
const candidates = [
  "src/main.tsx",
  "src/App.tsx",
  "src/routes.tsx",
  "src/router.tsx",
  "src/routes/index.tsx",
];

function findRouterFile(){
  for(const f of candidates){
    if(!exists(f)) continue;
    const s = read(f);
    if (s.includes("react-router-dom") && (s.includes("<Routes") || s.includes("createBrowserRouter") || s.includes("RouterProvider"))) {
      return f;
    }
  }
  // fallback: procurar por <Routes em qualquer TSX
  const walk = (dir) => {
    const out = [];
    for (const ent of fs.readdirSync(p(dir), { withFileTypes: true })) {
      const rel = path.join(dir, ent.name);
      if (ent.isDirectory()) out.push(...walk(rel));
      else if (rel.endsWith(".tsx") || rel.endsWith(".ts")) out.push(rel);
    }
    return out;
  };
  const files = walk("src");
  for (const f of files) {
    const s = read(f);
    if (s.includes("react-router-dom") && s.includes("<Routes")) return f;
    if (s.includes("createBrowserRouter") && s.includes("RouterProvider")) return f;
  }
  return null;
}

const routerFile = findRouterFile();
if (!routerFile) {
  console.error("❌ Não consegui detectar o arquivo de rotas. Procure por <Routes/> ou createBrowserRouter.");
  process.exit(1);
}

// --------------------
// (B) Inserir rota /assinatura
// Suporta 2 padrões:
// 1) <Routes> ... <Route .../> ... </Routes>
// 2) createBrowserRouter([...])
// --------------------
let routerChanged = false;

const rRouter = patchFile(routerFile, (s) => {
  let out = s;

  // garantir import do Assinatura (somente se a rota for inserida)
  const hasAssImport = out.includes('from "@/pages/Assinatura"') || out.includes('from "../pages/Assinatura"') || out.includes('from "./pages/Assinatura"');

  // Padrão 1: JSX Routes
  if (out.includes("<Routes") && out.includes("<Route")) {
    if (!out.includes('path="/assinatura"') && !out.includes("path='/assinatura'")) {
      // injeta import Assinatura perto dos imports (após react-router-dom se existir)
      if (!hasAssImport) {
        if (out.includes('from "react-router-dom"')) {
          out = out.replace(/from\s+["']react-router-dom["'];\s*\n/, (m) => m + ASSINATURA_IMPORT + "\n");
        } else {
          out = ASSINATURA_IMPORT + "\n" + out;
        }
      }
      // injeta rota antes do fechamento </Routes>
      out = out.replace(/<\/Routes>/, `  <Route path="/assinatura" element={<Assinatura />} />\n</Routes>`);
      routerChanged = true;
    }
    return out;
  }

  // Padrão 2: createBrowserRouter array
  if (out.includes("createBrowserRouter") && out.includes("RouterProvider")) {
    if (!out.includes('path: "/assinatura"') && !out.includes("path:'/assinatura'")) {
      if (!hasAssImport) {
        // tenta inserir import após react-router-dom
        if (out.includes('from "react-router-dom"')) {
          out = out.replace(/from\s+["']react-router-dom["'];\s*\n/, (m) => m + ASSINATURA_IMPORT + "\n");
        } else {
          out = ASSINATURA_IMPORT + "\n" + out;
        }
      }
      // injeta no array principal: procura pelo primeiro "[" após createBrowserRouter(
      out = out.replace(/createBrowserRouter\s*\(\s*\[/, (m) => m + `\n  { path: "/assinatura", element: <Assinatura /> },`);
      routerChanged = true;
    }
    return out;
  }

  return out;
});

if (rRouter.changed) {
  console.log("✅ Route patched:", routerFile);
} else {
  console.log("ℹ️ Route no change:", routerFile);
}

// --------------------
// (C) CTA discreto no DashboardPro (link /assinatura)
// --------------------
const dash = "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx";
let dashChanged = false;
if (exists(dash)) {
  const rDash = patchFile(dash, (s) => {
    let out = s;

    // garantir import Link
    const hasLinkImport = out.includes("Link") && out.includes("react-router-dom");
    if (!hasLinkImport && out.includes('from "react-router-dom"')) {
      out = out.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*["']react-router-dom["'];/m, (m, inner) => {
        if (inner.includes("Link")) return m;
        return `import { ${inner.trim()}, Link } from "react-router-dom";`;
      });
    }

    // Inserir CTA em um header/topbar comum (heurística: procurar por "Dashboard" ou primeira toolbar)
    // Se já existir link, não mexe
    if (out.includes('to="/assinatura"')) return out;

    // tentativa 1: inserir perto de um bloco com "Dashboard" / "Premium" (sem quebrar JSX)
    const anchor = out.match(/(<div[^>]+className="[^"]*(top|header|toolbar|flex)[^"]*"[^>]*>)/m);
    if (anchor) {
      out = out.replace(anchor[0], anchor[0] + `\n      <Link to="/assinatura" className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/10 active:scale-[0.99]">Assinatura</Link>`);
      dashChanged = true;
      return out;
    }

    // fallback: não achou âncora, não injeta.
    return out;
  });

  if (rDash.changed) console.log("✅ Dashboard CTA patched:", dash);
  else console.log("ℹ️ Dashboard CTA no change:", dash);
}

// --------------------
// (D) Gate premium no export PDF (mínimo e seguro)
// - Local: módulo de export (chunk exportar-pdf aparece no build, então tentamos achar arquivo)
// - Heurística: procurar por "exportar" / "pdf" e "generateMindsetFitPremiumPdf" em src
// - Ação: envolver botão/ação com PremiumGate + redirect simples para /assinatura se bloqueado
// --------------------
function walkTsx(dir){
  const out = [];
  const base = p(dir);
  for(const ent of fs.readdirSync(base, { withFileTypes: true })) {
    const rel = path.join(dir, ent.name);
    if(ent.isDirectory()) out.push(...walkTsx(rel));
    else if(rel.endsWith(".tsx") || rel.endsWith(".ts")) out.push(rel);
  }
  return out;
}

const files = walkTsx("src");
let gateApplied = false;

for (const f of files) {
  const txt = read(f);
  if (!txt.includes("generateMindsetFitPremiumPdf") && !txt.includes("exportar") && !txt.toLowerCase().includes("pdf")) continue;

  // tentar somente onde há geração premium
  if (!txt.includes("generateMindsetFitPremiumPdf")) continue;

  const r = patchFile(f, (s) => {
    let out = s;

    // garantir import PremiumGate (se a gente for envolver JSX)
    if (!out.includes('from "@/components/monetization/PremiumGate"')) {
      // inserir após react-router-dom ou após últimos imports
      if (out.includes('from "react-router-dom"')) {
        out = out.replace(/from\s+["']react-router-dom["'];\s*\n/, (m) => m + PREMIUMGATE_IMPORT + "\n");
      } else {
        out = out.replace(/(^import[\s\S]*?\n)\n/m, (m) => m + PREMIUMGATE_IMPORT + "\n\n");
      }
    }

    // garantir useNavigate para redirecionar
    if (out.includes("react-router-dom") && out.includes("{") && out.includes("}")) {
      out = out.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*["']react-router-dom["'];/m, (m, inner) => {
        if (inner.includes("useNavigate")) return m;
        return `import { ${inner.trim()}, useNavigate } from "react-router-dom";`;
      });
    }

    // inserir flags check minimalista
    if (!out.includes("loadFlags")) {
      out = out.replace(/(^import[\s\S]*?\n)\n/m, (m) => m + `import { loadFlags } from "@/lib/featureFlags";\n\n`);
    }

    // achar um botão/handler de export PDF e proteger
    // Heurística: procurar por onClick que chama generateMindsetFitPremiumPdf
    if (!out.includes("generateMindsetFitPremiumPdf(")) return out;

    if (!out.includes("const flags = loadFlags()")) {
      // inserir dentro do componente (heurística: após primeira linha com "function" ou "export default function" ou "const X = () =>")
      out = out.replace(/(function\s+\w+\s*\([^)]*\)\s*\{\s*\n)/m, (m) => m + `  const navigate = useNavigate();\n  const flags = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };\n`);
      out = out.replace(/(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{\s*\n)/m, (m) => m + `  const navigate = useNavigate();\n  const flags = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };\n`);
      out = out.replace(/(const\s+\w+\s*=\s*\(\)\s*=>\s*\{\s*\n)/m, (m) => m + `  const navigate = useNavigate();\n  const flags = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };\n`);
    }

    // proteger a chamada: se paywall ligado e não liberado → redirect
    // substitui "await generateMindsetFitPremiumPdf(" por gate de condição
    if (!out.includes("flags.paywallEnabled && !flags.premiumUnlocked")) {
      out = out.replace(/await\s+generateMindsetFitPremiumPdf\s*\(/g, `if (flags.paywallEnabled && !flags.premiumUnlocked) { navigate("/assinatura"); return; }\n    await generateMindsetFitPremiumPdf(`);
    }

    // envolver botão com PremiumGate se existir um <button ...>Export</button> perto
    // (não obrigatório para funcionar, mas deixa UX melhor)
    // Só faz se achar "Export" ou "PDF" no JSX e ainda não tiver PremiumGate
    if (!out.includes("<PremiumGate")) {
      out = out.replace(/(<button[\s\S]{0,220}generateMindsetFitPremiumPdf[\s\S]{0,800}?<\/button>)/m, (m) => {
        return `<PremiumGate fallback={<div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"><div className="text-[14px] font-semibold">PDF Premium</div><div className="mt-1 text-[12px] text-white/70">Ative a assinatura para exportar.</div><div className="mt-3"><a href="/assinatura" className="inline-flex rounded-xl bg-white px-4 py-2 text-[12px] font-semibold text-black">Ir para Assinatura</a></div></div>}>\n${m}\n</PremiumGate>`;
      });
    }

    return out;
  });

  if (r.changed) {
    console.log("✅ Premium gate applied:", f);
    gateApplied = true;
    break; // aplica em 1 lugar só (mínimo e seguro)
  }
}

if (!gateApplied) {
  console.log("ℹ️ Premium gate: não encontrei callsite ideal para aplicar automaticamente (mantido seguro).");
}

console.log("\n==> ROUTE/CTA/GATE PATCH DONE ✅");
console.log("Router file:", routerFile);
