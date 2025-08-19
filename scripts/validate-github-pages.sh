#!/bin/bash

# GitHub Pages Deployment Validation Script
# This script helps validate that GitHub Pages deployment will work correctly

echo "🌊 Ocean Adventure - GitHub Pages Deployment Validator"
echo "=================================================="

echo ""
echo "📋 Checking build configuration..."

# Check if Vite config has proper base path handling
if grep -q "process.env.VITE_BASE_PATH" vite.config.js; then
    echo "✅ Vite config supports dynamic base path"
else
    echo "❌ Vite config missing dynamic base path support"
fi

# Check if package.json has build script
if grep -q '"build"' package.json; then
    echo "✅ Build script found in package.json"
else
    echo "❌ Build script missing from package.json"
fi

echo ""
echo "🔧 Testing GitHub Pages build..."

# Clean and build for GitHub Pages
rm -rf dist
VITE_BASE_PATH=/3dgame/ npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "📁 Validating build output..."

# Check essential files exist
required_files=("index.html" "404.html" "favicon.ico" "manifest.webmanifest")
all_found=true

for file in "${required_files[@]}"; do
    if [ -f "dist/$file" ]; then
        echo "✅ $file found"
    else
        echo "❌ $file missing"
        all_found=false
    fi
done

# Check if paths are correctly prefixed
if grep -q '"/3dgame/' dist/index.html; then
    echo "✅ Asset paths correctly prefixed with /3dgame/"
else
    echo "❌ Asset paths not correctly prefixed"
    all_found=false
fi

# Check if assets directory exists
if [ -d "dist/assets" ]; then
    echo "✅ Assets directory exists"
    echo "   - $(ls dist/assets | wc -l) asset files found"
else
    echo "❌ Assets directory missing"
    all_found=false
fi

echo ""
if [ "$all_found" = true ]; then
    echo "🎉 Build validation passed! Ready for GitHub Pages deployment."
    echo ""
    echo "📋 Next steps for repository owner:"
    echo "   1. Go to Repository Settings > Pages"
    echo "   2. Set Source to 'GitHub Actions'"
    echo "   3. Save the settings"
    echo "   4. Push changes to main branch to trigger deployment"
    echo ""
    echo "🔗 Once deployed, the game will be available at:"
    echo "   https://commjoen.github.io/3dgame/"
else
    echo "❌ Build validation failed. Please fix the issues above."
    exit 1
fi

echo ""
echo "🐳 Alternative: Container deployment is also available!"
echo "   docker run -p 8080:80 ghcr.io/commjoen/3dgame:latest"