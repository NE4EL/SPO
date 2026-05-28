#!/usr/bin/env bash
# Резервное копирование базы данных PostgreSQL
# Использование: bash docker/backup.sh

set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/sto_db_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "[backup] Создаю дамп базы данных..."
docker compose exec -T db pg_dump \
  -U "${DB_USER:-sto_user}" \
  -d "${DB_NAME:-sto_db}" \
  --no-owner \
  --no-acl \
  > "$FILE"

echo "[backup] Готово: $FILE"
echo "[backup] Размер: $(du -sh "$FILE" | cut -f1)"
