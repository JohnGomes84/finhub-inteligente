#!/usr/bin/env bash
set -euo pipefail

# Smoke test básico após subir a aplicação localmente.
# Uso:
#   BASE_URL=http://localhost:3000 ./scripts/ops/smoke-check.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "[smoke] verificando ${BASE_URL}/health"
curl -fsS "${BASE_URL}/health" >/dev/null

echo "[smoke] verificando ${BASE_URL}/ready"
curl -fsS "${BASE_URL}/ready" >/dev/null

echo "[smoke] verificando ${BASE_URL}/metrics"
curl -fsS "${BASE_URL}/metrics" >/dev/null

echo "[smoke] ok"
