#!/usr/bin/env bash
# Восстановление базы данных из резервной копии
# Использование: bash docker/restore.sh backups/sto_db_20260514_120000.sql

set -euo pipefail

FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "Использование: $0 <путь_к_файлу.sql>"
  exit 1
fi

if [[ ! -f "$FILE" ]]; then
  echo "Файл не найден: $FILE"
  exit 1
fi

echo "[restore] Восстанавливаю из $FILE..."
docker compose exec -T db psql \
  -U "${DB_USER:-sto_user}" \
  -d "${DB_NAME:-sto_db}" \
  < "$FILE"

echo "[restore] Готово."
