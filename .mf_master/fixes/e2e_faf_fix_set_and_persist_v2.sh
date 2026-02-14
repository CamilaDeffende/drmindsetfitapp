#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-fix-set-and-persist-v2-$TS"
FILE="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$FILE")"
cp -a "$FILE" "$BKP/$FILE"
echo "✅ backup em: $BKP"

echo "==> [2] patch spec: reach FAF anchor, set it, and assert SSOT via JSON paths"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

def insert_before(fn_name: str, block: str):
    global s
    m = re.search(rf"(?m)^\s*async function {re.escape(fn_name)}\(", s)
    if not m:
        raise SystemExit(f"❌ Não encontrei async function {fn_name}(")
    s = s[:m.start()] + block.rstrip() + "\n\n" + s[m.start():]

def replace_function(fn_name: str, new_body: str):
    global s
    # substitui o bloco inteiro async function fn(...) { ... }
    pat = rf"(?s)(^\s*async function {re.escape(fn_name)}\([^)]*\)\s*\{{).*?^\s*\}}\s*$"
    m = re.search(pat, s, flags=re.M)
    if not m:
        raise SystemExit(f"❌ Não encontrei o bloco da função {fn_name} para substituir.")
    s = s[:m.start()] + new_body.rstrip() + "\n" + s[m.end():]

# 1) helper robusto: localizar botão next (onboarding-next e mf-next-step)
if "async function mfFindNextButton" not in s:
    raise SystemExit("❌ Não encontrei mfFindNextButton no arquivo — me manda o spec inteiro.")
mfFindNew = r'''
async function mfFindNextButton(page: any) {
  // Step-1 usa onboarding-next; shell usa mf-next-step.
  const byOnboarding = page.getByTestId("onboarding-next").first();
  if (await byOnboarding.count().catch(() => 0)) return byOnboarding;

  const byMF = page.getByTestId("mf-next-step").first();
  if (await byMF.count().catch(() => 0)) return byMF;

  // fallback text/role
  const byText = page
    .locator('button:has-text("Continuar"), button:has-text("Próxima etapa"), button:has-text("Próxima"), button:has-text("Finalizar")')
    .first();
  if (await byText.count().catch(() => 0)) return byText;

  return page.getByRole("button", { name: /continuar|próxima|finalizar/i }).first();
}
'''.strip("\n")
replace_function("mfFindNextButton", mfFindNew)

# 2) novo helper: avançar até aparecer mf-faf-select (sem supor URL/step)
if "async function mfAdvanceUntilFAF" not in s:
    block = r'''
async function mfAdvanceUntilFAF(page: any) {
  const faf = page.getByTestId("mf-faf-select").first();

  // tenta até 8 avanços (cobre steps intermediários)
  for (let i = 0; i < 8; i++) {
    if (await faf.count().catch(() => 0)) {
      await faf.waitFor({ state: "visible", timeout: 15000 });
      return;
    }

    const btn = await mfFindNextButton(page);
    if (!btn || !(await btn.count().catch(() => 0))) {
      await mfDebugOnFail(page, "no-next-while-seeking-faf");
      throw new Error("MF: não encontrei next enquanto buscava mf-faf-select (FAF).");
    }

    await btn.waitFor({ state: "visible", timeout: 15000 });
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click({ timeout: 15000 }).catch(async () => {
      try { await btn.evaluate((el: any) => (el as any).click()); } catch {}
    });

    await page.waitForTimeout(250);
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForTimeout(250);
  }

  await mfDebugOnFail(page, "faf-anchor-not-found");
  throw new Error("MF: não encontrei mf-faf-select após avanços (flow mudou).");
}
'''.strip("\n")
    # insere antes de mfSelectFAFModerado se existir
    if re.search(r"(?m)^\s*async function mfSelectFAFModerado\(", s):
        insert_before("mfSelectFAFModerado", block)
    else:
        # insere antes de mfDebugOnFail
        if re.search(r"(?m)^\s*async function mfDebugOnFail\(", s):
            insert_before("mfDebugOnFail", block)
        else:
            m0 = re.search(r"(?m)^\s*test\.describe\(", s)
            s = s[:m0.start()] + block + "\n\n" + s[m0.start():]

# 3) reescrever mfSelectFAFModerado: usa mf-faf-select + escolhe opção Moderadamente
if re.search(r"(?m)^\s*async function mfSelectFAFModerado\(", s):
    mfSel = r'''
async function mfSelectFAFModerado(page: any) {
  const faf = page.getByTestId("mf-faf-select").first();
  await faf.waitFor({ state: "visible", timeout: 20000 });

  // abre dropdown (pode ser botão ou select custom)
  await faf.click({ timeout: 15000 }).catch(async () => {
    try { await faf.evaluate((el: any) => (el as any).click()); } catch {}
  });

  // tenta clicar no item pelo texto
  const opt = page.getByRole("option", { name: /moderadamente\s+ativo/i }).first();
  if (await opt.count().catch(() => 0)) {
    await opt.click({ timeout: 15000 });
  } else {
    // fallback por texto em qualquer lugar (dropdown custom)
    const opt2 = page.locator('text=/moderadamente\\s+ativo/i').first();
    await opt2.waitFor({ state: "visible", timeout: 15000 });
    await opt2.click({ timeout: 15000 });
  }

  // fecha/avança se tiver next
  const btn = await mfFindNextButton(page);
  if (btn && (await btn.count().catch(() => 0))) {
    await btn.click({ timeout: 15000 }).catch(async () => {
      try { await btn.evaluate((el: any) => (el as any).click()); } catch {}
    });
  }
}
'''.strip("\n")
    replace_function("mfSelectFAFModerado", mfSel)

# 4) reforçar mfAssertFAFPersisted: parse JSON e procura caminhos conhecidos + poll
if "async function mfAssertFAFPersisted" in s:
    # substitui por versão robusta (mantém nome)
    mfAssert = r'''
async function mfAssertFAFPersisted(page: any) {
  // Poll por até 12s porque persist pode ser debounced/hidratado.
  const deadline = Date.now() + 12000;

  function pick(obj: any, path: string): any {
    try {
      return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
    } catch { return undefined; }
  }

  while (Date.now() < deadline) {
    const payload = await page.evaluate(() => {
      const keys = [
        "mf:onboarding:draft:v1",
        "mf:onboarding:v1",
        "drmindsetfit_state",
        "mindsetfit:onboardingProgress:v1",
      ];
      const out: Record<string,string> = {};
      for (const k of keys) {
        try { out[k] = String(localStorage.getItem(k) ?? ""); } catch { out[k] = ""; }
      }
      return out;
    });

    const parsed: Record<string, any> = {};
    for (const [k,v] of Object.entries(payload)) {
      try { parsed[k] = v ? JSON.parse(v) : null; } catch { parsed[k] = v; }
    }

    // caminhos SSOT conhecidos no teu app (pela tua telemetria anterior)
    const candidates = [
      pick(parsed["mf:onboarding:draft:v1"], "step3.nivelAtividadeSemanal"),
      pick(parsed["mf:onboarding:v1"], "state.draft.step3.nivelAtividadeSemanal"),
      pick(parsed["mf:onboarding:v1"], "state.profile.nivelAtividadeSemanal"),
      pick(parsed["drmindsetfit_state"], "perfil.nivelAtividadeSemanal"),
      pick(parsed["mindsetfit:onboardingProgress:v1"], "data.nivelAtividadeSemanal"),
    ].filter(Boolean);

    const ok = candidates.some((x: any) => String(x).toLowerCase().includes("moderadamente_ativo"));
    if (ok) {
      console.log("✅ MF: FAF persistido OK:", candidates);
      return;
    }

    await page.waitForTimeout(300);
  }

  // falhou: dump forense curto
  const ls = await page.evaluate(() => {
    const keys = [
      "mf:onboarding:draft:v1",
      "mf:onboarding:v1",
      "drmindsetfit_state",
      "mindsetfit:onboardingProgress:v1",
    ];
    const out: Record<string,string> = {};
    for (const k of keys) {
      try { out[k] = String(localStorage.getItem(k) ?? ""); } catch { out[k] = ""; }
    }
    return out;
  });

  console.log("MF_PERSIST_FAIL_KEYS:", Object.keys(ls));
  for (const [k,v] of Object.entries(ls)) {
    console.log("MF_PERSIST_FAIL_SAMPLE:", k, (v || "").slice(0, 260));
  }
  throw new Error("MF: FAF NÃO persistiu no localStorage (esperado moderadamente_ativo em algum SSOT).");
}
'''.strip("\n")
    replace_function("mfAssertFAFPersisted", mfAssert)
else:
    # se não existir, cria antes do mfDebugOnFail
    insert_before("mfDebugOnFail", mfAssert)

# 5) No teste principal: garantir a sequência correta:
# - Step1 fill
# - avançar até FAF
# - selecionar FAF
# - assert persistência
# - best-effort report
# Procurar por mfSelectFAFModerado e garantir que antes tenha mfAdvanceUntilFAF
s = re.sub(
    r"(?m)^\s*// Step-2 FAF\s*\n\s*await mfSelectFAFModerado\(page\);\s*$",
    "    // FAF (não supõe step/URL): avança até mf-faf-select e então seleciona\n    await mfAdvanceUntilFAF(page);\n    await mfSelectFAFModerado(page);\n",
    s
)

# Se não tinha esse comentário, injeta antes de mfSelectFAFModerado(page)
s = re.sub(
    r"(?m)^\s*await mfSelectFAFModerado\(page\);\s*$",
    "    await mfAdvanceUntilFAF(page);\n    await mfSelectFAFModerado(page);\n",
    s
)

# garantir que exista chamada de persistência (se o patch anterior já colocou, mantém)
if "await mfAssertFAFPersisted(page);" not in s:
    s = re.sub(
      r"(?m)^\s*await mfTryOpenReportAndAssertLabel\(page\);\s*$",
      "    await mfAssertFAFPersisted(page);\n    await mfTryOpenReportAndAssertLabel(page);\n",
      s
    )

if s == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada (o arquivo pode ter mudado muito).")

p.write_text(s, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --workers=1

echo "==> [5] e2e (suite completa)"
npm run -s test:e2e

echo "==> [6] commit + push"
git add -A
git commit -m "test(e2e): reach FAF via mf-faf-select anchor, select Moderadamente ativo, poll SSOT JSON persistence" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
