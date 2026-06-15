#!/bin/sh
set -e

echo "Running Prisma migrations..."
bunx prisma migrate deploy

echo "Seeding test player wallet..."
bunx prisma db seed

exec "$@"
