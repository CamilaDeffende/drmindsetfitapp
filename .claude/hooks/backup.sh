#!/bin/bash
# Hook Stop - Backup automatico apos Claude terminar
# Le config de /workspace/.lasy/config.json

set -e

CONFIG_FILE="/workspace/.lasy/config.json"

# Verificar se arquivo de config existe
if [ ! -f "$CONFIG_FILE" ]; then
  echo "[backup-hook] Config file not found: $CONFIG_FILE" >&2
  exit 0
fi

# Verificar se jq esta disponivel
if ! command -v jq &> /dev/null; then
  echo "[backup-hook] jq not found, skipping backup" >&2
  exit 0
fi

# Extrair dados do config
PROJECT_ID=$(jq -r '.projectId // empty' "$CONFIG_FILE")
SESSION_ID=$(jq -r '.sessionId // empty' "$CONFIG_FILE")
BACKUP_URL=$(jq -r '.backupUrl // "https://lasy.app"' "$CONFIG_FILE")
API_KEY=$(jq -r '.apiKey // empty' "$CONFIG_FILE")

# Validar campos obrigatorios
if [ -z "$PROJECT_ID" ]; then
  echo "[backup-hook] Missing projectId in config" >&2
  exit 0
fi

if [ -z "$SESSION_ID" ]; then
  echo "[backup-hook] Missing sessionId in config" >&2
  exit 0
fi

echo "[backup-hook] Starting backup for project: $PROJECT_ID, session: $SESSION_ID"

# Chamar endpoint de backup no Worker
RESPONSE=$(curl -s -X POST "${BACKUP_URL}/sandbox/backup-hook" \
  -H "Content-Type: application/json" \
  -H "X-Sandbox-API-Key: ${API_KEY}" \
  -d "{\"projectId\": \"$PROJECT_ID\", \"sessionId\": \"$SESSION_ID\"}" \
  --max-time 120 2>&1) || {
    echo "[backup-hook] curl failed: $RESPONSE" >&2
    exit 0
  }

# Verificar sucesso
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false' 2>/dev/null || echo "false")

if [ "$SUCCESS" = "true" ]; then
  VERSION=$(echo "$RESPONSE" | jq -r '.versionBackup // "unknown"' 2>/dev/null || echo "unknown")
  echo "[backup-hook] Backup created: $VERSION"
  exit 0
else
  ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"' 2>/dev/null || echo "$RESPONSE")
  echo "[backup-hook] Backup failed: $ERROR" >&2
  exit 0
fi