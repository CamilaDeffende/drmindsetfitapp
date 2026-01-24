import fs from "fs";

const file = process.env.FILE;
if (!file) throw new Error("FILE env missing");
let s = fs.readFileSync(file, "utf8");
const before = s;

const lines = s.split("\\n");
const idx = 224; // line 225 (0-based)
if (idx < lines.length) {
  let line = lines[idx];

  // Fix mais provável: ...divisao.tipo (divisao pode ser undefined)
  // -> ...divisao?.tipo ?? "—"
  if (line.includes(".divisao.tipo")) {
    line = line.replace(/\\.divisao\\.tipo/g, ".divisao?.tipo ?? \"—\"");
  }

  // Fallback geral: qualquer ".tipo" nessa linha vira "?.tipo ?? —" (apenas se ainda não estiver seguro)
  // Ex.: x.tipo -> x?.tipo ?? "—"
  if (line.includes(".tipo") && !line.includes("?.tipo")) {
    line = line.replace(/\\.tipo/g, "?.tipo ?? \"—\"");
  }

  lines[idx] = line;
}

s = lines.join("\\n");

// Segurança extra: evita crash em outros pontos do arquivo com padrão comum "...divisao.tipo"
s = s.replace(/\\.divisao\\.tipo/g, ".divisao?.tipo ?? \"—\"");

// Não mexe onde já está com optional chaining
s = s.replace(/([^?])\\.tipo\\b/g, (_m, p1) => `${p1}?.tipo ?? "—"`);

// Corrige possíveis duplicações acidentais do replace acima (caso raro)
s = s.replace(/\\?\\.\\?\\.tipo\\s*\\?\\?\\s*\"—\"/g, "?.tipo ?? \"—\"");

if (s === before) {
  console.log("ℹ️ Nenhuma alteração aplicada (talvez já esteja seguro).");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Fix aplicado: acesso a .tipo agora é safe (no-crash).");
}
