#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Phase 7 | integrate /progress route (safe)"

candidates=(
  "src/App.tsx"
  "src/main.tsx"
  "src/routes/AppRoutes.tsx"
  "src/routes/routes.tsx"
  "src/router.tsx"
  "src/routes.tsx"
)

target=""
for f in "${candidates[@]}"; do
  if [[ -f "$f" ]]; then target="$f"; break; fi
done

if [[ -z "$target" ]]; then
  echo "⚠️ Router não encontrado. Criando fallback src/routes/extraRoutes.tsx"
  mkdir -p src/routes
  cat > src/routes/extraRoutes.tsx <<'TSX'
import React from "react";
import { Route } from "react-router-dom";
import { ProgressPage } from "@/pages/progress/ProgressPage";

export function ExtraRoutes() {
  return (
    <>
      <Route path="/progress" element={<ProgressPage />} />
    </>
  );
}
TSX
  echo "✅ Criado: src/routes/extraRoutes.tsx (plugar no router principal)"
  exit 0
fi

echo "==> router file: $target"

python3 - <<PY2
from pathlib import Path
import re

f = Path("$target")
s = f.read_text(encoding="utf-8")

if "ProgressPage" in s and "/progress" in s:
  print("OK: route already present")
  raise SystemExit(0)

if 'from "@/pages/progress/ProgressPage"' not in s:
  lines = s.splitlines(True)
  last_import = 0
  for i, ln in enumerate(lines):
    if re.match(r'^\s*import\b', ln):
      last_import = i
  lines.insert(last_import+1, 'import { ProgressPage } from "@/pages/progress/ProgressPage";\n')
  s = "".join(lines)

if "<Routes" in s and "</Routes>" in s:
  s, n = re.subn(r'(</Routes>)', '  <Route path="/progress" element={<ProgressPage />} />\n\1', s, count=1)
  if n == 0:
    raise SystemExit("❌ Falha ao inserir dentro de <Routes>.")
else:
  note = "\n/* MF_NOTE: add route: <Route path=\"/progress\" element={<ProgressPage />} /> */\n"
  if "MF_NOTE: add route" not in s:
    s += note

f.write_text(s, encoding="utf-8")
print("OK: patched", f)
PY2

echo "==> verify"
npm run -s verify

git add -A
git commit -m "feat: phase 7 integrate progress route" || true

echo "✅ OK | Phase 7 route integration done"
