#!/usr/bin/env bash
set -euo pipefail

# Deploy genérico executado via CI/CD.
# Requer DEPLOY_COMMAND com comando idempotente de publicação (ssh/rsync/kubectl/etc).
# Exemplo:
#   DEPLOY_COMMAND="ssh deploy@host 'cd /srv/app && git pull && docker compose up -d --build'" bash ./scripts/ops/deploy.sh

if [[ -z "${DEPLOY_COMMAND:-}" ]]; then
  echo "[deploy] ERRO: DEPLOY_COMMAND não configurado."
  echo "[deploy] Defina secrets DEPLOY_COMMAND_HML / DEPLOY_COMMAND_PROD no GitHub."
  exit 1
fi

echo "[deploy] iniciando deploy..."
bash -lc "$DEPLOY_COMMAND"
echo "[deploy] deploy concluído com sucesso."
