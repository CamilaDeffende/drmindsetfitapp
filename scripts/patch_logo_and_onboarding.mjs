import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function read(p) {
  return fs.readFileSync(path.join(ROOT, p), "utf8");
}
function write(p, s) {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p), s, "utf8");
}
function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

function patchFile(p, fn) {
  if (!exists(p)) return { changed: false, reason: "missing" };
  const before = read(p);
  const after = fn(before);
  if (after !== before) {
    write(p, after);
    return { changed: true };
  }
  return { changed: false };
}

function walk(dir) {
  const out = [];
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    if (ent.name.startsWith(".") || ent.name === "node_modules" || ent.name === "dist") continue;
    const rel = path.join(dir, ent.name);
    const full = path.join(ROOT, rel);
    if (ent.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

let changedCount = 0;

// (A) Criar SVG transparente (Apple-like, clean, menor)
// Observação: isso resolve definitivamente “fundo quadrado” pq SVG já nasce com alpha.
const svgPath = "public/brand/mindsetfit-logo.svg";
if (!exists(svgPath)) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MindsetFit">
  <defs>
    <linearGradient id="mf" x1="40" y1="40" x2="216" y2="216" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#00A3FF"/>
      <stop offset="1" stop-color="#0077FF"/>
    </linearGradient>
  </defs>

  <!-- Marca minimalista (monograma MF) com fundo 100% transparente -->
  <path d="M64 192V64h28l20 44 20-44h28v128h-24V108l-18 40h-12l-18-40v84H64z" fill="url(#mf)"/>
  <path d="M176 192V64h72v22h-48v30h42v22h-42v54h-24z" fill="url(#mf)" opacity="0.92"/>
</svg>
`;
  write(svgPath, svg);
  console.log("✅ Criado:", svgPath);
  changedCount++;
} else {
  console.log("ℹ️ Já existe:", svgPath);
}

// (B) Patch BrandIcon para usar SVG (sem fundo), menor, clean
const brandIconPath = "src/components/branding/BrandIcon.tsx";
const brandIconRes = patchFile(brandIconPath, (s) => {
  // tenta detectar se já está em SVG
  if (s.includes("mindsetfit-logo.svg")) {
    // apenas garantir size default menor
    s = s.replace(/default\s*=\s*\d+/g, "default = 28");
    return s;
  }

  // Substitui implementações comuns por uma versão segura e simples
  // (não depende de import de png; usa /public)
  const next = `
import React from "react";

type Props = {
  size?: number;        // tamanho em px (menor, Apple-like)
  className?: string;   // permite ajustar no layout sem quebrar nada
  alt?: string;
};

export default function BrandIcon({ size = 28, className = "", alt = "MindsetFit" }: Props) {
  return (
    <img
      src="/brand/mindsetfit-logo.svg"
      width={size}
      height={size}
      alt={alt}
      className={className}
      style={{ display: "block" }}
      loading="eager"
      decoding="async"
    />
  );
}
`.trimStart();

  // se o arquivo atual for muito diferente, trocamos tudo (patch cirúrgico num único arquivo)
  return next + "\n";
});

if (brandIconRes.changed) {
  console.log("✅ Patched:", brandIconPath);
  changedCount++;
} else {
  console.log("ℹ️ Sem mudança:", brandIconPath, brandIconRes.reason ? `(${brandIconRes.reason})` : "");
}

// (C) Trocar referências .png -> .svg em TS/TSX/CSS (somente onde aparecer explicitamente)
const files = walk("src").filter((p) => /\.(ts|tsx|css)$/.test(p));

for (const f of files) {
  const r = patchFile(f, (s) => {
    // troca caminhos comuns
    s = s.replace(/mindsetfit-logo\.png/g, "mindsetfit-logo.svg");
    // se houver import direto do png, tenta remover e trocar por string pública
    // Ex: import logo from ".../mindsetfit-logo.png"
    s = s.replace(
      /import\s+(\w+)\s+from\s+["'][^"']*mindsetfit-logo\.svg["'];?\s*/g,
      ""
    );
    s = s.replace(
      /import\s+(\w+)\s+from\s+["'][^"']*mindsetfit-logo\.png["'];?\s*/g,
      ""
    );
    // Se alguém usa a variável importada, não dá pra inferir com segurança aqui.
    // A troca principal do app deve ocorrer via BrandIcon.
    return s;
  });

  if (r.changed) {
    console.log("✅ refs patched:", f);
    changedCount++;
  }
}

// (D) Onboarding: garantir finalização + redirect /dashboard (sem loop)
// Estratégia: procurar pontos comuns e reforçar onFinish/complete.
const onboardingPath = "src/pages/OnboardingFlow.tsx";
const onboardingRes = patchFile(onboardingPath, (s) => {
  let changed = false;

  // 1) garantir que exista navigate
  if (!s.includes("useNavigate")) {
    // tenta inserir import (assumindo react-router-dom)
    s = s.replace(
      /from\s+["']react["'];\s*\n/,
      (m) => m + `import { useNavigate } from "react-router-dom";\n`
    );
    changed = true;
  }

  // 2) garantir que dentro do componente exista const navigate = useNavigate();
  if (!s.match(/const\s+navigate\s*=\s*useNavigate\(\)\s*;?/)) {
    s = s.replace(
      /(function\s+OnboardingFlow\s*\([^)]*\)\s*{)|(const\s+OnboardingFlow\s*=\s*\([^)]*\)\s*=>\s*{)/,
      (m) => m + `\n  const navigate = useNavigate();\n`
    );
    changed = true;
  }

  // 3) reforçar handler de conclusão (tenta padrões: handleFinish / onFinish / finishOnboarding)
  const finishSnip = `
  // ✅ Finalização travada (sem loop): marca concluído e redireciona pro dashboard
  const finalizeOnboarding = () => {
    try {
      // tenta usar contexto/store existente, sem quebrar
      // (se já existir uma função no contexto, isso é redundante e não atrapalha)
      localStorage.setItem("drmindsetfit:onboarding:completed", "true");
      localStorage.setItem("drmindsetfit:onboarding:concluido", "true");
    } catch {}
    navigate("/dashboard", { replace: true });
  };
`.trimEnd();

  if (!s.includes("finalizeOnboarding")) {
    // injeta após navigate
    s = s.replace(
      /(const\s+navigate\s*=\s*useNavigate\(\)\s*;?\s*\n)/,
      (m) => m + "\n" + finishSnip + "\n\n"
    );
    changed = true;
  }

  // 4) plugar finalizeOnboarding em algum onFinish já existente
  // tenta substituir onFinish={() => ...} por finalizeOnboarding
  if (s.match(/onFinish=\{\(\)\s*=>/)) {
    s = s.replace(/onFinish=\{\(\)\s*=>\s*[^}]*\}/g, "onFinish={finalizeOnboarding}");
    changed = true;
  } else if (s.match(/onComplete=\{\(\)\s*=>/)) {
    s = s.replace(/onComplete=\{\(\)\s*=>\s*[^}]*\}/g, "onComplete={finalizeOnboarding}");
    changed = true;
  } else {
    // fallback: se existir "handleFinish" ou "finishOnboarding", faz apontar para finalize
    if (s.match(/const\s+handleFinish\s*=\s*\(\)\s*=>\s*\{/)) {
      s = s.replace(
        /const\s+handleFinish\s*=\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/,
        "const handleFinish = () => finalizeOnboarding();"
      );
      changed = true;
    }
    if (s.match(/function\s+finishOnboarding\s*\(\)\s*\{/)) {
      s = s.replace(
        /function\s+finishOnboarding\s*\(\)\s*\{[\s\S]*?\n\s*\}/,
        "function finishOnboarding() { finalizeOnboarding(); }"
      );
      changed = true;
    }
  }

  // 5) Guard: se já estiver concluído, não reabrir onboarding
  // tenta inserir um check simples perto do início do componente
  if (!s.includes("drmindsetfit:onboarding:completed")) {
    s = s.replace(
      /(const\s+navigate\s*=\s*useNavigate\(\)\s*;?\s*\n)/,
      (m) =>
        m +
        `
  // ✅ Guard anti-loop: se já concluiu, pula direto pro dashboard
  try {
    const done =
      localStorage.getItem("drmindsetfit:onboarding:completed") === "true" ||
      localStorage.getItem("drmindsetfit:onboarding:concluido") === "true";
    if (done) navigate("/dashboard", { replace: true });
  } catch {}
`.trimEnd() +
        "\n\n"
    );
    changed = true;
  }

  return changed ? s : s;
});

if (onboardingRes.changed) {
  console.log("✅ Patched:", onboardingPath);
  changedCount++;
} else {
  console.log("ℹ️ Sem mudança:", onboardingPath, onboardingRes.reason ? `(${onboardingRes.reason})` : "");
}

console.log(`\n==> PATCH DONE ✅ | alterações: ${changedCount}\n`);
