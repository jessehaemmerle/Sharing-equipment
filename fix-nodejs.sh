#!/bin/bash

# Quick Fix Script for Node.js Version Issue
# This script ensures all Dockerfiles use Node.js 20

echo "🔧 Fixing Node.js version compatibility..."

# Update all Dockerfiles to use Node.js 20
find . -name "Dockerfile*" -type f -exec sed -i 's/node:18-alpine/node:20-alpine/g' {} \;

echo "✅ Updated all Dockerfiles to use Node.js 20"

# Check if the system has Node.js 20+ for local development
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo "⚠️  Warning: Your local Node.js version is $NODE_VERSION, but the app requires Node.js 20+"
        echo "   For local development, please update Node.js to version 20 or higher"
        echo "   Docker deployment will use Node.js 20 automatically"
    else
        echo "✅ Local Node.js version is compatible: $(node --version)"
    fi
else
    echo "ℹ️  Node.js not found locally (Docker deployment will work fine)"
fi

echo "🚀 Node.js compatibility issues resolved!"
echo "   You can now run ./deploy-vps.sh successfully"