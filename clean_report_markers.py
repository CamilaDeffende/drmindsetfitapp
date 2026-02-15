from pathlib import Path
import re

p = Path("src/pages/Report.tsx")
s = p.read_text(encoding="utf-8")
orig = s

# Remove markers MF_REPORT_
s = re.sub(r"(?m)^\s*//\s*MF_REPORT_[A-Z0-9_]+.*$\n?", "", s)
s = re.sub(r"(?m)^\s*\{\s*/\*\s*MF_REPORT_[A-Z0-9_]+.*?\*/\s*\}\s*$\n?", "", s)

# Remove __MF_REPORT_*__
s = re.sub(r"(?m)^\s*//\s*__MF_REPORT_[A-Z0-9_]+__\s*$\n?", "", s)

# Remove console.warn MF_REPORT_DEBUG
s = re.sub(r'(?m)^\s*console\.warn\(\s*["\']MF_REPORT_DEBUG:.*?;\s*$', "", s)

# Remove eslint-disable no-console
s = re.sub(r"(?m)^\s*//\s*eslint-disable-next-line\s+no-console\s*$\n?", "", s)

s = re.sub(r"\n{3,}", "\n\n", s)

if s != orig:
    p.write_text(s, encoding="utf-8")
    print("✅ Report.tsx cleaned")
else:
    print("ℹ️ Nenhuma mudança aplicada")
