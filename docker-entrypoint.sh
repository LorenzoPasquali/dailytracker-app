#!/bin/sh
set -e

# Replace the build-time placeholder with the runtime VITE_API_URL value in the
# generated JS bundles. This lets a single image point at any backend by simply
# setting VITE_API_URL on the server (docker run -e / compose / .env).
: "${VITE_API_URL:=http://localhost:3000}"

echo "[entrypoint] Injecting VITE_API_URL=${VITE_API_URL} into static assets"

find /usr/share/nginx/html/assets -type f -name '*.js' -exec \
  sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" {} +
