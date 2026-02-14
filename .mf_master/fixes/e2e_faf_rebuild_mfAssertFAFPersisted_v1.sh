#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
FILE="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-rebuild-assert-persist-$TS"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$FILE")"
cp -a "$FILE" "$BKP/$FILE"
echo "✅ backup em: $BKP"

echo "==> [2] patch: rebuild mfAssertFAFPersisted (fix return outside function / broken braces)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

pat = r'(?s)^\s*async function mfAssertFAFPersisted\([^\)]*\)\s*\{.*?(?=^\s*async function\s|\Z)'
m = re.search(pat, s, flags=re.M)
if not m:
    raise SystemExit("❌ Não encontrei 'async function mfAssertFAFPersisted(...) { ... }' para reconstruir.")

new_fn = r'''
async function mfAssertFAFPersisted(page: any, expected = "moderadamente_ativo") {
  // SSOT: valida persistência em localStorage (sem depender de Report/rotas)
  const keysToCheck = [
    "mf:onboarding:draft:v1",
    "mf:onboarding:v1",
    "drmindsetfit_state",
    "mindsetfit:onboardingProgress:v1",
    "drmindsetfit.globalProfile.v1",
  ];

  const maxMs = 12000;
  const stepMs = 300;
  const deadline = Date.now() + maxMs;

  const readStorage = async () => {
    return await page.evaluate((keys: string[]) => {
      const out: Record<string, string | null> = {};
      for (const k of keys) out[k] = window.localStorage.getItem(k);
      return out;
    }, keysToCheck);
  };

  const containsExpected = (storage: Record<string, string | null>) => {
    const hits: string[] = [];

    for (const k of Object.keys(storage)) {
      const v = storage[k] || "";
      if (!v) continue;

      // (A) hit bruto simples
      if (v.includes(expected)) hits.push(`${k}:raw`);

      // (B) tentar JSON e procurar caminhos prováveis
      try {
        const obj: any = JSON.parse(v);

        // caminhos comuns vistos nos dumps do app
        const candidates = [
          obj?.state?.draft?.step3?.nivelAtividadeSemanal,
          obj?.draft?.step3?.nivelAtividadeSemanal,
          obj?.state?.profile?.nivelAtividadeSemanal,
          obj?.perfil?.nivelAtividadeSemanal,
          obj?.state?.perfil?.nivelAtividadeSemanal,
          obj?.data?.nivelAtividadeSemanal,
          obj?.nivelAtividadeSemanal,
        ].filter((x) => typeof x === "string") as string[];

        if (candidates.some((x) => x === expected)) hits.push(`${k}:jsonpath=${expected}`);
      } catch {
        // ignore
      }
    }

    return hits;
  };

  while (Date.now() < deadline) {
    const storage = await readStorage();
    const hits = containsExpected(storage);

    if (hits.length) {
      console.log("✅ MF: FAF persistido OK:", hits);
      return; // <- agora garantidamente dentro da função
    }

    await page.waitForTimeout(stepMs);
  }

  // falhou: imprime forense
  const storage = await readStorage();
  console.log("MF_PERSIST_FAIL_KEYS:", Object.keys(storage));
  for (const k of Object.keys(storage)) {
    const v = storage[k];
    console.log("MF_PERSIST_FAIL_SAMPLE:", k, (v || "").slice(0, 240));
  }
  throw new Error(`MF: FAF NÃO persistiu no localStorage (esperado ${expected}).`);
}
'''.strip("\n") + "\n\n"

s2 = s[:m.start()] + new_fn + s[m.end():]

# sanity: não pode sobrar "return;" solto (sem indent típico de função)
# heurística: linha começando com return com indent muito baixo
if re.search(r'(?m)^\s{0,2}return\s*;', s2):
    # não vamos falhar automaticamente (pode existir return em outros helpers),
    # mas o caso do erro era bem específico. Vamos só alertar.
    print("⚠️ warning: ainda existe 'return;' com pouca indent (0-2 espaços). Se der erro de novo, me manda as linhas ao redor.")

p.write_text(s2, encoding="utf-8")
print("✅ rebuilt mfAssertFAFPersisted:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --workers=1

echo "==> [5] commit + push"
git add -A
git commit -m "test(e2e): rebuild mfAssertFAFPersisted (fix return outside function / SSOT localStorage polling)" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
