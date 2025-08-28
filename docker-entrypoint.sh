#!/bin/bash

# Use VITE_GITHUB_TOKEN if set, otherwise fallback to GITHUB_TOKEN
GITHUB_TOKEN_VALUE=${VITE_GITHUB_TOKEN:-${GITHUB_TOKEN}}

if [ -z "$GITHUB_TOKEN_VALUE" ]; then
    echo "❌ Warning: No GitHub token found. Set either VITE_GITHUB_TOKEN or GITHUB_TOKEN environment variable."
    exit 1
fi

echo "🔧 Setting up GitHub token in built files..."
echo "📊 Using token: ${GITHUB_TOKEN_VALUE:0:20}..." # Only show first 20 chars for security

# Replace any existing GitHub tokens (ghp_*) with the new token
echo "🔄 Replacing GitHub tokens in JavaScript files..."
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|ghp_[A-Za-z0-9_]*|${GITHUB_TOKEN_VALUE}|g" {} \;

# Replace common Vite environment patterns
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|import\.meta\.env\.VITE_GITHUB_TOKEN|\"${GITHUB_TOKEN_VALUE}\"|g" {} \;

# Replace any VITE_GITHUB_TOKEN= patterns
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|VITE_GITHUB_TOKEN=[^\"']*|VITE_GITHUB_TOKEN=${GITHUB_TOKEN_VALUE}|g" {} \;

# Verify replacement worked
TOKEN_COUNT=$(find /usr/share/nginx/html -type f -name "*.js" -exec grep -c "${GITHUB_TOKEN_VALUE}" {} \; | awk '{sum+=$1} END {print sum}')
echo "✅ Token replacement completed. Found ${TOKEN_COUNT} occurrences of new token."

# Start nginx
echo "🚀 Starting nginx..."
exec "$@"