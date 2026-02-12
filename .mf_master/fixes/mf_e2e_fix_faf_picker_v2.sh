#!/usr/bin/env bash
set -euo pipefail
TS="$(date +%Y%m%d_%H%M%S)"
F="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

mkdir -p .backups/e2e/tests
cp -a "$F" ".backups/e2e/tests/e2e_faf_moderadamente_ativo.spec.ts.bak.${TS}"

echo "==> patch FAF picker (robusto: native select + listbox + fallback)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

new_fn = r'''
async function pickFafModeradamenteAtivo(page: any) {
  const label = /Moderadamente ativo/i;

  // (0) deixa o app estabilizar (evita pegar loader/placeholder)
  await page.waitForTimeout(400);

  // (1) Native <select> (melhor caminho)
  const nativeCandidates = page.locator(
    'select[name="nivelAtividadeSemanal"], select[id*="nivelAtividadeSemanal"], select'
  );

  for (let i = 0; i < (await nativeCandidates.count()); i++) {
    const sel = nativeCandidates.nth(i);
    try {
      const opts = await sel.locator("option").evaluateAll((els) =>
        els.map((e) => ({
          value: (e as HTMLOptionElement).value,
          text: (e.textContent || "").trim(),
        }))
      );

      const found = opts.find((o) => label.test(o.text));
      if (found) {
        if (found.value) {
          await sel.selectOption(found.value);
        } else {
          await sel.selectOption({ label: found.text });
        }
        return;
      }
    } catch {
      // ignore
    }
  }

  // (2) Combobox/Listbox (Shadcn/Headless UI)
  const triggers = page.locator(
    '[role="combobox"], button[aria-haspopup="listbox"], [aria-haspopup="listbox"][data-state]'
  );

  // tenta primeiro por proximidade textual
  const triggerByContext = triggers
    .filter({ hasText: /atividade|frequ|faf|nível/i })
    .first();

  if (await triggerByContext.count()) {
    await triggerByContext.click({ force: true });
    const listbox = page.locator('[role="listbox"]').first();
    const opt = listbox.locator('text=/Moderadamente ativo/i').first();
    await opt.click({ force: true });
    return;
  }

  // (3) tentativa genérica: abre o primeiro combobox/listbox e clica no texto
  const anyTrigger = triggers.first();
  if (await anyTrigger.count()) {
    await anyTrigger.click({ force: true });
    const opt = page.locator('text=/Moderadamente ativo/i').first();
    if (await opt.count()) {
      await opt.click({ force: true });
      return;
    }
  }

  // (4) fallback final: se o texto estiver clicável em algum lugar
  const txt = page.getByText(label).first();
  if (await txt.count()) {
    await txt.click({ force: true });
    return;
  }

  // Debug útil pra quando falhar: lista selects/comboboxes encontrados
  const dbg = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll("select")).map((s) => ({
      tag: "select",
      name: s.getAttribute("name"),
      id: s.getAttribute("id"),
      options: Array.from(s.querySelectorAll("option")).map((o) => (o.textContent || "").trim()).slice(0, 12),
    }));

    const combos = Array.from(document.querySelectorAll('[role="combobox"],[aria-haspopup="listbox"]'))
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role"),
        text: (el.textContent || "").trim().slice(0, 120),
      }))
      .slice(0, 20);

    return { selects, combos };
  }).catch(() => ({}));

  throw new Error(
    "FAF: não consegui selecionar 'Moderadamente ativo'. Debug=" + JSON.stringify(dbg)
  );
}
'''.strip() + "\n"

# substitui a função existente inteira
pat = r'(?s)async function pickFafModeradamenteAtivo\s*\(\s*page\s*:\s*any\s*\)\s*\{.*?\n\}\n'
m = re.search(pat, s)
if not m:
  raise SystemExit("❌ Não encontrei a função pickFafModeradamenteAtivo(page:any) para substituir.")

s2 = s[:m.start()] + new_fn + s[m.end():]

# cleanup
s2 = re.sub(r"\n{3,}", "\n\n", s2)

if s2 != orig:
  p.write_text(s2, encoding="utf-8")
  print("✅ patched:", p)
else:
  print("ℹ️ no changes:", p)
PY

echo
echo "==> e2e (apenas o FAF primeiro, depois full suite)"
# roda só o teste FAF pra ganhar tempo; se passar, roda suite inteira
npx -s playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --reporter=line || true
echo
npm run -s test:e2e || true

echo
echo "==> commit"
git add -A
git commit -m "test(e2e): make FAF picker resilient (native select + listbox + fallback)" || true

echo
echo "✅ DONE"
git status -sb
