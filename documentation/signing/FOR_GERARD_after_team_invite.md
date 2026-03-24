# For Gerard: After Gao Adds You to the Team

Once Gao invites you to the Apple Developer team, follow these steps.

---

## Step 1: Accept the Invitation

1. Check your email for an invitation from Apple Developer
2. Click the link to accept
3. Sign in with your Apple ID
4. Accept the terms

---

## Step 2: Create Your Developer ID Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Sign in with **your** Apple ID
3. You should see the team: **SMPLNQ29SK**
4. Go to **Certificates, Identifiers & Profiles** → **Certificates**
5. Click **+** to create a new certificate
6. Select **Developer ID Application**
7. Create a CSR (Certificate Signing Request):
   - Open **Keychain Access** on your Mac
   - Menu: **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
   - Enter **your** email
   - Select **Saved to disk**
   - Upload the `.certSigningRequest` file to Apple
8. Download the certificate (`.cer` file)
9. Double-click to install it in your Keychain

---

## Step 3: Find Your Signing Identity

Run this in Terminal:

```bash
security find-identity -v -p codesigning
```

Look for something like:
```
"Developer ID Application: Gerard Beaubrun (SMPLNQ29SK)"
```

Copy that full string.

---

## Step 4: Create Your App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with **your** Apple ID
3. Go to **Sign-In and Security** → **App-Specific Passwords**
4. Generate a new password named: `dustoff-notarization`
5. Save the password (format: `xxxx-xxxx-xxxx-xxxx`)

---

## Step 5: Set Environment Variables

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Gerard Beaubrun (SMPLNQ29SK)"
export APPLE_ID="your-apple-id@email.com"
export APPLE_TEAM_ID="SMPLNQ29SK"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
```

To make permanent, add to `~/.zshrc`:
```bash
echo 'export APPLE_SIGNING_IDENTITY="Developer ID Application: Gerard Beaubrun (SMPLNQ29SK)"' >> ~/.zshrc
echo 'export APPLE_ID="your-apple-id@email.com"' >> ~/.zshrc
echo 'export APPLE_TEAM_ID="SMPLNQ29SK"' >> ~/.zshrc
echo 'export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 6: Build the Signed App

```bash
cd /Users/gerardbeaubrun/Documents/projects/dustoff_reset_desktop/dustoff_reset
./scripts/build-macos-signed.sh
```

The signed DMG will be at:
```
src-tauri/target/release/bundle/dmg/Dustoff Reset_0.1.0_aarch64.dmg
```

---

## Done!

You can now build signed and notarized versions of Dustoff Reset anytime!
