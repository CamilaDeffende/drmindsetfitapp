#!/usr/bin/env bash
set -euo pipefail

F_STORE="src/store/onboarding/onboardingStore.ts"
F_SAVER="src/store/onboarding/useOnboardingDraftSaver.ts"

TS="$(date +%Y%m%d_%H%M%S)"
BKP_DIR=".backups/block2_2_fix_parse/$TS"
mkdir -p "$BKP_DIR"
cp -a "$F_STORE" "$BKP_DIR/" || true
cp -a "$F_SAVER" "$BKP_DIR/" || true

echo "==> [1] Fix onboardingStore.ts: remove stray \\1 + restore OnboardingState + add saveDraftPartial"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/store/onboarding/onboardingStore.ts")
s = p.read_text(encoding="utf-8")
orig = s

# remove linhas que começam com "\1"
s = re.sub(r'(?m)^[ \t]*\\1.*\n', '', s)

marker = "// Estado em runtime (com actions)"
i = s.find(marker)
if i == -1:
    raise SystemExit("❌ marker não encontrado: // Estado em runtime (com actions)")

after = s[i:]
m_end = re.search(r'(?m)^\s*\};\s*$', after)
if not m_end:
    raise SystemExit("❌ não encontrei fim do bloco type (};) após marker")
block_end = i + m_end.end()

correct = (
    marker + "\n"
    "export type OnboardingState = OnboardingPersistedState & {\n"
    "  saveDraftPartial: (partial: OnboardingDraft) => void;\n"
    "  saveDraft: (partial: OnboardingDraft) => void;\n"
    "  markStepComplete: (step: number) => void;\n"
    "  setCurrentStep: (step: number) => void;\n"
    "  resetOnboarding: () => void;\n"
    "};\n"
)

s = s[:i] + correct + s[block_end:]

# inserir action saveDraftPartial (espelha saveDraft) se ainda não existir
if re.search(r'(?m)^\s*saveDraftPartial\s*:', s) is None:
    m = re.search(
        r'(?s)\n(\s*)saveDraft\s*:\s*\(partial\)\s*=>\s*\{\s*\n\s*set\(\(s\)\s*=>\s*\(\{.*?\}\)\);\s*\n\1\},',
        s
    )
    if not m:
        raise SystemExit("❌ não encontrei bloco saveDraft para espelhar")
    indent = m.group(1)
    block = m.group(0)
    block2 = block.replace(f"\n{indent}saveDraft:", f"\n{indent}saveDraftPartial:", 1)
    s = s[:m.start()] + block2 + "\n" + s[m.start():]

# garantia final: remove qualquer "\1" literal remanescente
s = s.replace("\\1", "")

s = s.replace("\r\n", "\n").replace("\r", "\n")

if s != orig:
    p.write_text(s, encoding="utf-8", newline="\n")
    print("✅ patched:", p)
else:
    print("ℹ️ no changes:", p)
PY

echo
echo "==> [2] Fix useOnboardingDraftSaver.ts: typed fallback (saveDraftPartial ?? saveDraft)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/store/onboarding/useOnboardingDraftSaver.ts")
s = p.read_text(encoding="utf-8")
orig = s

# troca qualquer selector antigo por fallback tipado
s2 = re.sub(
    r'const\s+saveDraftPartial\s*=\s*useOnboardingStore\([^\)]*\)\s*as\s*[\s\S]*?;\n',
    'const saveDraftPartial = useOnboardingStore((s) => s.saveDraftPartial ?? s.saveDraft);\n',
    s,
    count=1
)

if "saveDraftPartial = useOnboardingStore" not in s2:
    s2 = re.sub(
        r'(export\s+function\s+useOnboardingDraftSaver\([^{]*\{\s*\n)',
        r'\1  const saveDraftPartial = useOnboardingStore((s) => s.saveDraftPartial ?? s.saveDraft);\n',
        s2,
        count=1
    )

s2 = s2.replace("(s) => (s as any).saveDraftPartial", "(s) => s.saveDraftPartial")

if s2 != orig:
    p.write_text(s2, encoding="utf-8", newline="\n")
    print("✅ patched:", p)
else:
    print("ℹ️ no changes:", p)
PY

echo
echo "==> [3] Sanity view (lines 15-60)"
nl -ba "$F_STORE" | sed -n "15,60p"

echo
echo "==> [4] verify (BUILD VERDE)"
npm run -s verify

echo
echo "==> [5] commit + tag + push"
git add -A
git commit -m "fix(onboarding): repair OnboardingState + add saveDraftPartial + typed autosave fallback" || echo "ℹ️ nada para commitar"

TAG="freeze-block2-2-ssot-saveDraftPartial-green-$TS"
git tag -a "$TAG" -m "Freeze SSOT saveDraftPartial GREEN — $TS"
git push origin feat/phases-6-11
git push origin "$TAG"

echo "✅ done: $TAG"
