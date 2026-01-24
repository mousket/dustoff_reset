#!/bin/bash
# =============================================================================
# Dustoff Reset - macOS Signed Build Script
# =============================================================================
# This script builds, signs, and notarizes the app for macOS distribution.
#
# PREREQUISITES:
# 1. Apple Developer account with "Developer ID Application" certificate
# 2. Certificate installed in Keychain Access
# 3. App-specific password created at https://appleid.apple.com
#
# ENVIRONMENT VARIABLES REQUIRED:
# - APPLE_SIGNING_IDENTITY: Your signing certificate name (see below)
# - APPLE_ID: gao.kabubi@gmail.com
# - APPLE_TEAM_ID: SMPLNQ29SK
# - APPLE_PASSWORD: Your app-specific password (NOT your Apple ID password)
#
# To find your signing identity, run:
#   security find-identity -v -p codesigning
# Look for "Developer ID Application: Your Name (TEAM_ID)"
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Dustoff Reset - Signed macOS Build${NC}"
echo -e "${GREEN}========================================${NC}"

# Check required environment variables
check_env() {
    local var_name=$1
    local var_value=${!var_name}
    if [ -z "$var_value" ]; then
        echo -e "${RED}ERROR: $var_name is not set${NC}"
        echo "Please set it with: export $var_name=value"
        return 1
    fi
    echo -e "${GREEN}✓${NC} $var_name is set"
    return 0
}

echo ""
echo "Checking environment variables..."
echo ""

MISSING_VARS=0
check_env "APPLE_SIGNING_IDENTITY" || MISSING_VARS=1
check_env "APPLE_ID" || MISSING_VARS=1
check_env "APPLE_TEAM_ID" || MISSING_VARS=1
check_env "APPLE_PASSWORD" || MISSING_VARS=1

if [ $MISSING_VARS -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}To set up signing, run these commands first:${NC}"
    echo ""
    echo '  # Find your signing identity:'
    echo '  security find-identity -v -p codesigning'
    echo ''
    echo '  # Then export the variables:'
    echo '  export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (SMPLNQ29SK)"'
    echo '  export APPLE_ID="gao.kabubi@gmail.com"'
    echo '  export APPLE_TEAM_ID="SMPLNQ29SK"'
    echo '  export APPLE_PASSWORD="your-app-specific-password"'
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}All environment variables set!${NC}"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Build the app with signing
echo -e "${YELLOW}Building and signing the app...${NC}"
echo ""

npm run tauri build -- \
    --bundles dmg \
    -- \
    --config "bundle.macOS.signingIdentity=\"$APPLE_SIGNING_IDENTITY\""

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo ""

# Find the built DMG
DMG_PATH=$(find src-tauri/target/release/bundle/dmg -name "*.dmg" | head -1)

if [ -z "$DMG_PATH" ]; then
    echo -e "${RED}ERROR: Could not find built DMG${NC}"
    exit 1
fi

echo -e "${GREEN}Built DMG:${NC} $DMG_PATH"
echo ""

# Notarize the app
echo -e "${YELLOW}Submitting for notarization...${NC}"
echo "(This may take several minutes)"
echo ""

xcrun notarytool submit "$DMG_PATH" \
    --apple-id "$APPLE_ID" \
    --team-id "$APPLE_TEAM_ID" \
    --password "$APPLE_PASSWORD" \
    --wait

echo ""
echo -e "${GREEN}Notarization complete!${NC}"
echo ""

# Staple the notarization ticket
echo -e "${YELLOW}Stapling notarization ticket...${NC}"
xcrun stapler staple "$DMG_PATH"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your signed and notarized DMG is at:"
echo -e "${GREEN}$DMG_PATH${NC}"
echo ""
echo "This DMG can be distributed to any Mac without"
echo "the 'damaged file' warning!"
echo ""
