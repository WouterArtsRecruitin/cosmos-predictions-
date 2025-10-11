#!/bin/bash

# 🚀 Cosmos Predictions - Quick Start Script
# Run: bash setup.sh

echo "🌌 Cosmos Predictions - Quick Setup"
echo "===================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) found"
echo ""

# Clean install
echo "📦 Installing dependencies..."
echo ""

# Remove old files
rm -rf node_modules package-lock.json .next

# Install dependencies
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    echo ""
    echo "Try manually:"
    echo "  npm install"
    echo "  npm install --legacy-peer-deps"
    exit 1
fi

echo ""
echo "✅ Dependencies installed!"
echo ""

# Check .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found!"
    echo ""
    echo "Creating from example..."
    cp .env.local.example .env.local
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your API key:"
    echo "   ANTHROPIC_API_KEY=sk-ant-your-key-here"
    echo ""
    read -p "Press Enter when you've added your API key..."
fi

echo ""
echo "✅ Environment configured!"
echo ""

# Start server
echo "🚀 Starting development server..."
echo ""
echo "   Visit: http://localhost:3000"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

npm run dev
