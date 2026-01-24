import fs from "fs";

const file = process.env.FILE;
if (!file) throw new Error("FILE env missing");

let s = fs.readFileSync(file, "utf8");
const before = s;

// 1) padrões comuns (mais seguros)
s = s
  .replace(/\.divisao\.tipo\b/g, '.divisao?.tipo ?? "—"')
  .replace(/\.periodizacao\.tipo\b/g, '.periodizacao?.tipo ?? "—"')
  .replace(/\.protocolo\.tipo\b/g, '.protocolo?.tipo ?? "—"')
  .replace(/\.plano\.tipo\b/g, '.plano?.tipo ?? "—"')
  .replace(/\.treino\.tipo\b/g, '.treino?.tipo ?? "—"');

// 2) Hardfix geral: cadeias com pelo menos 1 ponto antes do .tipo
// Ex.: a.b.tipo, x.y.z.tipo, arr[i].x.tipo
// Não mexe se já tiver optional chaining (?.tipo)
const chainTipo = /([A-Za-z0-9_\]\)\}]+(?:\.[A-Za-z0-9_\]\)\}]+)+)\.tipo\b/g;
s = s.replace(chainTipo, (m, chain) => {
  if (m.includes("?.tipo") || chain.includes("?.") || chain.includes("??")) return m;
  return `${chain}?.tipo ?? "—"`;
});

// 3) limpa duplicações caso já exista fallback
s = s.replace(/\?\.\s*tipo\s*\?\?\s*"—"\s*\?\?\s*"—"/g, '?.tipo ?? "—"');

if (s === before) {
  console.log("ℹ️ Nenhuma alteração aplicada (talvez já esteja harden).");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Hardfix aplicado: acessos .tipo agora são safe (?.tipo ?? \"—\").");
}
