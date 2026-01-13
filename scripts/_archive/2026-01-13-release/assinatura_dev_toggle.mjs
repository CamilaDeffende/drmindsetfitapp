import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const flagsFile = "src/lib/featureFlags.ts";
const assinaturaFile = "src/pages/Assinatura.tsx";

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

let changes = 0;

/* =========================
   (A) featureFlags: garantir API completa (load/save/setters)
   ========================= */
if (!exists(flagsFile)) {
  // cria do zero (caso raro)
  const s = `export type FeatureFlags = {
  paywallEnabled: boolean;
  premiumUnlocked: boolean;
};

const KEY = "drmindsetfit:flags";

export function loadFlags(): FeatureFlags {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { paywallEnabled: false, premiumUnlocked: false };
    const parsed = JSON.parse(raw);
    return {
      paywallEnabled: !!parsed?.paywallEnabled,
      premiumUnlocked: !!parsed?.premiumUnlocked,
    };
  } catch {
    return { paywallEnabled: false, premiumUnlocked: false };
  }
}

export function saveFlags(next: FeatureFlags): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function setPaywallEnabled(v: boolean): FeatureFlags {
  const cur = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };
  const next = { ...cur, paywallEnabled: !!v };
  if (typeof window !== "undefined") saveFlags(next);
  return next;
}

export function setPremiumUnlocked(v: boolean): FeatureFlags {
  const cur = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };
  const next = { ...cur, premiumUnlocked: !!v };
  if (typeof window !== "undefined") saveFlags(next);
  return next;
}
`;
  write(flagsFile, s);
  console.log("✅ Created:", flagsFile);
  changes++;
} else {
  const r = patchFile(flagsFile, (s) => {
    let out = s;

    // garantir type FeatureFlags
    if (!out.includes("export type FeatureFlags")) {
      out = `export type FeatureFlags = {\n  paywallEnabled: boolean;\n  premiumUnlocked: boolean;\n};\n\n` + out;
    }

    // garantir KEY
    if (!out.includes('const KEY = "drmindsetfit:flags"')) {
      out = out.replace(/(^export\s+type\s+FeatureFlags[\s\S]*?\};\s*\n)/m, (m) => m + `\nconst KEY = "drmindsetfit:flags";\n\n`);
      if (!out.includes('const KEY = "drmindsetfit:flags"')) {
        out = `const KEY = "drmindsetfit:flags";\n` + out;
      }
    }

    // garantir loadFlags retorna defaults completos
    if (!out.includes("export function loadFlags")) {
      out += `\nexport function loadFlags(): FeatureFlags {\n  try {\n    const raw = localStorage.getItem(KEY);\n    if (!raw) return { paywallEnabled: false, premiumUnlocked: false };\n    const parsed = JSON.parse(raw);\n    return {\n      paywallEnabled: !!parsed?.paywallEnabled,\n      premiumUnlocked: !!parsed?.premiumUnlocked,\n    };\n  } catch {\n    return { paywallEnabled: false, premiumUnlocked: false };\n  }\n}\n`;
    } else {
      // se loadFlags existe mas não tipa ou não usa KEY, não mexe (evita quebrar)
    }

    // garantir saveFlags
    if (!out.includes("export function saveFlags")) {
      out += `\nexport function saveFlags(next: FeatureFlags): void {\n  try {\n    localStorage.setItem(KEY, JSON.stringify(next));\n  } catch {}\n}\n`;
    }

    // garantir setters
    if (!out.includes("export function setPaywallEnabled")) {
      out += `\nexport function setPaywallEnabled(v: boolean): FeatureFlags {\n  const cur = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };\n  const next = { ...cur, paywallEnabled: !!v };\n  if (typeof window !== "undefined") saveFlags(next);\n  return next;\n}\n`;
    }
    if (!out.includes("export function setPremiumUnlocked")) {
      out += `\nexport function setPremiumUnlocked(v: boolean): FeatureFlags {\n  const cur = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };\n  const next = { ...cur, premiumUnlocked: !!v };\n  if (typeof window !== "undefined") saveFlags(next);\n  return next;\n}\n`;
    }

    return out;
  });

  if (r.changed) { console.log("✅ Patched:", flagsFile); changes++; }
  else console.log("ℹ️ No change:", flagsFile);
}

/* =========================
   (B) /assinatura: toggle DEV premium + paywall
   ========================= */
if (!exists(assinaturaFile)) {
  console.error("❌ Não achei:", assinaturaFile);
  process.exit(1);
}

const rAss = patchFile(assinaturaFile, (s) => {
  let out = s;

  // garantir imports
  if (!out.includes('from "@/lib/featureFlags"')) {
    // inserir após imports existentes
    out = out.replace(/(^import[\s\S]*?\n)\n/m, (m) => m + `import { loadFlags, setPaywallEnabled, setPremiumUnlocked } from "@/lib/featureFlags";\n\n`);
  } else {
    // se já importa, garantir os nomes
    out = out.replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+["']@\/lib\/featureFlags["'];/m, (m, inner) => {
      const parts = inner.split(",").map(x => x.trim()).filter(Boolean);
      const need = ["loadFlags","setPaywallEnabled","setPremiumUnlocked"];
      for (const n of need) if (!parts.includes(n)) parts.push(n);
      return `import { ${parts.join(", ")} } from "@/lib/featureFlags";`;
    });
  }

  // garantir useEffect no import react (se existir import { useMemo, useState } from "react";)
  out = out.replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+["']react["'];/m, (m, inner) => {
    const parts = inner.split(",").map(x => x.trim()).filter(Boolean);
    if (!parts.includes("useEffect")) parts.push("useEffect");
    return `import { ${parts.join(", ")} } from "react";`;
  });

  // inserir estado e handlers dentro do componente (heurística)
  // acha o primeiro "export default function" ou "function Assinatura"
  const reFn = /(export\s+default\s+function\s+Assinatura\s*\([^)]*\)\s*\{\s*\n)/m;
  if (reFn.test(out) && !out.includes("const [devFlags")) {
    out = out.replace(reFn, (m) => m + `  const [devFlags, setDevFlags] = useState(() => (typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false }));\n\n  useEffect(() => {\n    try { setDevFlags(loadFlags()); } catch {}\n  }, []);\n\n  const togglePaywall = () => {\n    const next = setPaywallEnabled(!devFlags.paywallEnabled);\n    setDevFlags(next);\n  };\n\n  const togglePremium = () => {\n    const next = setPremiumUnlocked(!devFlags.premiumUnlocked);\n    setDevFlags(next);\n  };\n\n`);
  }

  // inserir bloco UI DEV (Apple-like) antes do fechamento do return principal
  // vamos procurar um container principal e adicionar no fim
  if (!out.includes("Liberar Premium (DEV)")) {
    // tenta inserir antes do último </div> do return (fallback simples)
    out = out.replace(/(\n\s*return\s*\(\s*\n[\s\S]*?\n)(\s*\)\s*;\s*\n\}\s*$)/m, (m, before, after) => {
      // se falhar, retorna original
      if (!before.includes("<")) return m;

      const devCard = `\n      {/* DEV controls (sem login) */}\n      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-white">\n        <div className="flex items-center justify-between gap-4">\n          <div>\n            <div className="text-[14px] font-semibold">Liberar Premium (DEV)</div>\n            <div className="mt-1 text-[12px] text-white/70">Apenas para testes internos. Salvo no dispositivo.</div>\n          </div>\n          <button\n            type="button"\n            onClick={togglePremium}\n            className="inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] font-semibold text-white/90 hover:bg-white/15 active:scale-[0.99]"\n          >\n            {devFlags.premiumUnlocked ? "Ativo" : "Inativo"}\n          </button>\n        </div>\n\n        <div className="mt-4 flex items-center justify-between gap-4">\n          <div>\n            <div className="text-[14px] font-semibold">Paywall</div>\n            <div className="mt-1 text-[12px] text-white/70">Quando ativo, recursos premium redirecionam para /assinatura.</div>\n          </div>\n          <button\n            type="button"\n            onClick={togglePaywall}\n            className="inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] font-semibold text-white/90 hover:bg-white/15 active:scale-[0.99]"\n          >\n            {devFlags.paywallEnabled ? "Ativo" : "Inativo"}\n          </button>\n        </div>\n\n        <div className="mt-4 text-[12px] text-white/60">\n          Estado: <span className="font-semibold text-white/80">{devFlags.paywallEnabled ? "paywall ON" : "paywall OFF"}</span> • <span className="font-semibold text-white/80">{devFlags.premiumUnlocked ? "premium ON" : "premium OFF"}</span>\n        </div>\n      </div>\n`;

      // injeta antes do fim do JSX (antes do fechamento final de container mais externo)
      // simples: coloca antes do final do return (antes do after)
      return before + devCard + after;
    });
  }

  return out;
});

if (rAss.changed) { console.log("✅ Patched:", assinaturaFile); changes++; }
else console.log("ℹ️ No change:", assinaturaFile);

console.log(`\n==> DEV TOGGLE PATCH DONE ✅ | alterações: ${changes}\n`);
