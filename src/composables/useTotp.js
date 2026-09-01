import { ref, computed, onMounted, onUnmounted } from 'vue'
import { generateTotp, generateSteamCode, getAccountDefaults } from '../totp.js'

export function useTotp(accountGetter) {
  // Reactive state
  const code = ref('------')
  const nextCode = ref('------')
  const isError = ref(false)
  const timeLeft = ref(30)
  const copied = ref(false)
  const copiedNext = ref(false)

  // Get the account configuration (handle both direct objects and getter functions)
  function getAccount() {
    const raw = typeof accountGetter === 'function' ? accountGetter() : accountGetter
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

  // Computed properties
  const isSteam = computed(() => getAccount().type === 'steam')
  const period = computed(() => getAccount().period || 30)

  // Format the code with spaces for better readability
  const formattedCode = computed(() => {
    if (isError.value) return 'Invalid Key'
    if (isSteam.value) return code.value
    const digits = getAccount().digits || 6
    const paddedCode = code.value.padStart(digits, '0')
    if (digits === 8) return paddedCode.slice(0, 4) + ' ' + paddedCode.slice(4)
    return paddedCode.slice(0, 3) + ' ' + paddedCode.slice(3)
  })

  const formattedNextCode = computed(() => {
    if (isError.value) return ''
    if (isSteam.value) return nextCode.value
    const digits = getAccount().digits || 6
    const paddedCode = nextCode.value.padStart(digits, '0')
    if (digits === 8) return paddedCode.slice(0, 4) + ' ' + paddedCode.slice(4)
    return paddedCode.slice(0, 3) + ' ' + paddedCode.slice(3)
  })

  const progressPercent = computed(() => (timeLeft.value / period.value) * 100)

  // Generate fresh codes
  async function refreshCode() {
    try {
      const account = getAccount()
      if (!account.secret) {
        isError.value = true
        return
      }

      if (account.type === 'steam') {
        const [current, next] = await Promise.all([
          generateSteamCode(account.secret, 0),
          generateSteamCode(account.secret, 1),
        ])
        code.value = current
        nextCode.value = next
      } else {
        const [current, next] = await Promise.all([
          generateTotp(account.secret, account.period, 0, account.digits, account.algorithm),
          generateTotp(account.secret, account.period, 1, account.digits, account.algorithm),
        ])
        code.value = current
        nextCode.value = next
      }
      isError.value = false
    } catch (error) {
      console.error('TOTP error:', error)
      isError.value = true
    }
  }

  // Update the countdown timer
  function updateTimer() {
    const currentEpoch = Math.floor(Date.now() / 1000)
    const periodValue = period.value
    timeLeft.value = periodValue - (currentEpoch % periodValue)
  }

  // Timer management
  let interval = null
  let lastTimeStep = -1

  onMounted(async () => {
    await refreshCode()
    updateTimer()
    const periodValue = period.value
    lastTimeStep = Math.floor(Date.now() / 1000 / periodValue)

    interval = setInterval(async () => {
      updateTimer()
      const periodValue = period.value
      const currentStep = Math.floor(Date.now() / 1000 / periodValue)
      if (currentStep !== lastTimeStep) {
        lastTimeStep = currentStep
        await refreshCode()
      }
    }, 1000)
  })

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  // Copy current code to clipboard
  async function copyCode() {
    if (isError.value) return
    try {
      await navigator.clipboard.writeText(code.value)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      // Clipboard not available (silent fail)
    }
  }

  // Copy next code to clipboard
  async function copyNextCode() {
    if (isError.value) return
    try {
      await navigator.clipboard.writeText(nextCode.value)
      copiedNext.value = true
      setTimeout(() => {
        copiedNext.value = false
      }, 2000)
    } catch {
      // Clipboard not available (silent fail)
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
