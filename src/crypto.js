/**
 * Web Cryptography API utilities for password-based encryption and decryption.
 * Uses PBKDF2 for key derivation and AES-256-GCM for authenticated encryption.
 */

export function bufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function generateSalt(length = 16) {
  return crypto.getRandomValues(new Uint8Array(length))
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a passphrase and salt using PBKDF2 (SHA-256).
 * @param {string} passphrase - The master passphrase or salt phrase
 * @param {Uint8Array|string} salt - The PBKDF2 salt (Uint8Array or base64 string)
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(passphrase, salt) {
  const saltBytes = typeof salt === 'string' ? base64ToBuffer(salt) : salt
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts an object/array using AES-GCM.
 * @param {any} data - Plaintext JS data structure
 * @param {CryptoKey} key - AES-GCM CryptoKey
 * @returns {Promise<{ iv: string, data: string }>}
 */
export async function encryptData(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encodedData = new TextEncoder().encode(JSON.stringify(data))

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedData
  )

  return {
    iv: bufferToBase64(iv),
    data: bufferToBase64(ciphertext),
  }
}

/**
 * Decrypts an encrypted payload using AES-GCM. Throws an error if key or data is invalid.
 * @param {{ iv: string, data: string }} encryptedPayload - Encrypted payload with base64 iv and data
 * @param {CryptoKey} key - AES-GCM CryptoKey
 * @returns {Promise<any>}
 */
export async function decryptData(encryptedPayload, key) {
  const iv = base64ToBuffer(encryptedPayload.iv)
  const ciphertext = base64ToBuffer(encryptedPayload.data)

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  )

  const decoded = new TextDecoder().decode(decrypted)
  return JSON.parse(decoded)
}
