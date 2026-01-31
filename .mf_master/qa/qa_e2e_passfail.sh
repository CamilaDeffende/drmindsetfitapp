#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

ts="$(date +%Y%m%d_%H%M%S)"
OUT=".mf_master/qa/e2e_report_${ts}.md"
RUNLOG=".mf_master/qa/e2e_run_${ts}.log"

exec > >(tee -a "$RUNLOG") 2>&1

lower() { echo "$1" | tr "[:upper:]" "[:lower:]"; }

ask () {
  label="$1"
  echo
  echo "------------------------------"
  echo "🧪 $label"
  echo "------------------------------"

  while true; do
    printf "Resultado (P=pass / F=fail): "
    IFS= read -r ans || ans=""
    ans="$(lower "$ans")"
    case "$ans" in
      p|pass) res="PASS"; break;;
      f|fail) res="FAIL"; break;;
      *) echo "Digite P ou F.";;
    esac
  done

  printf "Observação curta (opcional): "
  IFS= read -r notes || notes=""

  echo "| $label | $res | ${notes} |" >> "$OUT"

  if [ "$res" = "FAIL" ]; then
    echo
    echo "🚫 FAIL detectado em: $label"
    echo "Relatório parcial: $OUT"
    exit 2
  fi
}

echo "# QA E2E Report — DrMindSetFitApp" > "$OUT"
echo "" >> "$OUT"
echo "- Data/hora: $(date)" >> "$OUT"
echo "- Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)" >> "$OUT"
echo "- Runlog: $RUNLOG" >> "$OUT"
echo "" >> "$OUT"
echo "## Resultado por etapa" >> "$OUT"
echo "" >> "$OUT"
echo "| Etapa | Resultado | Observação |" >> "$OUT"
echo "|---|---|---|" >> "$OUT"

echo
echo "Abra o app em http://localhost:8080"
echo "Se precisar subir: ./.mf_master/bin/mfdev (em outro terminal)"
echo

ask "0 | Preparar ambiente (app em 8080 + DevTools aberto)"
ask "1 | Login (/login → /dashboard sem erro)"
ask "2 | Dashboard (empty state / botões ok)"
ask "3 | Reset onboarding (volta Step1 ao iniciar)"
ask "4 | Step1 → Step2 (avança + refresh preserva)"
ask "5 | Step2 → Step3 (PAL/biotipo canônico + warning coerente)"
ask "6 | Step3 → Step4 (gerarPlanejamento obrigatório + persistência)"
ask "7 | Step4 → Step5 (sem pulo/sem estado vazio)"
ask "8 | Step5 → Step8 (back/forward + refresh ok)"
ask "9 | Final Step8 → Dashboard (redireciona + plano visível)"

echo "" >> "$OUT"
echo "## Pós-check (sanity)" >> "$OUT"
echo "" >> "$OUT"
echo "### git status -sb" >> "$OUT"
echo  >> "$OUT"

echo "" >> "$OUT"
echo "### mf_doctor (garantia BUILD VERDE)" >> "$OUT"
echo  >> "$OUT"

echo
echo "✅ QA completo."
echo "Relatório: $OUT"
