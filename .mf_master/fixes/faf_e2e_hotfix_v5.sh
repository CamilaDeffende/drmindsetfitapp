#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/faf-e2e-hotfix5-$TS"
mkdir -p "$BKP"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
F="src/components/branding/SplashScreen.tsx"
if [ -f "$F" ]; then
  mkdir -p "$BKP/$(dirname "$F")"
  cp -a "$F" "$BKP/$F"
fi
echo "✅ backup em: $BKP"

echo "==> [2] patch: remove unused useEffect import (idempotente)"
python3 - <<'PY2'
from pathlib import Path
import re, sys

p = Path("src/components/branding/SplashScreen.tsx")
if not p.exists():
    print("❌ SplashScreen.tsx não encontrado.")
    sys.exit(1)

s = p.read_text(encoding="utf-8")
orig = s

# Caso 1: import { useEffect } from "react";
s = re.sub(r'(?m)^\s*import\s*\{\s*useEffect\s*\}\s*from\s*["\']react["\']\s*;\s*\n', '', s)

# Caso 2: import { useEffect, ... } from "react";
def drop_useEffect(m: re.Match) -> str:
    items = [x.strip() for x in m.group(1).split(",")]
    items = [x for x in items if x and x != "useEffect"]
    if not items:
        return ""  # remove import inteiro
    return f'import {{ {", ".join(items)} }} from "react";\n'

s = re.sub(r'(?m)^\s*import\s*\{\s*([^\}]+)\s*\}\s*from\s*["\']react["\']\s*;\s*\n', drop_useEffect, s, count=1)

# Se ainda usar useEffect no arquivo por algum motivo, não remove.
if re.search(r'\buseEffect\b', s):
    # se apareceu como uso real, reverte para não quebrar
    s = orig

if s != orig:
    p.write_text(s, encoding="utf-8")
    print("✅ removed unused useEffect import")
else:
    print("ℹ️ no changes (already clean or useEffect still used)")
PY2

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e"
npm run -s test:e2e

echo "==> [5] commit + push"
git add -A
git commit -m "chore(splash): remove unused useEffect import (keep BUILD VERDE)" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
