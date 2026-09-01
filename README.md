# TOTP Authenticator

A simple, private two-factor authentication (2FA) app that runs right in your browser. Your secrets stay on your device - they're encrypted with a password you choose and stored locally. No servers, no accounts, no cloud syncing.

## What it can do

- **Keeps your secrets safe** - Everything is encrypted with AES-256-GCM using your master password
- **Works with TOTP & HOTP** - Full support for the standard 2FA protocols (RFC 4226 and RFC 6238)
- **Steam Guard support** - Generates those 5-character Steam codes
- **Scan QR codes** - Add accounts by pointing your camera at a QR code
- **Share via QR** - Show a QR code for any account to easily move it to another device
- **Manage your accounts** - Add, edit, or delete accounts as needed
- **Different algorithms** - Supports SHA-1, SHA-256, and SHA-512
- **Flexible code settings** - Choose 6 or 8 digit codes, and customize the time period
- **Dark mode** - Easy on the eyes, built with Tailwind CSS

## How it's built

- **Vue 3** - The JavaScript framework (using the Composition API)
- **Vite** - For fast development and building
- **Tailwind CSS** - Styling
- **Font Awesome** - Icons
- **jsQR** - Scanning QR codes with your camera
- **qrcode** - Generating QR codes to share accounts
- **Web Crypto API** - Built-in browser encryption (no external crypto libraries)

## How your data stays secure

- **Strong password protection** - Your master password is processed with PBKDF2 (100,000 iterations) to create the encryption key
- **AES-256-GCM encryption** - Industry-standard encryption with a unique random key for each save
- **Local storage only** - Everything stays in your browser's localStorage, nothing gets sent anywhere
- **Memory safety** - The decryption key is only kept in memory while the vault is unlocked. Locking it wipes the key immediately

> **Important:** If you clear your browser data or localStorage, your encrypted vault will be gone forever. Make sure to back up your secrets before doing that.

## Setting it up

### What you need

- Node.js version 18 or newer
- npm (comes with Node.js)

### Installing

```bash
# Clone the repo
git clone https://github.com/zeti1223/TOTP-app.git
cd "TOTP-app"

# Install the dependencies
npm install
```

### Running it locally

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### Building for production

```bash
npm run build
```

The built files will be in the `dist/` folder. You can host these with any static file server.

## How to use it

1. **First time setup** - Create a master password to secure your vault
2. **Add your accounts** - Click the **+** button and choose one of these:
   - Scan a QR code with your camera
   - Paste an `otpauth://` link
   - Type in the secret key manually
3. **Get your codes** - The 6- or 8-digit code appears with a countdown timer showing when it changes
4. **Lock it up** - Click the lock icon to clear the vault from memory when you're done
5. **Move accounts** - Click the QR icon on any account to show a code you can scan on another device
