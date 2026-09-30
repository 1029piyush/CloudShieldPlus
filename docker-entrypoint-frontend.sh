#!/bin/sh
# Replace $backend_url placeholder in nginx config with BACKEND_URL env var
# Falls back to http://backend:5000 for local docker-compose
BACKEND_URL="${BACKEND_URL:-http://backend:5000}"

# Use sed to replace the set $backend_url line with the actual value
sed -i "s|set \$backend_url \"http://backend:5000\";|set \$backend_url \"${BACKEND_URL}\";|g" /etc/nginx/conf.d/default.conf

echo "Frontend starting with BACKEND_URL: ${BACKEND_URL}"

# Start nginx in foreground
exec nginx -g "daemon off;"