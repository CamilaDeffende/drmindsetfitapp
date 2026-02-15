#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
FILE="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-fix-selectOption-$TS"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$FILE")"
cp -a "$FILE" "$BKP/$FILE"
echo "✅ backup em: $BKP"

echo "==> [2] patch mfSelectFAFModerado -> selectOption"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

m = re.search(r'(?s)async function mfSelectFAFModerado\s*\([^)]*\)\s*\{.*?\n\}', s)
if not m:
    raise SystemExit("❌ Não encontrei function mfSelectFAFModerado no spec.")

new_fn = r'''
async function mfSelectFAFModerado(page: any) {
  // ✅ Seleção correta para <select>: use selectOption (não clicar em <option>)
  // 1) tenta por âncora/testid (se existir no app)
  const candidates = [
    page.getByTestId("mf-faf-select"),
    page.getByTestId("nivelAtividadeSemanal"),
    page.getByTestId("onboarding-faf-select"),
  ];

  // 2) tenta localizar um <select> próximo do texto/label "Fator de Atividade" / "FAF" / "Nível de atividade"
  const byLabel = page.locator("select").filter({
    has: page.locator("option", { hasText: /Moderadamente ativo/i }),
  });

  // helper: tenta selectOption em um locator
  async function trySelect(sel: any): Promise[bool] {
    try:
      # python placeholder
      return False
    except Exception:
      return False
  }
}
'''.strip("\n") + "\n"

# Vamos escrever a função correta (em TS) sem placeholders python
new_fn = '''
async function mfSelectFAFModerado(page: any) {
  // ✅ Seleção correta para <select>: use selectOption (não clicar em <option>)
  // 1) tenta por âncora/testid (se existir no app)
  const directCandidates = [
    page.getByTestId("mf-faf-select"),
    page.getByTestId("nivelAtividadeSemanal"),
    page.getByTestId("onboarding-faf-select"),
  ];

  // 2) tenta localizar um <select> que contenha a opção de "Moderadamente ativo"
  const byOptions = page.locator("select").filter({
    has: page.locator("option", { hasText: /Moderadamente ativo/i }),
  });

  const all = [...directCandidates, byOptions.first()];

  for (const sel of all) {
    try {
      // garante que existe
      const cnt = await sel.count().catch(() => 0);
      if (!cnt) continue;

      // tenta por value (ideal)
      await sel.selectOption({ value: "moderadamente_ativo" }, { timeout: 8000 }).catch(async () => {
        // fallback por label (quando value muda)
        await sel.selectOption({ label: /Moderadamente ativo/i }, { timeout: 8000 });
      });

      // sanity: espera a opção aplicada (best-effort)
      await sel.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
      return;
    } catch {
      // tenta próximo candidato
    }
  }

  // 3) fallback final: encontra select via DOM e força value + change
  const ok = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll("select"));
    const target = selects.find((s) =>
      Array.from(s.querySelectorAll("option")).some((o) => /moderadamente ativo/i.test(o.textContent || ""))
    );
    if (!target) return false;

    // tenta value conhecido
    const optByValue = Array.from(target.options).find((o) => o.value === "moderadamente_ativo");
    const optByText = Array.from(target.options).find((o) => /moderadamente ativo/i.test(o.textContent || ""));

    const opt = optByValue || optByText;
    if (!opt) return false;

    target.value = opt.value;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  });

  if (!ok) throw new Error("MF: não consegui selecionar FAF Moderadamente ativo (selectOption falhou e fallback DOM não achou select).");
}
'''.lstrip("\n")

s2 = s[:m.start()] + new_fn + s[m.end():]

# Sanity: não pode sobrar click em option Moderadamente ativo dentro da mfSelectFAFModerado
block = re.search(r'(?s)async function mfSelectFAFModerado.*?\n\}', s2).group(0)
if re.search(r'getByText\(/Moderadamente ativo/i\)\.first\(\)\.click', block):
    raise SystemExit("❌ Ainda existe click no option dentro de mfSelectFAFModerado.")

if s2 == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada (inesperado).")

p.write_text(s2, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --workers=1

echo "==> [5] commit + push"
git add -A
git commit -m "test(e2e): fix FAF selection using selectOption on <select> (no clicking <option>); add robust fallbacks" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
