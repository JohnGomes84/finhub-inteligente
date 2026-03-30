#!/usr/bin/env bash
set -euo pipefail

# Pré-flight de deploy para reduzir risco operacional.
# Uso:
#   ./scripts/ops/pre-deploy-check.sh

REQUIRED_VARS=(DATABASE_URL DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD)

echo "[predeploy] validando variáveis obrigatórias..."
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "[predeploy] ERRO: variável obrigatória ausente: $var"
    exit 1
  fi
done

echo "[predeploy] executando type check..."
pnpm run check

echo "[predeploy] executando testes..."
pnpm run test

echo "[predeploy] validando scripts de contingência..."
[[ -x "./scripts/ops/backup-mysql.sh" ]] || { echo "script backup ausente ou sem permissão"; exit 1; }
[[ -x "./scripts/ops/restore-mysql.sh" ]] || { echo "script restore ausente ou sem permissão"; exit 1; }

echo "[predeploy] ok para seguir com deploy (sujeito à aprovação formal)."
