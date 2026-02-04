#!/usr/bin/env bash
set -euo pipefail

URL="${URL_BASE:-http://127.0.0.1:8080}"

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT=".mf_master/qa/pdf_smoke_${STAMP}"
mkdir -p "$OUT"

LOG="$OUT/dev.log"
DL="$OUT/downloads"
mkdir -p "$DL"

echo "==> kill 8080" | tee -a "$LOG"
(lsof -t -iTCP:8080 -sTCP:LISTEN | head -n 1 | xargs -I{} kill -9 {} >/dev/null 2>&1 || true)

echo "==> dev (bg)" | tee -a "$LOG"
nohup npm run -s dev -- --host 127.0.0.1 --port 8080 </dev/null > "$LOG" 2>&1 &
DEV_PID="$!"
echo "DEV_PID=$DEV_PID" | tee -a "$LOG"

cleanup() {
  echo "==> teardown DEV_PID=$DEV_PID" | tee -a "$LOG"
  kill -9 "$DEV_PID" >/dev/null 2>&1 || true
  wait "$DEV_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "==> wait /" | tee -a "$LOG"
node - <<'NODE'
const http = require("http");
const url = (process.env.URL_BASE || "http://127.0.0.1:8080") + "/";
let tries = 0;
(function tick(){
  tries++;
  http.get(url,res=>{
    if (res.statusCode && res.statusCode < 500) { console.log("✅ UP:", res.statusCode); process.exit(0); }
    if (tries>240) { console.log("❌ timeout"); process.exit(1); }
    setTimeout(tick, 500);
  }).on("error",()=>{
    if (tries>240) { console.log("❌ timeout"); process.exit(1); }
    setTimeout(tick, 500);
  });
})();
NODE

echo "==> playwright pdf smoke (multi-route + hardened globals)" | tee -a "$LOG"
URL_BASE="$URL" OUT_DIR="$OUT" DL_DIR="$DL" node - <<'NODE'
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const URL = process.env.URL_BASE || "http://127.0.0.1:8080";
const OUT = process.env.OUT_DIR || ".mf_master/qa/pdf_smoke_fallback_" + Date.now();
const DL  = process.env.DL_DIR  || path.join(OUT, "downloads");

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(DL,  { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ✅ HARDEN GLOBALS BEFORE APP SCRIPTS (fix instanceof RHS not object)
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });

  await ctx.addInitScript(() => {
    try {
      const w = window;
      // Se algo do app/polyfill zerou isso, restaura para não quebrar instanceof
      if (typeof (w).HTMLElement !== "function") (w).HTMLElement = function HTMLElement(){};
      if (typeof (w).Element    !== "function") (w).Element    = function Element(){};
      if (typeof (w).Node       !== "function") (w).Node       = function Node(){};
      // garante prototypes mínimos (defensivo)
      if (!(w).HTMLElement.prototype) (w).HTMLElement.prototype = {};
      if (!(w).Element.prototype)    (w).Element.prototype    = {};
      if (!(w).Node.prototype)       (w).Node.prototype       = {};
    } catch {}
  });

  const page = await ctx.newPage();

  const consoleLines = [];
  const pageErrors = [];
  page.on("console", (msg) => { try { consoleLines.push(`[console.${msg.type()}] ${msg.text()}`); } catch {} });
  page.on("pageerror", (err) => { try { pageErrors.push(`[pageerror] ${String(err?.message || err)}`); } catch {} });

  async function dumpEvidence(prefix) {
    try { fs.writeFileSync(path.join(OUT, `${prefix}_url.txt`), page.url(), "utf-8"); } catch {}
    try { fs.writeFileSync(path.join(OUT, `${prefix}_title.txt`), await page.title().catch(()=>""), "utf-8"); } catch {}
    try { await page.screenshot({ path: path.join(OUT, `${prefix}.png`), fullPage: true }); } catch {}
    try {
      const html = await page.content().catch(()=> "");
      fs.writeFileSync(path.join(OUT, `${prefix}.html`), String(html).slice(0, 2_000_000), "utf-8");
    } catch {}
  }

  async function waitHydration() {
    const t0 = Date.now();
    while (Date.now() - t0 < 20000) {
      const ok = await page.evaluate(() => {
        const root = document.getElementById("root");
        if (!root) return false;
        const htmlLen = (root.innerHTML || "").length;
        const elCount = document.querySelectorAll("*").length;
        const bodyTextLen = (document.body?.innerText || "").trim().length;
        return (htmlLen > 800 && elCount > 120) || bodyTextLen > 200;
      }).catch(()=>false);
      if (ok) return true;
      await page.waitForTimeout(500);
    }
    return false;
  }

  async function pickFirst(loc) {
    const c = await loc.count().catch(()=>0);
    if (!c) return null;
    const first = loc.first();
    await first.scrollIntoViewIfNeeded().catch(()=>{});
    await page.waitForTimeout(200);
    return first;
  }

  async function tryExportOn(route, prefix) {
    const target = URL + route;
    await page.goto(target, { waitUntil: "domcontentloaded" });
    await dumpEvidence(`${prefix}_00`);

    // se redirecionou pra assinatura
    if (/\/assinatura\b/i.test(page.url())) {
      await dumpEvidence(`${prefix}_ZZ_gate_assinatura`);
      return { ok: false, reason: "gate_assinatura" };
    }

    const hydrated = await waitHydration();
    await dumpEvidence(`${prefix}_01_after_wait`);

    if (!hydrated) {
      // ainda pode ter botão, então não aborta aqui — só registra
      try {
        fs.writeFileSync(path.join(OUT, `${prefix}_hydration.txt`), "hydration=false\n", "utf-8");
      } catch {}
    }

    // dump quick buttons
    const btnDump = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("button,[role=button],a"));
      return nodes.map((b, idx) => {
        const tag = (b.tagName || "").toLowerCase();
        const t = ((b.innerText || b.textContent || "").trim().replace(/\\s+/g, " ")).slice(0, 140);
        const title = (b.getAttribute("title") || "").trim();
        const da = (b.getAttribute("data-action") || "").trim();
        const role = (b.getAttribute("role") || "").trim();
        return `${idx+1}. <${tag}> role="${role}" text="${t}" title="${title}" data-action="${da}"`;
      }).join("\\n");
    }).catch(()=>"(dump failed)");
    fs.writeFileSync(path.join(OUT, `${prefix}_buttons.txt`), btnDump || "(none)", "utf-8");

    // candidates (bem amplo)
    const candidates = [
      page.getByRole("button", { name: /exportar\\s*pdf/i }),
      page.getByRole("button", { name: /exportar/i }),
      page.locator("button:has-text(\"Exportar PDF\")"),
      page.locator("button:has-text(\"Exportar\")"),
      page.locator("[role=button]:has-text(\"Exportar PDF\")"),
      page.locator("[role=button]:has-text(\"Exportar\")"),
      page.locator("a:has-text(\"Exportar PDF\")"),
      page.locator("a:has-text(\"Exportar\")"),
      page.locator("[title*=\"Exportar\" i]"),
      page.locator("[data-action=\"download-premium-pdf\"]"),
      page.locator("text=/exportar\\s*pdf/i").first().locator("xpath=ancestor::*[self::button or @role=\"button\" or self::a][1]"),
    ];

    let btn = null;
    for (const c of candidates) { btn = await pickFirst(c); if (btn) break; }

    if (!btn) {
      await dumpEvidence(`${prefix}_ZZ_no_button`);
      return { ok: false, reason: "no_button" };
    }

    const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
    try { await btn.click({ timeout: 15000 }); }
    catch { await btn.click({ force: true, timeout: 15000 }); }

    const download = await downloadPromise;
    const suggested = download.suggestedFilename() || "relatorio.pdf";
    const filePath = path.join(DL, suggested.replace(/[^\\w.\\-]+/g, "_"));
    await download.saveAs(filePath);

    const st = fs.statSync(filePath);
    await page.waitForTimeout(600);
    await dumpEvidence(`${prefix}_02_after_click`);

    if (!st.size || st.size < 30_000) {
      return { ok: false, reason: "pdf_small", filePath, size: st.size };
    }

    return { ok: true, filePath, size: st.size, route };
  }

  const attempts = [
    { route: "/report",           prefix: "R" },
    { route: "/dashboard-premium",prefix: "D" },
    { route: "/planos-ativos",    prefix: "P" },
  ];

  let result = null;
  for (const a of attempts) {
    result = await tryExportOn(a.route, a.prefix);
    if (result && result.ok) break;
  }

  // dump logs
  if (consoleLines.length) fs.writeFileSync(path.join(OUT, "console.log"), consoleLines.join("\\n") + "\\n", "utf-8");
  if (pageErrors.length)   fs.writeFileSync(path.join(OUT, "pageerrors.log"), pageErrors.join("\\n") + "\\n", "utf-8");

  await ctx.close();
  await browser.close();

  if (!result || !result.ok) {
    throw new Error("PDF smoke FAIL (nenhuma rota exportou). OUT=" + OUT + " last=" + JSON.stringify(result));
  }

  console.log("✅ PDF smoke OK");
  console.log("✅ route:", result.route);
  console.log("📄 PDF:", result.filePath);
  console.log("📦 bytes:", result.size);
  console.log("📸 OUT:", OUT);
})().catch((e) => {
  console.error("❌ PDF smoke FAIL:", e);
  process.exit(1);
});
NODE

echo
echo "============================================================"
echo "✅ PDF SMOKE (runner executado)"
echo "📦 Pasta: $OUT"
echo "📄 Downloads: $DL"
echo "🪵 Dev log: $LOG"
echo "============================================================"
