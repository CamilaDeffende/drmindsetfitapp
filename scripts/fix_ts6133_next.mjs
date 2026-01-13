import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function p(rel){ return path.join(ROOT, rel); }
function exists(rel){ return fs.existsSync(p(rel)); }
function read(rel){ return fs.readFileSync(p(rel), "utf8"); }
function write(rel, s){
  fs.mkdirSync(path.dirname(p(rel)), { recursive: true });
  fs.writeFileSync(p(rel), s, "utf8");
}
function patchFile(rel, fn){
  if(!exists(rel)) return { changed:false, reason:"missing" };
  const before = read(rel);
  const after = fn(before);
  if(after !== before){
    write(rel, after);
    return { changed:true };
  }
  return { changed:false };
}

let changed = 0;

// (A) Assinatura.tsx: remover default React import (TS6133)
const assinatura = "src/pages/Assinatura.tsx";
{
  const r = patchFile(assinatura, (s) => {
    // import React, { ... } -> import { ... }
    s = s.replace(/^import\s+React\s*,\s*\{\s*([^}]+)\s*\}\s+from\s+["']react["'];\s*$/m, 'import { $1 } from "react";');
    return s;
  });
  if (r.changed) { console.log("✅ Patched:", assinatura); changed++; }
  else console.log("ℹ️ No change:", assinatura);
}

// (B) mindestfitPdf.ts: usar coverTitleUsed/coverSubtitleUsed sem efeito colateral
const pdf = "src/lib/pdf/mindsetfitPdf.ts";
{
  const r = patchFile(pdf, (s) => {
    // depois das duas const, injeta void para marcar como usado
    const re = /(const\s+coverTitleUsed\s*=\s*[^\n]*\n\s*const\s+coverSubtitleUsed\s*=\s*[^\n]*\n)/m;
    if (re.test(s) && !s.includes("void coverTitleUsed")) {
      s = s.replace(re, (m) => m + `  void coverTitleUsed;\n  void coverSubtitleUsed;\n`);
    }
    return s;
  });
  if (r.changed) { console.log("✅ Patched:", pdf); changed++; }
  else console.log("ℹ️ No change:", pdf);
}

console.log(`\n==> TS6133 FIX DONE ✅ | alterações: ${changed}\n`);
