#!/usr/bin/env bash
# Fix "Capacitor / CapacitorCordova search path not found" in Xcode.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Cleaning stale Xcode DerivedData for App…"
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*

echo "→ Installing CocoaPods (patches Xcode 26 Metal toolchain Swift paths)…"
cd ios/App
pod install
cd ../..

echo "→ Syncing Capacitor web assets…"
npm run ios:sync

echo ""
echo "✓ Done. Opening App.xcworkspace (required — do NOT open App.xcodeproj)"
open ios/App/App.xcworkspace
