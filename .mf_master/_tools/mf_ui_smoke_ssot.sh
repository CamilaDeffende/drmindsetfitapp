#!/usr/bin/env bash
set -euo pipefail

ROOT=".mf_master/qa"
OUT="$ROOT/ssot_ui_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUT"
LOG="$OUT/dev.log"
URL="http://127.0.0.1:8080"

echo "==> kill 8080"
(lsof -t -iTCP:8080 -sTCP:LISTEN | head -n 1 | xargs -I{} kill -9 {} >/dev/null 2>&1 || true)

echo "==> dev (bg)"
nohup npm run -s dev -- --host 127.0.0.1 --port 8080 </dev/null > "$LOG" 2>&1 &
DEV_PID="$!" && (disown "$DEV_PID" >/dev/null 2>&1 || true)
cleanup(){ kill -9 "$DEV_PID" >/dev/null 2>&1 || true; wait "$DEV_PID" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM

echo "==> wait /"
node - <<NODE
const http=require("http");
const url="${URL}/";
let t=0;
(function tick(){
  t++;
  http.get(url,res=>{
    if(res.statusCode && res.statusCode<500){ console.log("✅ UP:",res.statusCode); process.exit(0); }
    if(t>140){ console.log("❌ timeout"); process.exit(1); }
    setTimeout(tick,400);
  }).on("error",()=>{ if(t>140){console.log("❌ timeout");process.exit(1);} setTimeout(tick,400);});
})();
NODE

echo "==> playwright screenshots"
node - <<'NODE'
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const URL = process.env.URL_BASE || "http://127.0.0.1:8080";
const OUT = process.env.OUT_DIR || path.join(".mf_master/qa", "ssot_ui_" + Date.now());
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }});
  const page = await ctx.newPage();

  const pages = [
    { p: "/", f: "00_home.png" },
    { p: "/planos-ativos", f: "01_planos-ativos.png" },
    { p: "/dashboard-premium", f: "02_dashboard-premium.png" },
    { p: "/report", f: "03_report.png" },
    { p: "/nutrition-plan", f: "04_nutrition-plan.png" },
  ];

  for (const it of pages) {
    const url = URL + it.p;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, it.f), fullPage: true });
  }

  await ctx.close();
  await browser.close();
  console.log("✅ screenshots OK");
  console.log("📸 Pasta:", OUT);
})().catch((e) => { console.error("❌ playwright fail:", e); process.exit(1); });
NODE

echo
echo "============================================================"
echo "✅ UI SMOKE OK"
echo "📸 Screenshots em: $OUT"
echo "🪵 Dev log: $LOG"
echo "============================================================"
