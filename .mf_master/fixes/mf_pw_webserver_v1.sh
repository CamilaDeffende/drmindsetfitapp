#!/usr/bin/env bash
set -euo pipefail

CFG=""
for c in playwright.config.ts playwright.config.mts playwright.config.js playwright.config.mjs; do
  if [ -f "$c" ]; then CFG="$c"; break; fi
done

if [ -z "$CFG" ]; then
  echo "❌ playwright config não encontrado (playwright.config.*)."
  exit 1
fi

echo "==> patch playwright config: $CFG"
python3 - <<'PY'
from pathlib import Path
import re, time

cfg = None
for name in ["playwright.config.ts","playwright.config.mts","playwright.config.js","playwright.config.mjs"]:
    p = Path(name)
    if p.exists():
        cfg = p
        break
if cfg is None:
    raise SystemExit("❌ playwright.config.* não encontrado.")

s = cfg.read_text(encoding="utf-8")
orig = s

# backup
bdir = Path(".backups/e2e")
bdir.mkdir(parents=True, exist_ok=True)
bak = bdir / f"{cfg.name}.bak.{time.strftime('%Y%m%d_%H%M%S')}"
bak.write_text(orig, encoding="utf-8")

WEB = r"""
  // MF_PW_WEBSERVER_V1 — Playwright sobe o Vite automaticamente (porta 8080)
  webServer: {
    command: "npm run dev -- --strictPort --port 8080",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
"""

if "webServer:" in s:
    # já existe: substitui bloco webServer:{...} conservadoramente
    s2 = re.sub(r"(?s)\bwebServer\s*:\s*\{.*?\}\s*,?", WEB.strip() + "\n", s, count=1)
    s = s2
else:
    # injeta dentro do defineConfig({ ... })
    m = re.search(r"defineConfig\s*\(\s*\{", s)
    if not m:
        # fallback: tenta export default { ... }
        m2 = re.search(r"export\s+default\s*\{", s)
        if not m2:
            raise SystemExit("❌ Não encontrei defineConfig({ ... }) nem export default { ... } para injetar webServer.")
        insert_at = m2.end()
        s = s[:insert_at] + "\n" + WEB + s[insert_at:]
    else:
        insert_at = m.end()
        s = s[:insert_at] + "\n" + WEB + s[insert_at:]

# limpeza de duplicações grosseiras se rodar 2x (mantém o primeiro)
# (se houver 2 MF_PW_WEBSERVER_V1, remove os seguintes)
parts = s.split("MF_PW_WEBSERVER_V1")
if len(parts) > 2:
    # mantém o primeiro marcador + remove blocos duplicados
    head = parts[0] + "MF_PW_WEBSERVER_V1" + parts[1]
    tail = "MF_PW_WEBSERVER_V1".join(parts[2:])
    # remove qualquer webServer duplicado no tail
    tail = re.sub(r"(?s)\s*webServer\s*:\s*\{.*?\}\s*,?", "", tail)
    s = head + tail

if s != orig:
    cfg.write_text(s, encoding="utf-8")
    print("✅ patched:", cfg, "| backup:", bak)
else:
    print("ℹ️ no changes:", cfg, "| backup:", bak)
PY

echo
echo "==> run e2e (agora deve subir server sozinho)"
npm run -s test:e2e || true

echo
echo "==> commit"
git add -A
git commit -m "test(e2e): add Playwright webServer (auto-start Vite on :8080)" || true

echo
echo "✅ DONE"
git status -sb
