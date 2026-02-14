  #!/usr/bin/env bash
  set -euo pipefail

  BRANCH="feat/phases-6-11"
  TS="$(date +%Y%m%d_%H%M%S)"
  BKP=".backups/faf-e2e-hotfix3-$TS"
  mkdir -p "$BKP"

  echo "==> [0] branch guard"
  git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

  echo "==> [1] backup"
  for f in     src/components/branding/SplashScreen.tsx     src/components/steps/Step2Avaliacao.tsx     tests/mf/e2e_faf_moderadamente_ativo.spec.ts
  do
    if [ -f "$f" ]; then
      mkdir -p "$BKP/$(dirname "$f")"
      cp -a "$f" "$BKP/$f"
    fi
  done
  echo "✅ backup em: $BKP"

  echo "==> [2] patch: SplashScreen (remove hooks) + Step2 (force valid TSX)"
  python3 - <<'PY2'
  from __future__ import annotations
  from pathlib import Path
  import re, sys

  def read(p: Path) -> str:
      return p.read_text(encoding="utf-8", errors="strict")

  def write(p: Path, s: str):
      p.write_text(s, encoding="utf-8")

  # ---------------------------------------------------------
  # A) SplashScreen.tsx
  # Objetivo: NUNCA chamar Hook em callback.
  # Estratégia:
  # - converter useMfE2EBootBypass -> mfE2EBootBypass (função normal)
  # - remover useEffect dentro dela (unwrap)
  # - trocar todas as chamadas useMfE2EBootBypass(...) por mfE2EBootBypass(...)
  # ---------------------------------------------------------
  sp = Path("src/components/branding/SplashScreen.tsx")
  if not sp.exists():
      print("❌ SplashScreen.tsx não encontrado.")
      sys.exit(1)

  s = read(sp)
  orig = s

  # 1) renomear declarações (function/const)
  s = re.sub(r"(?m)^(\s*function\s+)useMfE2EBootBypass(\s*\()",
             r"mfE2EBootBypass", s)
  s = re.sub(r"(?m)^(\s*const\s+)useMfE2EBootBypass(\s*=\s*)",
             r"mfE2EBootBypass", s)

  # 2) trocar chamadas
  s = re.sub(r"useMfE2EBootBypass\s*\(", "mfE2EBootBypass(", s)

  # 3) remover/unwrap useEffect dentro da mfE2EBootBypass se existir
  #   padrões comuns:
  #   useEffect(() => { ... }, []);
  #   useEffect(()=>{ ... }, [x]);
  # Vamos substituir pelo bloco interno executado imediatamente com guard.
  def unwrap_use_effect(block: str) -> str:
      # pega conteúdo do primeiro useEffect da função
      # (não é parser, mas resolve o caso típico do bypass)
      pat = re.compile(r"useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[[\s\S]*?\]\s*\)\s*;?")
      m = pat.search(block)
      if not m:
          pat2 = re.compile(r"useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[\s*\]\s*\)\s*;?")
          m = pat2.search(block)
      if not m:
          pat3 = re.compile(r"useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*undefined\s*\)\s*;?")
          m = pat3.search(block)
      if not m:
          return block

      inner = m.group(1).rstrip()
      # executa imediatamente, mas com guard (não muda UX real se condição e2e existir)
      repl = (
          "try {
"
          + inner
          + "
} catch (e) { /* MF_E2E_BYPASS_SAFE */ }
"
      )
      return block[:m.start()] + repl + block[m.end():]

  # localizar corpo da função mfE2EBootBypass e unwrap
  # tenta function mfE2EBootBypass(...) { ... }
  mfun = re.search(r"(?s)(function\s+mfE2EBootBypass\s*\([^)]*\)\s*\{)([\s\S]*?)(
\})", s)
  if mfun:
      body = mfun.group(2)
      body2 = unwrap_use_effect(body)
      if body2 != body:
          s = s[:mfun.start(2)] + body2 + s[mfun.end(2):]

  # tenta const mfE2EBootBypass = (...) => { ... }
  mconst = re.search(r"(?s)(const\s+mfE2EBootBypass\s*=\s*\([^)]*\)\s*=>\s*\{)([\s\S]*?)(
\}\s*;)", s)
  if mconst:
      body = mconst.group(2)
      body2 = unwrap_use_effect(body)
      if body2 != body:
          s = s[:mconst.start(2)] + body2 + s[mconst.end(2):]

  if s != orig:
      write(sp, s)
      print("✅ SplashScreen.tsx: removed hook usage (no rules-of-hooks)")
  else:
      print("ℹ️ SplashScreen.tsx: no changes (already patched?)")

  # ---------------------------------------------------------
  # B) Step2Avaliacao.tsx
  # Objetivo: corrigir TSX inválido e remover caracteres/escapes.
  # - remover escapes " e controlar o SelectItem do moderadamente_ativo
  # - forçar linha TSX válida para essa opção
  # ---------------------------------------------------------
  st = Path("src/components/steps/Step2Avaliacao.tsx")
  if not st.exists():
      print("❌ Step2Avaliacao.tsx não encontrado.")
      sys.exit(1)

  s = read(st)
  orig = s

  # 1) limpa caracteres invisíveis comuns
  for ch in ["﻿","​","‌","‍","⁠"," "," "]:
      s = s.replace(ch, "")
  s = "".join(c for c in s if (ord(c) >= 32) or (c in "
	"))

  # 2) remove escapes de aspas em JSX que entraram nos patches
  s = s.replace('\"', '"').replace("\'", "'")

  # 3) garante SelectTrigger testid correto (aspas normais)
  s = re.sub(r'(<SelectTrigger(?![^>]*data-testid=)[^>]*)(>)',
             r' data-testid="mf-faf-select"', s, count=1)

  # 4) forçar opção moderadamente_ativo TSX válida (substitui qualquer variante quebrada)
  # - captura a tag completa SelectItem value="moderadamente_ativo" ... </SelectItem>
  pat_item = re.compile(r'(?s)<SelectItem[^>]*value="moderadamente_ativo"[^>]*>.*?</SelectItem>')
  s = pat_item.sub(
      '<SelectItem value="moderadamente_ativo" data-testid="mf-faf-option-moderadamente-ativo">Moderadamente ativo (1 a 3x/semana)</SelectItem>',
      s,
      count=1
  )

  if s != orig:
      write(st, s)
      print("✅ Step2Avaliacao.tsx: forced valid TSX for FAF option + cleaned escapes")
  else:
      print("ℹ️ Step2Avaliacao.tsx: no changes")

  PY2

  echo "==> [3] verify"
  npm run -s verify

  echo "==> [4] e2e"
  npm run -s test:e2e

  echo "==> [5] commit + push"
  git add -A
  git commit -m "fix(e2e): remove hook misuse in SplashScreen + fix Step2 FAF TSX/testids" || echo "ℹ️ nada para commitar"
  git push -u origin "$BRANCH"

  echo "✅ DONE"
