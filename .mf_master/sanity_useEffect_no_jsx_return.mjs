import fs from "fs";
import path from "path";
import ts from "typescript";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function walk(dir, out=[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(ent.name) && !/\.d\.ts$/.test(ent.name)) out.push(p);
  }
  return out;
}

function isJSXLike(node) {
  if (!node) return false;
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return true;
  if (ts.isParenthesizedExpression(node)) return isJSXLike(node.expression);
  return false;
}

function scanFile(file) {
  const code = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const issues = [];

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isUseEffect =
        (ts.isIdentifier(callee) && callee.text === "useEffect") ||
        (ts.isPropertyAccessExpression(callee) && callee.name.text === "useEffect");

      if (isUseEffect && node.arguments.length) {
        const arg0 = node.arguments[0];
        if (ts.isArrowFunction(arg0) || ts.isFunctionExpression(arg0)) {
          const effectFn = arg0;

          function scanEffectBody(n) {
            if ((ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n)) && n !== effectFn) return;

            if (ts.isReturnStatement(n) && n.expression && isJSXLike(n.expression)) {
              const { line, character } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
              issues.push({
                file,
                line: line + 1,
                col: character + 1,
                msg: "❌ useEffect retornando JSX (inválido). useEffect só pode retornar cleanup: () => void"
              });
            }
            ts.forEachChild(n, scanEffectBody);
          }

          if (effectFn.body) scanEffectBody(effectFn.body);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  return issues;
}

if (!fs.existsSync(SRC)) {
  console.error("❌ Pasta src/ não encontrada.");
  process.exit(2);
}

const files = walk(SRC);
let all = [];
for (const f of files) all = all.concat(scanFile(f));

for (const it of all) {
  console.log(`${it.msg}\n  -> ${path.relative(ROOT, it.file)}:${it.line}:${it.col}`);
}

const hard = all.filter(x => x.msg.startsWith("❌"));
if (hard.length) {
  console.error(`\n❌ SANITY FAIL: encontrei ${hard.length} retorno(s) de JSX dentro de useEffect.`);
  process.exit(1);
}

console.log(`\n✅ SANITY OK: nenhum return JSX dentro de useEffect.`);
