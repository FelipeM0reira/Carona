#!/bin/bash
set -e

echo "📦 Installing Supabase CLI..."
npm install -g supabase@latest

echo "📦 Installing project dependencies..."
npm install

echo "🔧 Fixing Expo dependency versions..."
npx expo install --fix

echo ""
echo "✅ Dev environment ready!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and fill in your Supabase keys"
echo "  2. Run 'npm run supabase:start' to start local Supabase"
echo "  3. Run 'npm run web' to start Expo for web (PWA)"
