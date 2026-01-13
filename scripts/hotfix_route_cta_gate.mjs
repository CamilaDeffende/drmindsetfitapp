import fs from "fs";
import path from "path";

const ROOT = process.cwd();

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
function walk(dir){
  const out = [];
  const base = p(dir);
  for(const ent of fs.readdirSync(base, { withFileTypes: true })) {
    const rel = path.join(dir, ent.name);
    if(ent.isDirectory()) out.push(...walk(rel));
    else if(rel.endsWith(".tsx") || rel.endsWith(".ts")) out.push(rel);
  }
  return out;
}

let changes = 0;

/* =========================
   (A) LIMPAR DashboardPro: remover imports/injeções ruins
   ========================= */
const dash = "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx";
if (exists(dash)) {
  const r = patchFile(dash, (s) => {
    let out = s;

    // remover import PremiumGate
    out = out.replace(/\n?import\s+\{\s*PremiumGate\s*\}\s+from\s+["']@\/components\/monetization\/PremiumGate["'];\s*\n?/g, "\n");

    // remover import loadFlags (se tiver sido injetado)
    out = out.replace(/\n?import\s+\{\s*loadFlags\s*\}\s+from\s+["']@\/lib\/featureFlags["'];\s*\n?/g, "\n");

    // remover "useNavigate" adicionado em import react-router-dom (se existir)
    out = out.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*["']react-router-dom["'];/m, (m, inner) => {
      const parts = inner.split(",").map(x => x.trim()).filter(Boolean);
      const cleaned = parts.filter(x => x !== "useNavigate" && x !== "Link");
      return `import { ${cleaned.join(", ")} } from "react-router-dom";`;
    });

    // remover const navigate/flags injetados
    out = out.replace(/\n[ \t]*const\s+navigate\s*=\s*useNavigate\(\)\s*;\s*/g, "\n");
    out = out.replace(/\n[ \t]*const\s+flags\s*=\s*typeof\s+window[\s\S]*?\s*;\s*/g, "\n");

    // remover linhas de gate dentro do export (if flags... navigate("/assinatura")...)
    out = out.replace(/\n[ \t]*if\s*\(\s*flags\.paywallEnabled\s*&&\s*!flags\.premiumUnlocked\s*\)\s*\{\s*navigate\(["']\/assinatura["']\);\s*return;\s*\}\s*/g, "\n");

    // CTA: trocar Link por <a href> (zero dependências)
    out = out.replace(/<Link\s+to="\/assinatura"([^>]*)>(.*?)<\/Link>/g, `<a href="/assinatura"$1>$2</a>`);

    // remover qualquer resíduo "Link" não declarado
    // (se ainda aparecer "Link" literal, troca por "a")
    out = out.replace(/<\/?Link\b/g, (m) => m.replace("Link", "a"));

    return out;
  });

  if (r.changed) { console.log("✅ Cleaned:", dash); changes++; }
  else console.log("ℹ️ No change:", dash);
}

/* =========================
   (B) Aplicar Gate Premium no callsite certo (onde gera PDF)
   - adiciona loadFlags
   - protege antes de chamar generateMindsetFitPremiumPdf
   - redireciona por window.location (sem react-router)
   ========================= */
const files = walk("src");
let applied = false;

for (const f of files) {
  const txt = read(f);
  if (!txt.includes("generateMindsetFitPremiumPdf")) continue;

  const r = patchFile(f, (s) => {
    let out = s;

    // garantir import loadFlags
    if (!out.includes('from "@/lib/featureFlags"') && !out.includes("loadFlags")) {
      out = out.replace(/(^import[\s\S]*?\n)\n/m, (m) => m + `import { loadFlags } from "@/lib/featureFlags";\n\n`);
    }

    // inserir flags dentro do escopo do handler: antes do primeiro "await generateMindsetFitPremiumPdf("
    // estratégia: substituir a primeira ocorrência por bloco com flags
    const target = /await\s+generateMindsetFitPremiumPdf\s*\(/m;
    if (!target.test(out)) return out;

    // evitar duplicar
    if (out.includes("drmindsetfit:flags") || out.includes("loadFlags()") && out.includes("premiumUnlocked")) {
      return out;
    }

    out = out.replace(target, () => {
      return `const flags = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };
    if (flags.paywallEnabled && !flags.premiumUnlocked) {
      window.location.href = "/assinatura";
      return;
    }
    await generateMindsetFitPremiumPdf(`;
    });

    return out;
  });

  if (r.changed) {
    console.log("✅ Gate applied in:", f);
    changes++;
    applied = true;
    break; // mínimo e seguro
  }
}

if (!applied) {
  console.log("ℹ️ Gate: nenhum callsite encontrado para aplicar automaticamente (mantido seguro).");
}

console.log(`\n==> HOTFIX DONE ✅ | alterações: ${changes}\n`);
