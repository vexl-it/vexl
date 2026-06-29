#!/bin/sh
# Creates one database per service (spec §5.1). Runs only when the Postgres data
# volume is empty (first boot). Keep this list in sync with `dbNames` in
# dev.config.ts: user, contact, offer, chat, content, feedback, metrics,
# notification, backoffice.
set -e

DATABASES="user contact offer chat content feedback metrics notification backoffice"

for db in $DATABASES; do
  exists="$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname = '$db'")"
  if [ "$exists" = "1" ]; then
    echo "postgres-init: database '$db' already exists"
  else
    echo "postgres-init: creating database '$db'"
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE DATABASE \"$db\""
  fi
done

echo "postgres-init: done"
