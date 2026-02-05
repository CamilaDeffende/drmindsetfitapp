import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const BASE = "http://127.0.0.1:8080";

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
    "T" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
  );
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function write(p, s) { fs.writeFileSync(p, s ?? "", "utf8"); }

function waitHttp(url, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) reject(new Error("timeout http"));
        else setTimeout(tick, 250);
      });
    };
    tick();
  });
}

async function snap(page, outDir, prefix) {
  try { write(path.join(outDir, `${prefix}.url.txt`), String(page.url())); } catch {}
  try { write(path.join(outDir, `${prefix}.title.txt`), String(await page.title().catch(()=> ""))); } catch {}
  try { write(path.join(outDir, `${prefix}.html`), String(await page.content().catch(()=> ""))); } catch {}
  try { await page.screenshot({ path: path.join(outDir, `${prefix}.png`), fullPage: true }).catch(()=>{}); } catch {}
}


async function dumpCandidates(page, outDir, prefix) {
  const txt = await page.evaluate(() => {
    function norm(x){ return String(x||"").replace(/\s+/g," ").trim(); }
    const nodes = Array.from(document.querySelectorAll("button,a,[role=button],[role=link]"));
    const hits = [];
    for (const el of nodes) {
      const tag = (el.tagName || "").toLowerCase();
      const role = norm(el.getAttribute?.("role"));
      const da = norm(el.getAttribute?.("data-action"));
      const dt = norm(el.getAttribute?.("data-testid"));
      const ar = norm(el.getAttribute?.("aria-label"));
      const ti = norm(el.getAttribute?.("title"));
      const href = norm(el.getAttribute?.("href"));
      const id = norm(el.getAttribute?.("id"));
      const cls = norm(el.getAttribute?.("class"));
      const t = norm(el.textContent).slice(0,160);
      const bag = [tag, role, da, dt, ar, ti, href, id, cls, t].join(" ").toLowerCase();
      if (/(pdf|export|relat|baixar|download|gerar|imprimir|print|share)/.test(bag)) {
        hits.push([
          `tag=${tag}`,
          role && `role=${role}`,
          da && `data-action=${da}`,
          dt && `data-testid=${dt}`,
          ar && `aria-label=${ar}`,
          ti && `title=${ti}`,
          href && `href=${href}`,
          id && `id=${id}`,
          cls && `class=${cls.slice(0,120)}`,
          t && `text=${t}`
        ].filter(Boolean).join(" | "));
      }
    }
    return hits.join("\\n") || "(none)";
  }).catch(()=> "(eval_failed)");

  const p = require("path").join(outDir, `${prefix}__candidates.txt`);
  require("fs").writeFileSync(p, txt + "\\n", "utf8");
}

async function dumpButtons(page, outDir, prefix) {
  const txt = await page.evaluate(() => {
    function norm(x){ return String(x||"").replace(/\s+/g," ").trim(); }
    const nodes = Array.from(document.querySelectorAll("button,a,[role=button],[role=link]"));
    const out = [];
    for (const el of nodes) {
      const tag = (el.tagName || "").toLowerCase();
      const t = norm(el.textContent).slice(0,120);
      const da = norm(el.getAttribute?.("data-action"));
      const dt = norm(el.getAttribute?.("data-testid"));
      const ar = norm(el.getAttribute?.("aria-label"));
      const href = norm(el.getAttribute?.("href"));
      if (t || da || dt || ar || href) {
        out.push([`tag=${tag}`, da && `da=${da}`, dt && `dt=${dt}`, ar && `aria=${ar}`, href && `href=${href}`, t && `text=${t}`].filter(Boolean).join(" | "));
      }
    }
    return out.join("\\n") || "(none)";
  }).catch(()=> "(eval_failed)");

  const p = require("path").join(outDir, `${prefix}__buttons.txt`);
  require("fs").writeFileSync(p, txt + "\\n", "utf8");
}
async function injectBootstrap(page) {
  // Bootstrap: marcar onboarding completo + plano ativo mínimo
  await page.addInitScript(() => {
    try {
      const plan = {
        id: "demo-plan",
        name: "Plano Demo",
        createdAt: Date.now(),
        modalities: ["musculacao"],
        days: ["seg", "ter", "qua", "qui", "sex"],
        level: "intermediario"
      };

      const store = { state: { activePlan: plan, onboarding: { completed: true, step: 8, safeStep: "step-8" } }, version: 1 };
      const pairs = [
        ["mindsetfit-store", JSON.stringify(store)],
        ["mf:onboarding:completed", "1"],
        ["mf:onboarding:step", "8"],
        ["mf:activePlan:v1", JSON.stringify(plan)],
      ];

      for (const [k, v] of pairs) {
        try { localStorage.setItem(k, v); } catch {}
      }

      try {
        sessionStorage.setItem("mf:onboarding:completed", "1");
        sessionStorage.setItem("mf:onboarding:step", "8");
      } catch {}
    } catch {}
  });
}

async function tryClickExport(page) {
  // tenta por semântica (mais robusto)
  const names = [
    /exportar/i,
    /gerar\s*pdf/i,
    /baixar/i,
    /download/i,
    /relat[óo]rio/i,
    /\bpdf\b/i
  ];

  for (const rx of names) {
    try {
      const btn = page.getByRole("button", { name: rx }).first();
      if ((await btn.count().catch(()=>0)) > 0) {
        await btn.scrollIntoViewIfNeeded().catch(()=>{});
        await page.waitForTimeout(120);
        await btn.click({ timeout: 2500 }).catch(()=>{});
        return true;
      }
    } catch {}
    try {
      const link = page.getByRole("link", { name: rx }).first();
      if ((await link.count().catch(()=>0)) > 0) {
        await link.scrollIntoViewIfNeeded().catch(()=>{});
        await page.waitForTimeout(120);
        await link.click({ timeout: 2500 }).catch(()=>{});
        return true;
      }
    } catch {}
  }

  // tenta data-*
  const css = [
    "[data-action*=pdf i]",
    "[data-action*=export i]",
    "[data-action*=relat i]",
    "[data-testid*=pdf i]",
    "[data-testid*=export i]",
    "[data-testid*=relat i]",
    "button:has-text(\"Export\")",
    "button:has-text(\"Exportar\")",
    "button:has-text(\"Gerar\")",
    "button:has-text(\"PDF\")",
    "button:has-text(\"Baixar\")",
    "button:has-text(\"Relatório\")",
    "a:has-text(\"PDF\")"
  ];

  for (const sel of css) {
    try {
      const loc = page.locator(sel).first();
      if ((await loc.count().catch(()=>0)) > 0) {
        await loc.scrollIntoViewIfNeeded().catch(()=>{});
        await page.waitForTimeout(80);
        await loc.click({ timeout: 2500 }).catch(()=>{});
        return true;
      }
    } catch {}
  }

  return false;
}

async function mfCapturePdfFallback(page, outDir, prefix) {
  // Fallback forte: gerar PDF do DOM (Playwright chromium)
  try {
    const fp = require("path").join(outDir, `${prefix}__fallback_render.pdf`);
    await page.pdf({
      path: fp,
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" }
    }).catch(()=>{});
    return fp;
  } catch {
    return null;
  }
}

async function main() {
  const OUT = path.join(".mf_master/qa", `pdf_smoke_${ts()}`);
  ensureDir(OUT);

  const consoleLog = [];
  const pageErrors = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    const line = `[console.${msg.type()}] ${msg.text()}`;
    consoleLog.push(line);
  });
  page.on("pageerror", (err) => {
    pageErrors.push(`[pageerror] ${String(err && err.stack || err)}`);
  });
  page.on("requestfailed", (req) => {
    pageErrors.push(`[requestfailed] ${req.url()} :: ${req.failure()?.errorText || "unknown"}`);
  });

  // Captura PDF via response
  let respPdfCount = 0;
  page.on("response", async (res) => {
    try {
      const ct = (res.headers()["content-type"] || "").toLowerCase();
      if (ct.includes("application/pdf")) {
        respPdfCount += 1;
        const buf = await res.body().catch(()=> null);
        if (buf && buf.length > 0) {
          const fp = path.join(OUT, `response_pdf_${String(respPdfCount).padStart(2,"0")}.pdf`);
          fs.writeFileSync(fp, buf);
        }
      }
    } catch {}
  });

  await injectBootstrap(page);

  const routes = [
    { key: "01__onboarding_step1", url: `${BASE}/onboarding/step-1` },
    { key: "02__dashboard", url: `${BASE}/dashboard` },
    { key: "03__dashboard_premium", url: `${BASE}/dashboard-premium` },
    { key: "04__dashboard_premium_alt", url: `${BASE}/dashboard/premium` },
    { key: "05__report", url: `${BASE}/report` },
    { key: "06__relatorio", url: `${BASE}/relatorio` },
    { key: "07__relatorio_completo", url: `${BASE}/relatorio-completo` },
    { key: "08__pdf", url: `${BASE}/pdf` },
  ];

  for (const r of routes) {
  let fallbackPdf = null;

    const prefixBase = r.key;

    // download listener por rota (salva se houver download)
    let dlCount = 0;
    const onDownload = async (dl) => {
      try {
        dlCount += 1;
        const suggested = dl.suggestedFilename?.() || `download_${dlCount}.pdf`;
        const fp = path.join(OUT, `${prefixBase}__download_${String(dlCount).padStart(2,"0")}__${suggested}`.replace(/[^\w.\-]+/g,"_"));
        await dl.saveAs(fp).catch(()=>{});
      } catch {}
    };
    page.on("download", onDownload);

    try {
      await page.goto(r.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    } catch {}
    await page.waitForTimeout(600);
    await snap(page, OUT, `${prefixBase}__00_goto`);

    // hydrated-ish
    try { await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(()=>{}); } catch {}
    await page.waitForTimeout(600);
    await snap(page, OUT, `${prefixBase}__01_hydrated`);

    // click export
    let clicked = false;
    try { clicked = await tryClickExport(page); } catch {}
    await page.waitForTimeout(1200);
    await snap(page, OUT, `${prefixBase}__02_after_click`);

    // resultado

    /* MF_AUTO_FALLBACK_PDF_V1 */
    try {
      const isReportLike = /\/(report|relatorio|relatorio-completo|pdf)(\b|\/|$)/i.test(r.url);
      if (isReportLike && !fallbackPdf) {
        fallbackPdf = await mfCapturePdfFallback(page, OUT, `${prefixBase}__02_after_click`).catch(()=> null);
      }
    } catch {}
    const result = {
      route: r.url,
      clicked,
      downloads: dlCount,
      respPdfCount,
      fallbackPdf
    };
    write(path.join(OUT, `${prefixBase}__result.json`), JSON.stringify(result, null, 2));

    page.off("download", onDownload);
  }

  write(path.join(OUT, "console.log"), consoleLog.join("\n") + "\n");
  write(path.join(OUT, "pageerrors.log"), pageErrors.join("\n") + "\n");

  await page.close().catch(()=>{});
  await context.close().catch(()=>{});
  await browser.close().catch(()=>{});

  // imprime onde ficou
  console.log("OUT=" + OUT);
}

main().catch((e) => {
  console.error(String(e && e.stack || e));
  process.exit(1);
});
