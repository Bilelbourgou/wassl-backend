#!/bin/sh
set -e

# Run migrations if database is ready
echo "Running database migrations..."
npx prisma migrate deploy

# Run seeder
echo "Running database seeder..."
node dist/db/seed.js

# Start the application
echo "Starting application..."
exec "$@"
