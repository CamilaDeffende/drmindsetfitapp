/**
 * mf_pdf_smoke_v4_runner.js
 * Wrapper ESM: lê flags/args, exporta envs e executa o runner V1 via import().
 * NÃO altera o runner V1. Mantém V2 estável.
 */

/* MF_RUNNER_V4_WRAPPER_V1 */
function hasFlag(name) {
  try { return (process.argv || []).includes(name); } catch { return false; }
}
function argValue(name, fallback = null) {
  try {
    const a = process.argv || [];
    const i = a.indexOf(name);
    if (i >= 0 && i + 1 < a.length) return a[i + 1];
  } catch {}
  return fallback;
}

if (hasFlag("--dumpOnFail")) process.env.MF_PDF_DUMP_ON_FAIL = "1";
if (hasFlag("--strict")) process.env.MF_PDF_STRICT = "1";

const t = Number(argValue("--timeoutMs", ""));
if (Number.isFinite(t) && t > 0) process.env.MF_PDF_TIMEOUT_MS = String(t);

// executa o runner V1 (ele já tem toda a lógica e escreve OUT/results)
const url = new URL("./mf_pdf_smoke_v1_runner.js", import.meta.url);
await import(url.href);
