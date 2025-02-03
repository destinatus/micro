#!/bin/sh
# wait-for-it.sh

set -e

hostport="$1"
shift
cmd="$@"

# Split host and port
host=$(echo "$hostport" | cut -d: -f1)
port=$(echo "$hostport" | cut -d: -f2)

until nc -z "$host" "$port" 2>/dev/null; do
  echo "Waiting for $host:$port..."
  sleep 1
done

echo "$host:$port is available"
exec $cmd
