#!/usr/bin/env bash
set -euo pipefail

# Restore seguro para MySQL.
# Uso:
#   DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=finhub DB_USER=finhub DB_PASSWORD=secret ./scripts/ops/restore-mysql.sh ./backups/finhub_20260330T120000Z.sql.gz

if [[ $# -lt 1 ]]; then
  echo "uso: $0 <arquivo.sql.gz|arquivo.sql>"
  exit 1
fi

INPUT_FILE="$1"

: "${DB_HOST:?DB_HOST obrigatório}"
: "${DB_PORT:?DB_PORT obrigatório}"
: "${DB_NAME:?DB_NAME obrigatório}"
: "${DB_USER:?DB_USER obrigatório}"
: "${DB_PASSWORD:?DB_PASSWORD obrigatório}"

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "arquivo não encontrado: $INPUT_FILE"
  exit 1
fi

echo "[restore] restaurando ${INPUT_FILE} em ${DB_NAME}"
if [[ "$INPUT_FILE" == *.gz ]]; then
  gzip -dc "$INPUT_FILE" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
else
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$INPUT_FILE"
fi

echo "[restore] concluído"
