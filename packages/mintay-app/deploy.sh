#!/bin/bash

# Deploy script for Mintay App
# This script builds the app locally and deploys to Vercel

set -e

echo "🏗️  Building Mintay App locally..."

# Build the application
npm run build

echo "✅ Build completed successfully!"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found after build"
    exit 1
fi

echo "📦 Dist directory contents:"
ls -la dist/

echo "🚀 Deploying to Vercel..."

# Deploy to Vercel
# Use --prod flag for production deployment
# Use --yes to skip confirmation prompts
vercel --prod --yes

echo "✅ Deployment completed!"
echo "🌐 Your app should now be live on Vercel"
