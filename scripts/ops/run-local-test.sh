#!/usr/bin/env bash
set -euo pipefail

# Sobe o app localmente, valida endpoints básicos e encerra.
# Uso:
#   PORT=3000 ./scripts/ops/run-local-test.sh

PORT="${PORT:-3000}"
HOST="${HOST:-127.0.0.1}"
BASE_URL="${BASE_URL:-http://${HOST}:${PORT}}"
LOG_FILE="/tmp/finhub-local-test.log"

echo "[local-test] iniciando aplicação em ${BASE_URL}..."
PORT="$PORT" SERVER_HOST="$HOST" pnpm run dev >"$LOG_FILE" 2>&1 &
APP_PID=$!

cleanup() {
  if ps -p "$APP_PID" >/dev/null 2>&1; then
    kill "$APP_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "[local-test] aguardando servidor subir..."
for _ in {1..40}; do
  if curl -fsS "${BASE_URL}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "${BASE_URL}/health" >/dev/null 2>&1; then
  echo "[local-test] ERRO: servidor não respondeu em ${BASE_URL}/health"
  echo "----- LOG -----"
  cat "$LOG_FILE"
  exit 1
fi

echo "[local-test] executando smoke check..."
BASE_URL="$BASE_URL" bash ./scripts/ops/smoke-check.sh

echo "[local-test] aplicação validada para teste manual."
