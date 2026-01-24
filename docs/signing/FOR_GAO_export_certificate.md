# For Gao: Export Certificate for Gerard (Option B)

Follow these steps to export your signing certificate so Gerard can use it on his Mac.

---

## Step 1: Create the Developer ID Certificate (if not done already)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Sign in with: `gao.kabubi@gmail.com`
3. Go to **Certificates, Identifiers & Profiles** → **Certificates**
4. Click **+** to create a new certificate
5. Select **Developer ID Application**
6. Follow the CSR (Certificate Signing Request) process:
   - Open **Keychain Access** on your Mac
   - Menu: **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
   - Email: `gao.kabubi@gmail.com`
   - Select **Saved to disk**
   - Upload the `.certSigningRequest` file to Apple
7. Download the certificate (`.cer` file)
8. Double-click to install it in your Keychain

---

## Step 2: Export the Certificate as .p12

1. Open **Keychain Access** (search for it in Spotlight)
2. In the left sidebar, select **login** under Keychains
3. Select **My Certificates** in the Category section
4. Find the certificate named:
   ```
   Developer ID Application: [Your Name] (SMPLNQ29SK)
   ```
5. **Right-click** on it → **Export...**
6. Choose format: **Personal Information Exchange (.p12)**
7. Save it as: `dustoff-signing-cert.p12`
8. **Create a strong password** when prompted (you'll share this with Gerard)
9. Enter your Mac login password if asked

---

## Step 3: Create App-Specific Password for Notarization

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with: `gao.kabubi@gmail.com`
3. Go to **Sign-In and Security** → **App-Specific Passwords**
4. Click **Generate an app-specific password**
5. Name it: `dustoff-reset-notarization`
6. **Save this password** - you'll only see it once!

---

## Step 4: Send to Gerard (Securely!)

Send Gerard these items **via a secure method** (not plain email):

| Item | What it is |
|------|------------|
| `dustoff-signing-cert.p12` | The certificate file |
| P12 password | The password you created in Step 2 |
| App-specific password | From Step 3 (format: `xxxx-xxxx-xxxx-xxxx`) |

**Secure sharing options:**
- iMessage (encrypted)
- AirDrop (if nearby)
- Password manager shared vault
- Encrypted email

---

## Security Notes

⚠️ **These credentials can sign apps as you!** Only share with trusted people.

⚠️ If the certificate is ever compromised, you can revoke it at developer.apple.com
