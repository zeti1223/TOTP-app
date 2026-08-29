import { ref } from 'vue'
import {
  generateSalt,
  deriveKey,
  encryptData,
  decryptData,
  bufferToBase64,
} from '../crypto.js'

const VAULT_STORAGE_KEY = 'totp-vault'
const LEGACY_STORAGE_KEY = 'totp-accounts'

const isVaultInitialized = ref(localStorage.getItem(VAULT_STORAGE_KEY) !== null)
const isUnlocked = ref(false)
const accounts = ref([])
const authError = ref('')
const isLoading = ref(false)

let activeKey = null
let currentSalt = null

function getStoredVault() {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function persist() {
  if (!activeKey || !currentSalt) {
    console.error('Cannot persist: vault is not unlocked or key is missing')
    return
  }
  try {
    const encrypted = await encryptData(accounts.value, activeKey)
    const vault = {
      version: 1,
      salt: currentSalt,
      iv: encrypted.iv,
      data: encrypted.data,
      updatedAt: Date.now(),
    }
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault))
  } catch (err) {
    console.error('Failed to persist encrypted vault:', err)
  }
}

export function useAccounts() {
  async function initVault(passphrase) {
    authError.value = ''
    isLoading.value = true
    try {
      const saltBytes = generateSalt(16)
      const saltBase64 = bufferToBase64(saltBytes)
      const key = await deriveKey(passphrase, saltBytes)

      // Migrate existing unencrypted accounts if any
      let initialAccounts = []
      try {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
        if (legacy) {
          initialAccounts = JSON.parse(legacy) || []
          localStorage.removeItem(LEGACY_STORAGE_KEY)
        }
      } catch {
        initialAccounts = []
      }

      const encrypted = await encryptData(initialAccounts, key)
      const vault = {
        version: 1,
        salt: saltBase64,
        iv: encrypted.iv,
        data: encrypted.data,
        createdAt: Date.now(),
      }

      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault))
      activeKey = key
      currentSalt = saltBase64
      accounts.value = initialAccounts
      isVaultInitialized.value = true
      isUnlocked.value = true
      return true
    } catch (err) {
      console.error('Failed to initialize vault:', err)
      authError.value = 'Failed to initialize encrypted vault.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function unlockVault(passphrase) {
    authError.value = ''
    isLoading.value = true
    try {
      const vault = getStoredVault()
      if (!vault || !vault.salt || !vault.iv || !vault.data) {
        authError.value = 'Stored vault data is corrupted or missing.'
        return false
      }

      const key = await deriveKey(passphrase, vault.salt)
      const decrypted = await decryptData(
        { iv: vault.iv, data: vault.data },
        key
      )

      activeKey = key
      currentSalt = vault.salt
      accounts.value = Array.isArray(decrypted) ? decrypted : []
      isUnlocked.value = true
      return true
    } catch (err) {
      console.error('Failed to unlock vault:', err)
      authError.value = 'Invalid password / salt! Please try again.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function lockVault() {
    activeKey = null
    currentSalt = null
    accounts.value = []
    isUnlocked.value = false
    authError.value = ''
  }

  function resetVault() {
    localStorage.removeItem(VAULT_STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    activeKey = null
    currentSalt = null
    accounts.value = []
    isUnlocked.value = false
    isVaultInitialized.value = false
    authError.value = ''
  }

  async function addAccount(account) {
    accounts.value.push(account)
    await persist()
  }

  async function updateAccount(idOrObj, updates) {
    const id = typeof idOrObj === 'object' ? idOrObj.id : idOrObj
    const changes = typeof idOrObj === 'object' ? idOrObj : updates
    accounts.value = accounts.value.map(a => {
      if (a.id === id) {
        return { ...a, ...changes }
      }
      return a
    })
    await persist()
  }

  async function removeAccount(id) {
    accounts.value = accounts.value.filter(a => a.id !== id)
    await persist()
  }

  return {
    isVaultInitialized,
    isUnlocked,
    accounts,
    authError,
    isLoading,
    initVault,
    unlockVault,
    lockVault,
    resetVault,
    addAccount,
    updateAccount,
    removeAccount,
  }
}
