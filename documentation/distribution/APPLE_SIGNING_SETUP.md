# Apple Code Signing Setup for Dustoff Reset

This guide walks through setting up Apple code signing and notarization so the app can be distributed without the "damaged file" warning.

## Prerequisites

- **Apple Developer Account** ($99/year) - [developer.apple.com](https://developer.apple.com)
- **macOS** with Xcode Command Line Tools installed
- **Team ID**: `SMPLNQ29SK`
- **Apple ID**: `gao.kabubi@gmail.com`

---

## Step 1: Create a Developer ID Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Sign in with the Apple ID: `gao.kabubi@gmail.com`
3. Navigate to **Certificates, Identifiers & Profiles**
4. Click **Certificates** → **+** (Create a New Certificate)
5. Select **Developer ID Application** (for distributing outside App Store)
6. Follow the instructions to create a Certificate Signing Request (CSR):
   - Open **Keychain Access** on Mac
   - Menu: **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
   - Enter email: `gao.kabubi@gmail.com`
   - Select "Saved to disk"
   - Save the `.certSigningRequest` file
7. Upload the CSR to Apple Developer Portal
8. Download the certificate (`.cer` file)
9. Double-click the downloaded certificate to install it in Keychain

---

## Step 2: Verify Certificate Installation

Open Terminal and run:

```bash
security find-identity -v -p codesigning
```

You should see something like:

```
1) ABC123... "Developer ID Application: Gao Kabubi (SMPLNQ29SK)"
```

**Copy the full identity name** (e.g., `Developer ID Application: Gao Kabubi (SMPLNQ29SK)`) - you'll need it for signing.

---

## Step 3: Create an App-Specific Password

Apple requires an app-specific password for notarization (NOT your Apple ID password).

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with `gao.kabubi@gmail.com`
3. Go to **Sign-In and Security** → **App-Specific Passwords**
4. Click **Generate an app-specific password**
5. Name it: `dustoff-reset-notarization`
6. **Save this password securely** - you'll only see it once!

---

## Step 4: Set Environment Variables

Before building, set these environment variables in your terminal:

```bash
# Your signing identity (from Step 2)
export APPLE_SIGNING_IDENTITY="Developer ID Application: Gao Kabubi (SMPLNQ29SK)"

# Apple ID for notarization
export APPLE_ID="gao.kabubi@gmail.com"

# Team ID
export APPLE_TEAM_ID="SMPLNQ29SK"

# App-specific password (from Step 3)
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
```

**TIP**: Add these to your `~/.zshrc` or `~/.bash_profile` to persist them:

```bash
echo 'export APPLE_SIGNING_IDENTITY="Developer ID Application: Gao Kabubi (SMPLNQ29SK)"' >> ~/.zshrc
echo 'export APPLE_ID="gao.kabubi@gmail.com"' >> ~/.zshrc
echo 'export APPLE_TEAM_ID="SMPLNQ29SK"' >> ~/.zshrc
echo 'export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 5: Build the Signed App

Run the build script:

```bash
./scripts/build-macos-signed.sh
```

This will:
1. ✅ Build the app
2. ✅ Sign it with your Developer ID certificate
3. ✅ Submit to Apple for notarization (takes 2-10 minutes)
4. ✅ Staple the notarization ticket to the DMG

The final DMG will be at:
```
src-tauri/target/release/bundle/dmg/Dustoff Reset_0.1.0_aarch64.dmg
```

---

## Step 6: Distribute!

The signed and notarized DMG can now be:
- Sent directly to users
- Uploaded to your website
- Distributed via any method

Users will **NOT** see the "damaged file" or "unidentified developer" warnings!

---

## Troubleshooting

### "No identity found"
Make sure the certificate is installed:
```bash
security find-identity -v -p codesigning
```

If empty, re-download and install the certificate from Apple Developer Portal.

### "Notarization failed"
Check the notarization log:
```bash
xcrun notarytool log <submission-id> --apple-id gao.kabubi@gmail.com --team-id SMPLNQ29SK --password $APPLE_PASSWORD
```

Common issues:
- App uses deprecated APIs
- Missing entitlements for certain features
- Hardened runtime issues

### "Invalid signature"
The certificate might have expired. Check in Keychain Access and renew if needed.

---

## Quick Reference

| Item | Value |
|------|-------|
| Team ID | `SMPLNQ29SK` |
| Apple ID | `gao.kabubi@gmail.com` |
| Bundle ID | `com.gerardbeaubrun.dustoff-reset` |
| Min macOS | 10.13 (High Sierra) |

---

## Security Notes

⚠️ **Never commit** the app-specific password to git!

The password should only exist as:
- An environment variable on your machine
- A secret in CI/CD (GitHub Actions, etc.)
