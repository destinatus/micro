#!/bin/bash
set -e

# Function to wait for PostgreSQL
wait_for_postgres() {
    host="$1"
    port="$2"
    user="$3"
    db="$4"
    echo "Waiting for PostgreSQL to be ready..."
    until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$host" -p "$port" -U "$user" -d "$db" -c '\q'; do
        echo >&2 "PostgreSQL is unavailable - sleeping"
        sleep 2
    done
    echo "PostgreSQL is up and running on $host:$port"
}

# Wait for PostgreSQL to be ready
wait_for_postgres "$POSTGRES_HOST" "$POSTGRES_PORT" "$POSTGRES_USER" "$POSTGRES_DB"

# Run migrations
echo "Running database migrations..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /usr/src/app/migrations/create_user_table.sql

# Start the application
echo "Starting the application..."
exec "$@"
