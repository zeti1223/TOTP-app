# TOTP Authenticator

A privacy-first, browser-based two-factor authentication (2FA) app. All secrets are stored **locally in your browser** and encrypted with a master password — no server, no account, no cloud.

## Features

- **Encrypted vault** — secrets are protected with AES-256-GCM, derived from your master password via PBKDF2
- **TOTP & HOTP support** — fully implements RFC 4226 and RFC 6238 using the native Web Crypto API
- **Steam Guard** — generates 5-character alphanumeric Steam codes
- **QR code scanning** — add accounts by scanning a QR code directly from your camera
- **QR code export** — display a QR code for any saved account for easy transfer to another device
- **Account management** — add, edit, and delete accounts
- **Multiple algorithm support** — SHA-1, SHA-256, SHA-512
- **Configurable code length** — 6 or 8 digit codes with a custom time period
- **Dark mode UI** — built with Tailwind CSS

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Vue 3](https://vuejs.org/) (Composition API) |
| Build tool | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Icons | [Font Awesome](https://fontawesome.com/) |
| QR scanning | [jsQR](https://github.com/cozmo/jsQR) |
| QR generation | [qrcode](https://github.com/soldair/node-qrcode) |
| Crypto | Browser-native [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) |

## Security Model

- **Key derivation**: PBKDF2 with SHA-256, 100,000 iterations, random 16-byte salt
- **Encryption**: AES-256-GCM with a random 12-byte IV per save
- **Storage**: Encrypted vault stored in `localStorage` — nothing leaves your device
- **In-memory only**: The decryption key is held in memory only while the vault is unlocked; locking clears it immediately

> **Caution:** Clearing browser storage or `localStorage` will permanently destroy your encrypted vault. Back up your secrets before resetting.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/zeti1223/TOTP-app.git
cd "TOTP-app"

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

The compiled output will be in the `dist/` folder. You can serve it with any static file server.

## Usage

1. **First launch** — create a master password to initialize the encrypted vault.
2. **Add accounts** — tap the **+** button and either:
   - Scan a QR code with your camera
   - Paste an `otpauth://` URI
   - Enter the secret key manually
3. **Use codes** — the 6- or 8-digit TOTP code is displayed with a live countdown timer.
4. **Lock** — click the lock icon in the header to clear the vault from memory.
5. **Transfer** — tap the QR icon on any account
