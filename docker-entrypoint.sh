#!/bin/bash

# Replace environment variables in JavaScript files
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|VITE_GITHUB_TOKEN=.*|VITE_GITHUB_TOKEN=${GITHUB_TOKEN}|g" {} +

# Start nginx
exec "$@"