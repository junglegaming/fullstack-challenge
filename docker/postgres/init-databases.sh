#!/bin/bash
set -e

# Creates additional databases from POSTGRES_EXTRA_DATABASES (comma-separated).
# The default database (POSTGRES_DB) is created automatically by the official image.
# Example: POSTGRES_EXTRA_DATABASES=games,wallets

if [ -n "$POSTGRES_EXTRA_DATABASES" ]; then
  IFS=',' read -ra DATABASES <<< "$POSTGRES_EXTRA_DATABASES"
  for db in "${DATABASES[@]}"; do
    db=$(echo "$db" | xargs) # trim whitespace
    echo "Creating database: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
      SELECT 'CREATE DATABASE "$db"'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
    echo "Database '$db' created (or already exists)."
  done
fi
