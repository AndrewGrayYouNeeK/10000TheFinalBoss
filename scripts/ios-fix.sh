#!/usr/bin/env bash
# Recover Xcode + CocoaPods + Capacitor iOS build (Xcode 26).
set -euo pipefail
cd "$(dirname "$0")/.."

IOS_DIR="ios/App"
SIMULATOR_ID="${IOS_SIMULATOR:-6DF39480-7916-493B-BA4B-D589206AE8FC}"

echo "→ Quit Xcode if it is open (avoids cache corruption)…"
osascript -e 'tell application "Xcode" to quit' 2>/dev/null || true
sleep 1

echo "→ Clearing DerivedData, module cache, and local Xcode user state…"
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*
rm -rf ~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex
rm -rf "$IOS_DIR/App.xcworkspace/xcuserdata"
rm -rf "$IOS_DIR/App.xcodeproj/xcuserdata"
rm -rf "$IOS_DIR/App.xcodeproj/project.xcworkspace/xcuserdata"

echo "→ Installing CocoaPods…"
cd "$IOS_DIR"
pod install
cd ../..

echo "→ Syncing Capacitor web assets…"
npm run ios:sync

echo "→ Pre-building from CLI (Capacitor frameworks before Xcode opens)…"
xcodebuild \
  -workspace "$IOS_DIR/App.xcworkspace" \
  -scheme App \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,id=$SIMULATOR_ID" \
  -quiet \
  build

echo ""
echo "✓ Done. Opening App.xcworkspace (never App.xcodeproj)"
open "$IOS_DIR/App.xcworkspace"
