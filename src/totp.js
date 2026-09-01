const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Decode(input) {
  // Remove whitespace and padding, convert to uppercase
  const cleanedInput = input.replace(/\s/g, '').replace(/=+$/, '').toUpperCase()
  let accumulatedBits = 0
  let bitBuffer = 0
  const decodedBytes = []

  for (const character of cleanedInput) {
    const charIndex = BASE32_ALPHABET.indexOf(character)
    if (charIndex === -1) {
      throw new Error(`Invalid Base32 character: ${character}`)
    }
    bitBuffer = (bitBuffer << 5) | charIndex
    accumulatedBits += 5

    // Extract full bytes when we have at least 8 bits
    if (accumulatedBits >= 8) {
      decodedBytes.push((bitBuffer >>> (accumulatedBits - 8)) & 0xff)
      accumulatedBits -= 8
    }
  }

  return new Uint8Array(decodedBytes)
}

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

function getHmacOutputByteIndex(algorithm) {
  // Returns the index of the last byte in the HMAC output for different algorithms
  switch (algorithm) {
    case 'SHA-256':
      return 31
    case 'SHA-512':
      return 63
    default:
      return 19 // SHA-1
  }
}

async function hotp(secret, counter, digits = 6, algorithm = 'SHA-1') {
  const keyBytes = base32Decode(secret)

  // Convert counter to 8-byte big-endian array
  const counterBytes = new Uint8Array(8)
  let counterValue = BigInt(counter)
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(counterValue & 0xffn)
    counterValue >>= 8n
  }

  const hmac = await hmacHash(keyBytes, counterBytes, algorithm)

  // Extract the dynamic offset from the last 4 bits of the last byte
  const lastByteIndex = getHmacOutputByteIndex(algorithm)
  const offset = hmac[lastByteIndex] & 0x0f

  // Build the code from 4 bytes starting at the offset
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const modulus = digits === 8 ? 100_000_000 : 1_000_000
  return String(code % modulus).padStart(digits, '0')
}

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

const STEAM_ALPHABET = '23456789BCDFGHJKMNPQRTVWXY'

export async function generateSteamCode(secret, stepOffset = 0) {
  const period = 30
  const timeStep = Math.floor(Date.now() / 1000 / period) + stepOffset
  const keyBytes = base32Decode(secret)

  // Convert time step to 8-byte big-endian array
  const counterBytes = new Uint8Array(8)
  let counterValue = BigInt(timeStep)
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(counterValue & 0xffn)
    counterValue >>= 8n
  }

  const hmac = await hmacHash(keyBytes, counterBytes, 'SHA-1')

  // Extract the code using the same method as HOTP
  const offset = hmac[19] & 0x0f
  let numericCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  // Convert to Steam's custom alphabet (no ambiguous characters like 1, I, 0, O, etc.)
  let steamCode = ''
  for (let i = 0; i < 5; i++) {
    steamCode += STEAM_ALPHABET[numericCode % STEAM_ALPHABET.length]
    numericCode = Math.floor(numericCode / STEAM_ALPHABET.length)
  }

  return steamCode
}

export function validateBase32(secret) {
  try {
    const bytes = base32Decode(secret)
    return bytes.length >= 10
  } catch {
    return false
  }
}

export function getAccountDefaults() {
  return {
    algorithm: 'SHA-1',
    digits: 6,
    period: 30,
    type: 'totp',
  }
}

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

export function parseOtpAuth(data) {
  if (!data || typeof data !== 'string') return null
  const trimmed = data.trim()

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

  if (!trimmed.toLowerCase().startsWith('otpauth://')) {
    return null
  }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'otpauth:') return null

    const uriType = url.hostname.toLowerCase()
    if (uriType !== 'totp' && uriType !== 'hotp') return null

    let rawPath = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    let issuer = url.searchParams.get('issuer') || ''
    const secret = url.searchParams.get('secret')

    if (!secret) return null

    const cleanSecret = secret.replace(/\s/g, '').toUpperCase()
    if (!validateBase32(cleanSecret)) return null

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
