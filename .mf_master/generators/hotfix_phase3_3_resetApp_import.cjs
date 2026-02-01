const fs = require("fs");

const FILE = "src/lib/resetApp.ts";
if (!fs.existsSync(FILE)) {
  console.log("ℹ️ resetApp.ts não encontrado — skip.");
  process.exit(0);
}

const importLine = `import { mfResetFromQuery } from "./mfreset";`;

let s0 = fs.readFileSync(FILE, "utf8");
let lines = s0.split(/\r?\n/);

// 1) remove our import line wherever it is (avoid duplicates)
lines = lines.filter(l => l.trim() !== importLine.trim());

// 2) find insertion point: after last complete import statement
let i = 0;
let insertAt = 0;

// skip shebang (rare) just in case
if (lines[0] && lines[0].startsWith("#!")) {
  i = 1;
  insertAt = 1;
}

let inImport = false;
for (; i < lines.length; i++) {
  const ln = lines[i];

  // detect start of import
  if (!inImport && /^\s*import\b/.test(ln)) {
    inImport = true;
  }

  if (inImport) {
    // end of import statement when we hit a semicolon (works for single/multi-line)
    if (ln.includes(";")) {
      inImport = false;
      insertAt = i + 1;
      continue;
    } else {
      // still inside multiline import
      continue;
    }
  } else {
    // not in import. keep moving insertAt only across other import statements.
    // once we leave the import zone, break if we already passed at least one import
    if (insertAt > 0) break;
    // if we haven't seen imports yet, keep insertAt at current i (top)
    insertAt = i + 1;
  }
}

// If file had no imports at all, insert after initial comments/blank lines.
if (insertAt === 0) {
  let j = 0;
  for (; j < lines.length; j++) {
    const t = lines[j].trim();
    if (!t) continue;
    if (t.startsWith("/*") || t.startsWith("*") || t.startsWith("//")) continue;
    break;
  }
  insertAt = j;
}

// 3) insert import, ensuring a blank line after imports block
lines.splice(insertAt, 0, importLine);

let s = lines.join("\n");

// Basic sanity: ensure exactly one importLine
const count = (s.match(new RegExp(importLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
if (count !== 1) {
  console.log("⚠️ Sanity: expected 1 import line, got:", count);
}

// Write only if changed
if (s !== s0) {
  fs.writeFileSync(FILE, s, "utf8");
  console.log("✅ Patched:", FILE);
} else {
  console.log("ℹ️ No changes applied.");
}
