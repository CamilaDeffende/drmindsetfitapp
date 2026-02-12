#!/usr/bin/env bash
set -euo pipefail

echo "==> ensure branch"
git checkout feat/phases-6-11

echo "==> deps"
npm i @supabase/supabase-js

echo "==> env example"
cat > .env.example <<'EOF'
# Supabase (Auth + DB)
VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"

# Optional: dev override (if you want premium always on locally)
VITE_MF_DEV_PREMIUM="0"
EOF

echo "==> supabase client"
mkdir -p src/services/supabase
cat > src/services/supabase/client.ts <<'EOF'
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  console.warn("[MF_SUPABASE] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
  url ?? "http://localhost/mf-missing-supabase-url",
  anon ?? "mf-missing-supabase-anon",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
EOF

echo "==> verify (BUILD VERDE)"
npm run -s verify

echo "✅ done"
