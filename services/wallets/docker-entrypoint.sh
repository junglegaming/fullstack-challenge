#!/bin/sh
set -e

echo "Running Prisma migrations..."
bunx prisma migrate deploy

exec "$@"
