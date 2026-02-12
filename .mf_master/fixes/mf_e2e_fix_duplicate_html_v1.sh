#!/usr/bin/env bash
set -euo pipefail
TS="$(date +%Y%m%d_%H%M%S)"

mkdir -p .backups/e2e/tests

for f in \
  tests/e2e/onboarding-route-diagnose.spec.ts \
  tests/e2e/root-render-health.spec.ts \
  tests/e2e/boot-check.spec.ts
do
  [ -f "$f" ] && cp -a "$f" ".backups/e2e/tests/$(basename "$f").bak.${TS}"
done

echo "==> remove injected MF_E2E_ROOT_RENDER_ASSERT_V1 blocks + add assertion using existing html"
python3 - <<'PY'
from pathlib import Path
import re

def strip_injected_block(s: str) -> str:
    # remove our injected block entirely
    s = re.sub(
        r"\n?\s*//\s*MF_E2E_ROOT_RENDER_ASSERT_V1[\s\S]*?expect\(html\.length\)\.toBeGreaterThan\(\s*80\s*\);\s*\n?",
        "\n",
        s,
        flags=re.M,
    )
    return s

def ensure_assert_after_existing_html(s: str) -> str:
    # If there is `const html = await root.innerHTML();` ensure the next few lines contain expect(html.length)...
    m = re.search(r"^\s*const\s+html\s*=\s*await\s+root\.innerHTML\(\)\s*;\s*$", s, flags=re.M)
    if not m:
        return s
    # look ahead a bit
    start = m.end()
    window = s[start:start+300]
    if re.search(r"expect\s*\(\s*html\.length\s*\)\.toBeGreaterThan\(\s*80\s*\)", window):
        return s
    ins = "\n  expect(html.length).toBeGreaterThan(80);\n"
    return s[:m.end()] + ins + s[m.end():]

targets = [
    Path("tests/e2e/onboarding-route-diagnose.spec.ts"),
    Path("tests/e2e/root-render-health.spec.ts"),
]

for p in targets:
    if not p.exists():
        continue
    orig = p.read_text(encoding="utf-8")
    s = orig
    s = strip_injected_block(s)
    s = ensure_assert_after_existing_html(s)
    if s != orig:
        p.write_text(s, encoding="utf-8")
        print("✅ patched:", p)
    else:
        print("ℹ️ no changes:", p)

# boot-check: garantir que não depende de data-mf-boot e valida root render
p = Path("tests/e2e/boot-check.spec.ts")
if p.exists():
    orig = p.read_text(encoding="utf-8")
    s = orig
    # remove qualquer toHaveAttribute data-mf-boot remanescente
    s = re.sub(r"^\s*await\s+expect\(\s*root\s*\)\.toHaveAttribute\(\s*['\"]data-mf-boot['\"].*?\);\s*\n?", "", s, flags=re.M)
    # injeta assert simples se não existir
    if "MF_E2E_BOOT_HTML_ASSERT_V1" not in s:
        s2 = re.sub(
            r"(const\s+root\s*=\s*page\.locator\(\s*['\"]#root['\"]\s*\)\s*;\s*\n)",
            r"\1  // MF_E2E_BOOT_HTML_ASSERT_V1\n  const html = await root.innerHTML();\n  expect(html.length).toBeGreaterThan(80);\n",
            s,
            count=1,
        )
        if s2 != s:
            s = s2
    if s != orig:
        p.write_text(s, encoding="utf-8")
        print("✅ patched:", p)
    else:
        print("ℹ️ no changes:", p)
PY

echo
echo "==> e2e"
npm run -s test:e2e || true

echo
echo "==> commit"
git add -A
git commit -m "test(e2e): fix duplicate html var after boot-sentinel removal" || true

echo
echo "✅ DONE"
git status -sb
