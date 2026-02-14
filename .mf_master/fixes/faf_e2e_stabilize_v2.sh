#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/faf-e2e-stabilize-$TS"
mkdir -p "$BKP"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
for c in src tests playwright.config.ts package.json; do
  if [ -e "$c" ]; then
    mkdir -p "$BKP/$(dirname "$c")"
    cp -a "$c" "$BKP/$c"
  fi
done
echo "✅ backup em: $BKP"

echo "==> [2] patch UI+E2E (idempotente)"
python3 - <<'PY2'
from __future__ import annotations
from pathlib import Path
import re, sys

ROOT = Path(".").resolve()

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def write(p: Path, s: str):
    p.write_text(s, encoding="utf-8")

bkp_dirs = sorted(Path(".backups").glob("faf-e2e-stabilize-*"))
BKP = bkp_dirs[-1] if bkp_dirs else Path(".backups/_missing_")

def backup_file(p: Path):
    try:
        rel = p.relative_to(ROOT)
    except Exception:
        rel = Path(p.name)
    dest = BKP / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(read(p), encoding="utf-8")

# ---- UI: data-testids FAF ----
faf_files = []
for p in ROOT.rglob("*.tsx"):
    if any(x in p.parts for x in ("node_modules", "dist", ".backups", ".scan")):
        continue
    try:
        s = read(p)
    except Exception:
        continue
    if "Moderadamente ativo" in s:
        faf_files.append(p)

def patch_faf_ui(p: Path) -> bool:
    s = read(p); orig = s

    pat_sel = re.compile(r"(<SelectItem\b(?![^>]*\bdata-testid=)[^>]*)(>)(\s*Moderadamente ativo\s*)(</SelectItem>)")
    s = pat_sel.sub(r"\1 data-testid=\"mf-faf-option-moderadamente-ativo\"\2\3\4", s)

    pat_cmd = re.compile(r"(<CommandItem\b(?![^>]*\bdata-testid=)[^>]*)(>)(\s*Moderadamente ativo\s*)(</CommandItem>)")
    s = pat_cmd.sub(r"\1 data-testid=\"mf-faf-option-moderadamente-ativo\"\2\3\4", s)

    pat_tr = re.compile(r"(<SelectTrigger\b(?![^>]*\bdata-testid=)[^>]*)(>)")
    if ("FAF" in s) or ("Fator de Atividade" in s) or ("Moderadamente ativo" in s):
        s = pat_tr.sub(r"\1 data-testid=\"mf-faf-select\"\2", s, count=1)

    pat_combo = re.compile(r"(<button\b(?![^>]*\bdata-testid=)(?=[^>]*\brole\s*=\s*\"combobox\")[^>]*)(>)")
    s = pat_combo.sub(r"\1 data-testid=\"mf-faf-select\"\2", s, count=1)

    if s != orig:
        backup_file(p); write(p, s); return True
    return False

patched_ui = False
for p in faf_files[:30]:
    if patch_faf_ui(p):
        print(f"✅ UI patched: {p}")
        patched_ui = True
if not patched_ui:
    print("⚠️ UI: não achei local patchável com SelectItem/CommandItem. E2E terá fallback por texto.")

# ---- E2E: patch spec FAF ----
specs = []
for p in ROOT.rglob("tests/**/*.spec.ts"):
    if any(x in p.parts for x in ("node_modules", "dist", ".backups", ".scan")):
        continue
    s = read(p)
    if ("Moderadamente ativo" in s) or ("FAF" in s) or ("fator de atividade" in s.lower()):
        specs.append(p)

if not specs:
    print("❌ Não encontrei spec FAF.")
    sys.exit(1)

spec = next((p for p in specs if "Moderadamente ativo" in read(p)), specs[0])
s = read(spec); orig = s

# Import Page (sem any)
if "Page" not in s:
    m = re.search(r'(?m)^import\s*\{\s*([^\}]+)\s*\}\s*from\s*[\"\']@playwright/test[\"\']\s*;\s*$', s)
    if m and "Page" not in m.group(1):
        rep = m.group(0).replace(m.group(1), m.group(1).strip() + ", Page")
        s = s.replace(m.group(0), rep)
    elif "@playwright/test" not in s:
        s = 'import { Page } from "@playwright/test";\n' + s

HELPER = '''
async function mfWaitAppReady(page: Page) {
  await page.waitForTimeout(150);
}
'''
if "mfWaitAppReady" not in s:
    m = re.search(r"(?m)^(import[\s\S]+?\n)\n", s)
    if m:
        ins = m.end()
        s = s[:ins] + HELPER + "\n" + s[ins:]
    else:
        s = HELPER + "\n" + s

# sem catch(() => {}) para não ter chaves no texto do comando (só no arquivo)
SNIP = '''
  await mfWaitAppReady(page);

  const fafTrigger = page.getByTestId("mf-faf-select");
  const triggerCount = await fafTrigger.count().catch(() => 0);

  if (triggerCount > 0) {
    await fafTrigger.first().click();
    const opt = page.getByTestId("mf-faf-option-moderadamente-ativo");
    const optCount = await opt.count().catch(() => 0);
    if (optCount > 0) {
      await opt.first().click();
    } else {
      await page.getByText("Moderadamente ativo", { exact: true }).click();
    }
  } else {
    const label = page.getByText(/Fator de Atividade|FAF/i).first();
    await label.click().catch(() => {});
    await page.getByText("Moderadamente ativo", { exact: true }).click();
  }
'''

if "mf-faf-select" not in s and "mf-faf-option-moderadamente-ativo" not in s:
    mg = re.search(r"(?m)^\s*await\s+page\.goto\([^;]+;\s*$", s)
    if mg:
        ins = mg.end()
        s = s[:ins] + "\n" + SNIP + "\n" + s[ins:]
    else:
        mt = re.search(r"(?s)(test\([^\)]*\)\s*=>\s*\{\s*)", s)
        if not mt:
            print("❌ Não localizei test(...) no spec.")
            sys.exit(1)
        ins = mt.end()
        s = s[:ins] + "\n" + SNIP + "\n" + s[ins:]

if s != orig:
    backup_file(spec); write(spec, s)
    print(f"✅ E2E patched: {spec}")
else:
    print(f"ℹ️ E2E sem mudanças: {spec}")
PY2

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e"
npm run -s test:e2e

echo "==> [5] commit + push"
git add -A
git commit -m "test(e2e): stabilize FAF selectors via data-testid" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
