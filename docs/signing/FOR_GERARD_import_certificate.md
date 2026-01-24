# For Gerard: Import Gao's Certificate (Option B)

If Gao exported her certificate as a `.p12` file instead of adding you to the team, follow these steps.

---

## Step 1: Get Files from Gao

You need these from Gao:
- [ ] `dustoff-signing-cert.p12` - The certificate file
- [ ] P12 password - Password to unlock the .p12 file
- [ ] App-specific password - For notarization (format: `xxxx-xxxx-xxxx-xxxx`)

---

## Step 2: Install the Certificate

1. Double-click the `dustoff-signing-cert.p12` file
2. Keychain Access will open
3. Select **login** keychain
4. Enter the P12 password Gao gave you
5. Click **OK**
6. If prompted for your Mac password, enter it

---

## Step 3: Verify Installation

Run this in Terminal:

```bash
security find-identity -v -p codesigning
```

You should see:
```
"Developer ID Application: Gao Kabubi (SMPLNQ29SK)"
```

If you see it, the certificate is installed correctly!

---

## Step 4: Set Environment Variables

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Gao Kabubi (SMPLNQ29SK)"
export APPLE_ID="gao.kabubi@gmail.com"
export APPLE_TEAM_ID="SMPLNQ29SK"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password from Gao
```

To make permanent:
```bash
echo 'export APPLE_SIGNING_IDENTITY="Developer ID Application: Gao Kabubi (SMPLNQ29SK)"' >> ~/.zshrc
echo 'export APPLE_ID="gao.kabubi@gmail.com"' >> ~/.zshrc
echo 'export APPLE_TEAM_ID="SMPLNQ29SK"' >> ~/.zshrc
echo 'export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 5: Build the Signed App

```bash
cd /Users/gerardbeaubrun/Documents/projects/dustoff_reset_desktop/dustoff_reset
./scripts/build-macos-signed.sh
```

---

## Troubleshooting

### "The specified item could not be found in the keychain"

The certificate wasn't imported correctly. Try:
1. Open Keychain Access
2. Delete any partial imports
3. Re-import the .p12 file

### "User interaction is not allowed"

Unlock the keychain first:
```bash
security unlock-keychain ~/Library/Keychains/login.keychain-db
```

### Certificate shows but signing fails

Make sure the **private key** was also imported (it should be bundled in the .p12).

In Keychain Access, expand the certificate - you should see a private key underneath it.
