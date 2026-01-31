const fs = require("fs");

const FILE = "src/pages/OnboardingFlow.tsx";
const s0 = fs.readFileSync(FILE, "utf8");
let s = s0;

// ensure import
if (!s.includes('from "@/lib/onboardingGuard"')) {
  const anchor = /import\s+\{\s*loadOnboardingProgress\s*,\s*saveOnboardingProgress\s*\}\s+from\s+["']@\/lib\/onboardingProgress["'];?\s*\n/;
  if (anchor.test(s)) {
    s = s.replace(anchor, (m) => m + 'import { guardOnboardingPath } from "@/lib/onboardingGuard";\n');
  } else {
    const fallback = /(import\s+.*from\s+["']react-router-dom["'];?\s*\n)/;
    if (fallback.test(s)) {
      s = s.replace(fallback, (m) => m + 'import { guardOnboardingPath } from "@/lib/onboardingGuard";\n');
    } else {
      throw new Error("Cannot find anchor to insert onboardingGuard import.");
    }
  }
}

// soften forced redirect block (allow back, only block jump forward)
const hardIf = /if\s*\(\s*path\.startsWith\(\s*["']\/onboarding["']\s*\)\s*&&\s*path\s*!==\s*desired\s*\)\s*\{\s*navigate\s*\(\s*desired\s*,\s*\{\s*replace:\s*true\s*\}\s*\)\s*;\s*\}/m;
if (hardIf.test(s)) {
  s = s.replace(hardIf, [
    'if (path.startsWith("/onboarding")) {',
    '        const req = path.match(/^\\/onboarding\\/step-(\\\\d+)\\b/);',
    '        const requested = req ? Number(req[1]) : null;',
    '        if (requested != null && Number.isFinite(requested) && requested > active + 1) {',
    '          navigate(desired, { replace: true });',
    '        }',
    '      }'
  ].join("\n"));
} else {
  // try alternate shape
  const loose = /const\s+desired\s*=\s*`\/onboarding\/step-\$\{active\s*\+\s*1\}`;[\s\S]*?if\s*\(\s*path\.startsWith\(\s*["']\/onboarding["']\s*\)\s*&&\s*path\s*!==\s*desired\s*\)\s*\{[\s\S]*?\}\s*/m;
  if (loose.test(s)) {
    s = s.replace(loose, [
      'const desired = `/onboarding/step-${active + 1}`;',
      '      if (path.startsWith("/onboarding")) {',
      '        const req = path.match(/^\\/onboarding\\/step-(\\\\d+)\\b/);',
      '        const requested = req ? Number(req[1]) : null;',
      '        if (requested != null && Number.isFinite(requested) && requested > active + 1) {',
      '          navigate(desired, { replace: true });',
      '        }',
      '      }'
    ].join("\n"));
  } else {
    throw new Error("Could not locate redirect block to soften in OnboardingFlow.tsx.");
  }
}

// replace /onboarding redirect with guardOnboardingPath
const onboardingIf = /if\s*\(\s*path\s*===\s*["']\/onboarding["']\s*\)\s*\{\s*navigate\s*\(\s*`\/onboarding\/step-\$\{step\}`\s*,\s*\{\s*replace:\s*true\s*\}\s*\)\s*;\s*\}/m;
if (onboardingIf.test(s)) {
  s = s.replace(onboardingIf, [
    'const redirect = guardOnboardingPath(path, step, isDone());',
    '      if (redirect && redirect !== path) {',
    '        navigate(redirect, { replace: true });',
    '      }'
  ].join("\n"));
} else {
  console.warn("⚠️ /onboarding redirect block not found; skipping that part.");
}

if (s === s0) {
  console.log("ℹ️ No changes applied (already patched?)");
} else {
  fs.writeFileSync(FILE, s, "utf8");
  console.log("✅ Patched:", FILE);
}
