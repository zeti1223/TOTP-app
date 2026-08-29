import { ref, computed, onMounted, onUnmounted } from 'vue'
import { generateTotp, generateSteamCode, getAccountDefaults } from '../totp.js'

/**
 * useTotp – accepts a full account object (or getter returning one).
 * Supports configurable period, digits, algorithm and Steam Guard type.
 */
export function useTotp(accountGetter) {
  const code = ref('------')
  const nextCode = ref('------')
  const isError = ref(false)
  const timeLeft = ref(30)
  const copied = ref(false)
  const copiedNext = ref(false)

  function getAccount() {
    const raw = typeof accountGetter === 'function' ? accountGetter() : accountGetter
    // Support legacy usage where only a secret string is passed
    if (typeof raw === 'string') {
      return { secret: raw, ...getAccountDefaults() }
    }
    const defaults = getAccountDefaults()
    return {
      secret: raw?.secret ?? '',
      algorithm: raw?.algorithm ?? defaults.algorithm,
      digits: raw?.digits ?? defaults.digits,
      period: raw?.period ?? defaults.period,
      type: raw?.type ?? defaults.type,
    }
  }

  const isSteam = computed(() => getAccount().type === 'steam')
  const period = computed(() => getAccount().period || 30)

  const formattedCode = computed(() => {
    if (isError.value) return 'Invalid Key'
    if (isSteam.value) return code.value // Steam: 5 chars, no space
    const digits = getAccount().digits || 6
    const c = code.value.padStart(digits, '0')
    if (digits === 8) return c.slice(0, 4) + ' ' + c.slice(4)
    return c.slice(0, 3) + ' ' + c.slice(3)
  })

  const formattedNextCode = computed(() => {
    if (isError.value) return ''
    if (isSteam.value) return nextCode.value
    const digits = getAccount().digits || 6
    const c = nextCode.value.padStart(digits, '0')
    if (digits === 8) return c.slice(0, 4) + ' ' + c.slice(4)
    return c.slice(0, 3) + ' ' + c.slice(3)
  })

  const progressPercent = computed(() => (timeLeft.value / period.value) * 100)

  async function refreshCode() {
    try {
      const acc = getAccount()
      if (!acc.secret) {
        isError.value = true
        return
      }

      if (acc.type === 'steam') {
        const [current, next] = await Promise.all([
          generateSteamCode(acc.secret, 0),
          generateSteamCode(acc.secret, 1),
        ])
        code.value = current
        nextCode.value = next
      } else {
        const [current, next] = await Promise.all([
          generateTotp(acc.secret, acc.period, 0, acc.digits, acc.algorithm),
          generateTotp(acc.secret, acc.period, 1, acc.digits, acc.algorithm),
        ])
        code.value = current
        nextCode.value = next
      }
      isError.value = false
    } catch (e) {
      console.error('TOTP error:', e)
      isError.value = true
    }
  }

  function updateTimer() {
    const epoch = Math.floor(Date.now() / 1000)
    const p = period.value
    timeLeft.value = p - (epoch % p)
  }

  let interval = null
  let lastTimeStep = -1

  onMounted(async () => {
    await refreshCode()
    updateTimer()
    const p = period.value
    lastTimeStep = Math.floor(Date.now() / 1000 / p)

    interval = setInterval(async () => {
      updateTimer()
      const p = period.value
      const currentStep = Math.floor(Date.now() / 1000 / p)
      if (currentStep !== lastTimeStep) {
        lastTimeStep = currentStep
        await refreshCode()
      }
    }, 1000)
  })

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  async function copyCode() {
    if (isError.value) return
    const raw = code.value
    try {
      await navigator.clipboard.writeText(raw)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      // Clipboard not available
    }
  }

  async function copyNextCode() {
    if (isError.value) return
    const raw = nextCode.value
    try {
      await navigator.clipboard.writeText(raw)
      copiedNext.value = true
      setTimeout(() => {
        copiedNext.value = false
      }, 2000)
    } catch {
      // Clipboard not available
    }
  }

  return {
    code,
    nextCode,
    formattedCode,
    formattedNextCode,
    isError,
    timeLeft,
    progressPercent,
    isSteam,
    copied,
    copiedNext,
    copyCode,
    copyNextCode,
  }
}
