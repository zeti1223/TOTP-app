/**
 * TOTP implementation using browser native Web Crypto API
 * RFC 4226 (HOTP) + RFC 6238 (TOTP)
 * No Node.js Buffer dependency
 *
 * Supports:
 * - SHA-1 / SHA-256 / SHA-512 algorithms
 * - 6 or 8 digit codes
 * - Configurable period (30s, 60s, custom)
 * - Steam Guard 5-character alphanumeric codes
 */

// Base32 decoding
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Decode(input) {
  const str = input.replace(/\s/g, '').replace(/=+$/, '').toUpperCase()
  let bits = 0
  let value = 0
  const output = []

  for (const char of str) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx === -1) throw new Error(`Invalid Base32 character: ${char}`)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return new Uint8Array(output)
}

/**
 * HMAC using Web Crypto API – supports SHA-1, SHA-256, SHA-512
 * @param {Uint8Array} keyBytes
 * @param {Uint8Array} dataBytes
 * @param {'SHA-1'|'SHA-256'|'SHA-512'} algorithm
 */
async function hmacHash(keyBytes, dataBytes, algorithm = 'SHA-1') {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes)
  return new Uint8Array(signature)
}

/**
 * Returns the last byte index for dynamic truncation offset lookup based on HMAC length.
 * SHA-1 → 20 bytes, SHA-256 → 32 bytes, SHA-512 → 64 bytes
 */
function hmacLastByteIndex(algorithm) {
  switch (algorithm) {
    case 'SHA-256': return 31
    case 'SHA-512': return 63
    default: return 19 // SHA-1
  }
}

/**
 * HOTP (RFC 4226) – HMAC-based One-Time Password
 * @param {string} secret - Base32 encoded secret
 * @param {number} counter
 * @param {number} digits - 6 or 8
 * @param {'SHA-1'|'SHA-256'|'SHA-512'} algorithm
 */
async function hotp(secret, counter, digits = 6, algorithm = 'SHA-1') {
  const keyBytes = base32Decode(secret)

  // Counter → 8-byte big-endian
  const counterBytes = new Uint8Array(8)
  let c = BigInt(counter)
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(c & 0xffn)
    c >>= 8n
  }

  const hmac = await hmacHash(keyBytes, counterBytes, algorithm)

  // Dynamic truncation
  const lastByte = hmacLastByteIndex(algorithm)
  const offset = hmac[lastByte] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const mod = digits === 8 ? 100_000_000 : 1_000_000
  return String(code % mod).padStart(digits, '0')
}

/**
 * TOTP (RFC 6238) – Time-based One-Time Password
 * @param {string} secret - Base32 encoded secret
 * @param {number} period - Time step in seconds (default 30)
 * @param {number} stepOffset - Time step offset (0 = current, 1 = next)
 * @param {number} digits - Number of digits (6 or 8)
 * @param {'SHA-1'|'SHA-256'|'SHA-512'} algorithm
 */
export async function generateTotp(
  secret,
  period = 30,
  stepOffset = 0,
  digits = 6,
  algorithm = 'SHA-1'
) {
  const timeStep = Math.floor(Date.now() / 1000 / period) + stepOffset
  return hotp(secret, timeStep, digits, algorithm)
}

/**
 * Steam Guard – generates a 5-character alphanumeric code.
 * Uses HMAC-SHA1 with the standard Steam alphabet.
 * @param {string} secret - Base32 encoded secret
 * @param {number} stepOffset - 0 = current, 1 = next
 */
const STEAM_ALPHABET = '23456789BCDFGHJKMNPQRTVWXY'

export async function generateSteamCode(secret, stepOffset = 0) {
  const period = 30
  const timeStep = Math.floor(Date.now() / 1000 / period) + stepOffset
  const keyBytes = base32Decode(secret)

  // Counter → 8-byte big-endian
  const counterBytes = new Uint8Array(8)
  let c = BigInt(timeStep)
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(c & 0xffn)
    c >>= 8n
  }

  const hmac = await hmacHash(keyBytes, counterBytes, 'SHA-1')

  // Steam-specific truncation
  const offset = hmac[19] & 0x0f
  let fullCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  let steamCode = ''
  for (let i = 0; i < 5; i++) {
    steamCode += STEAM_ALPHABET[fullCode % STEAM_ALPHABET.length]
    fullCode = Math.floor(fullCode / STEAM_ALPHABET.length)
  }

  return steamCode
}

// Validates whether the secret key can be decoded
export function validateBase32(secret) {
  try {
    const bytes = base32Decode(secret)
    return bytes.length >= 10 // min 80 bit
  } catch {
    return false
  }
}

/**
 * Account default values for backward compatibility.
 * Existing accounts without these fields will use these defaults.
 */
export function getAccountDefaults() {
  return {
    algorithm: 'SHA-1',
    digits: 6,
    period: 30,
    type: 'totp',
  }
}

/**
 * Builds an otpauth:// URI from an account object.
 * Used for QR code regeneration / device transfer.
 * @param {Object} account - Account object with name, secret, issuer, algorithm, digits, period, type
 * @returns {string} otpauth:// URI
 */
export function buildOtpAuthUri(account) {
  const defaults = getAccountDefaults()
  const type = account.type === 'steam' ? 'totp' : (account.type || 'totp')
  const label = encodeURIComponent(account.name || 'Account')
  const secret = (account.secret || '').toUpperCase().replace(/\s/g, '')
  const algorithm = account.algorithm || defaults.algorithm
  const digits = account.digits || defaults.digits
  const period = account.period || defaults.period

  let uri = `otpauth://${type}/${label}?secret=${secret}&algorithm=${algorithm}&digits=${digits}&period=${period}`

  if (account.issuer) {
    uri += `&issuer=${encodeURIComponent(account.issuer)}`
  }

  return uri
}

/**
 * Parses otpauth:// URI or raw secret string from QR code
 * Returns { name, secret, issuer, account, algorithm, digits, period, type } or null if invalid
 */
export function parseOtpAuth(data) {
  if (!data || typeof data !== 'string') return null
  const trimmed = data.trim()

  // Case 1: Plain Base32 string (without URI scheme)
  const cleanPotentialBase32 = trimmed.replace(/\s/g, '').toUpperCase()
  if (/^[A-Z2-7]+=*$/.test(cleanPotentialBase32) && validateBase32(cleanPotentialBase32)) {
    return {
      name: 'Imported Account',
      secret: cleanPotentialBase32,
      issuer: '',
      account: '',
      algorithm: 'SHA-1',
      digits: 6,
      period: 30,
      type: 'totp',
    }
  }

  // Case 2: otpauth:// URI
  if (!trimmed.toLowerCase().startsWith('otpauth://')) {
    return null
  }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'otpauth:') return null

    const uriType = url.hostname.toLowerCase()
    if (uriType !== 'totp' && uriType !== 'hotp') return null

    // Extract path (e.g. "/GitHub:alice@gmail.com" or "/alice@gmail.com")
    let rawPath = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    let issuer = url.searchParams.get('issuer') || ''
    const secret = url.searchParams.get('secret')

    if (!secret) return null

    const cleanSecret = secret.replace(/\s/g, '').toUpperCase()
    if (!validateBase32(cleanSecret)) return null

    // Parse extended parameters
    const rawAlgorithm = (url.searchParams.get('algorithm') || 'SHA-1').toUpperCase()
    const validAlgorithms = ['SHA-1', 'SHA-256', 'SHA-512']
    const algorithm = validAlgorithms.includes(rawAlgorithm) ? rawAlgorithm : 'SHA-1'

    const rawDigits = parseInt(url.searchParams.get('digits') || '6', 10)
    const digits = rawDigits === 8 ? 8 : 6

    const rawPeriod = parseInt(url.searchParams.get('period') || '30', 10)
    const period = rawPeriod > 0 ? rawPeriod : 30

    let accountName = rawPath
    if (rawPath.includes(':')) {
      const parts = rawPath.split(':')
      if (!issuer) {
        issuer = parts[0].trim()
      }
      accountName = parts.slice(1).join(':').trim() || parts[0].trim()
    }

    let finalName = ''
    if (issuer && accountName) {
      if (accountName.toLowerCase().includes(issuer.toLowerCase())) {
        finalName = accountName
      } else {
        finalName = `${issuer} (${accountName})`
      }
    } else {
      finalName = accountName || issuer || 'New Account'
    }

    return {
      name: finalName,
      secret: cleanSecret,
      issuer,
      account: accountName,
      algorithm,
      digits,
      period,
      type: uriType,
    }
  } catch {
    return null
  }
}
