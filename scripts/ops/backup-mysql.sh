#!/usr/bin/env bash
set -euo pipefail

# Backup seguro para MySQL com gzip.
# Uso:
#   DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=finhub DB_USER=finhub DB_PASSWORD=secret ./scripts/ops/backup-mysql.sh

: "${DB_HOST:?DB_HOST obrigatório}"
: "${DB_PORT:?DB_PORT obrigatório}"
: "${DB_NAME:?DB_NAME obrigatório}"
: "${DB_USER:?DB_USER obrigatório}"
: "${DB_PASSWORD:?DB_PASSWORD obrigatório}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] iniciando dump de ${DB_NAME} em ${OUTPUT_FILE}"
mysqldump \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  "$DB_NAME" | gzip > "$OUTPUT_FILE"

echo "[backup] concluído: ${OUTPUT_FILE}"
