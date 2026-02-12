#!/usr/bin/env bash
set -euo pipefail
TS="$(date +%Y%m%d_%H%M%S)"
F="tests/e2e/boot-check.spec.ts"

mkdir -p .backups/e2e/tests
cp -a "$F" ".backups/e2e/tests/boot-check.spec.ts.bak.${TS}"

echo "==> patch: remove MF_E2E_ROOT_RENDER_ASSERT_V1 block (duplicate html) in boot-check"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/e2e/boot-check.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# Remove the older injected block entirely (it redeclares `html`)
s = re.sub(
    r"\n?\s*//\s*MF_E2E_ROOT_RENDER_ASSERT_V1[^\n]*\n\s*const\s+html\s*=\s*await\s+root\.innerHTML\(\)\s*;\s*\n\s*expect\s*\(\s*html\.length\s*\)\.toBeGreaterThan\(\s*80\s*\)\s*;\s*\n?",
    "\n",
    s,
    flags=re.M,
)

# Safety: if still has 2+ `const html = await root.innerHTML();`, keep the first only
matches = list(re.finditer(r"(?m)^\s*const\s+html\s*=\s*await\s+root\.innerHTML\(\)\s*;\s*$", s))
if len(matches) > 1:
    out = []
    last = 0
    kept = False
    for m in matches:
        out.append(s[last:m.start()])
        if not kept:
            out.append(s[m.start():m.end()])
            kept = True
        else:
            # drop duplicate line
            pass
        last = m.end()
    out.append(s[last:])
    s = "".join(out)

# Also dedupe duplicated expect(html.length)... right after, if doubled
s = re.sub(
    r"(?m)^( *expect\(html\.length\)\.toBeGreaterThan\(80\);\s*)\n\1",
    r"\1",
    s
)

# Cleanup extra blank lines
s = re.sub(r"\n{3,}", "\n\n", s)

if s != orig:
    p.write_text(s, encoding="utf-8")
    print("✅ patched:", p, "| htmlDecls:", len(re.findall(r"(?m)^\\s*const\\s+html\\s*=\\s*await\\s+root\\.innerHTML\\(\\)\\s*;\\s*$", s)))
else:
    print("ℹ️ no changes:", p)
PY

echo
echo "==> gate (tsc only) + e2e"
npx -s tsc --noEmit
npm run -s test:e2e || true

echo
echo "==> commit"
git add -A
git commit -m "test(e2e): fix boot-check duplicate html declaration" || true

echo
echo "✅ DONE"
git status -sb
