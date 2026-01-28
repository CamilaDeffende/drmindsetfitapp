import { chromium } from "playwright";
import fs from "fs";

const ts = new Date().toISOString().replace(/[:.]/g, "-");
const report = `.backups/_rebuild_sprint0/smoke_ui_${ts}.txt`;
const base = "http://127.0.0.1:8080";

function log(s){ fs.appendFileSync(report, s + "\n"); console.log(s); }

const publicRoutes = ["/", "/login", "/pricing", "/signup"];
const protectedRoutes = ["/dashboard", "/planos-ativos", "/nutrition", "/edit-diet", "/report", "/corrida-pro"];

const loginSignals = [
  "text=/login/i","text=/entrar/i","text=/email/i","text=/senha/i","text=/continuar/i",
];
const gateSignals = [
  "text=/assinatura/i","text=/premium/i","text=/planos/i","text=/começar/i","text=/comece/i",
];
const appSignals = [
  "text=/nenhum planejamento configurado/i",
  "text=/nenhuma dieta ativa/i",
  "text=/configurar agora/i",
  "text=/planejamento/i",
  "text=/dieta/i",

  "text=/dashboard/i","text=/onboarding/i","text=/nutriç/i","text=/relat/i","text=/exportar pdf/i",
  "text=/planos ativos/i","text=/treino/i","text=/corrida/i",
];

async function hitAny(page, selectors) {
  for (const sel of selectors) {
    try { await page.locator(sel).first().waitFor({ timeout: 900 }); return sel; } catch {}
  }
  return null;
}

(async () => {
  fs.mkdirSync(".backups/_rebuild_sprint0", { recursive: true });
  fs.writeFileSync(report, "");
  log("==> INFO");
  log(`BASE: ${base}`);
  log(`REPORT: ${report}`);
  log("");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  log("==> PUBLIC ROUTES");
  for (const path of publicRoutes) {
    const resp = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    const status = resp?.status() ?? 0;
    await page.waitForTimeout(350);
    log(`${path} -> status=${status} title="${await page.title()}" url_now=${page.url().replace(base,"")}`);
  }

  log("");
  log("==> PROTECTED ROUTES (redirect->/login OR gate OR app)");
  let ok = 0, bad = 0;

  for (const path of protectedRoutes) {
    const resp = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    const status = resp?.status() ?? 0;
    await page.waitForTimeout(900);

    const urlNow = page.url().replace(base, "") || "/";
    const bodyText = (await page.locator("body").innerText().catch(()=> "")) || "";
    const sample = bodyText.replace(/\s+/g," ").trim().slice(0, 300);

    const loginHit = await hitAny(page, loginSignals);
    const gateHit  = await hitAny(page, gateSignals);
    const appHit   = await hitAny(page, appSignals);

    const redirectedToLogin = urlNow.startsWith("/login");

    let verdict = "FAIL";
    if (redirectedToLogin || loginHit) verdict = "LOGIN_OK";
    else if (gateHit) verdict = "GATE_OK";
    else if (appHit) verdict = "APP_OK";

    if (verdict === "FAIL") bad++; else ok++;

    log(`${path} -> status=${status} url_now=${urlNow} verdict=${verdict}`);
    log(`   hits: login=${loginHit||"none"} | gate=${gateHit||"none"} | app=${appHit||"none"}`);
    log(`   body_sample: ${sample || "(empty)"}`);
  }

  await browser.close();

  log("");
  log(`==> SUMMARY ok=${ok} fail=${bad}`);
  if (bad > 0) {
    log("❌ SMOKE UI FAIL (rotas protegidas sem login/gate/app).");
    process.exit(1);
  }
  log("✅ SMOKE UI OK");
})();
