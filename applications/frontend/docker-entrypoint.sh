#!/bin/sh

# Runtime configuration script for frontend
# This script injects API URL into the built JavaScript at container startup

set -e

echo "Configuring frontend for runtime environment..."

# Default to using relative URLs (same origin) if not set
API_URL=${API_URL:-""}
WS_URL=${WS_URL:-""}

echo "API_URL: $API_URL"
echo "WS_URL: $WS_URL"

# Create a runtime config file
cat > /usr/share/nginx/html/config.js << EOF
window.RUNTIME_CONFIG = {
  API_URL: "${API_URL}",
  WS_URL: "${WS_URL}"
};
EOF

echo "Runtime configuration created"
echo "Starting nginx..."

# Start nginx
exec nginx -g 'daemon off;'
