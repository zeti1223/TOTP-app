<template>
  <div class="max-w-md mx-auto px-4 py-12">
    <div class="bg-[#1e1e1e] border-2 border-[#333333] rounded-2xl p-6 md:p-8 neo-shadow relative overflow-hidden">
      <!-- Glow background effect -->
      <div class="absolute -top-24 -left-24 w-48 h-48 bg-[#6965db]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-[#f06595]/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Icon & Header -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1e1e1e] border-2 border-[#6965db] text-[#6965db] mb-4 neo-shadow">
          <i :class="isVaultInitialized ? 'fa-solid fa-lock text-2xl' : 'fa-solid fa-key text-2xl'"></i>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-[#e3e3e3]" style="font-family: var(--font-hand)">
          {{ isVaultInitialized ? 'Unlock Vault' : 'Set Up Encrypted Vault' }}
        </h2>
        <p class="text-sm text-[#999999] mt-2">
          {{
            isVaultInitialized
              ? 'Enter your master password or salt to access your 2FA accounts.'
              : 'Enter a master password or salt phrase to secure your 2FA accounts in this browser using AES-256 encryption.'
          }}
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="authError"
        class="mb-5 p-3.5 rounded-xl bg-[#1e1e1e] border-2 border-[#f06595] text-[#f06595] text-sm flex items-start gap-3"
      >
        <i class="fa-solid fa-triangle-exclamation text-[#f06595] mt-0.5"></i>
        <div class="flex-1">
          <p class="font-medium">{{ authError }}</p>
        </div>
      </div>

      <!-- Setup Form (First Time) -->
      <form v-if="!isVaultInitialized" @submit.prevent="handleInit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-[#e3e3e3] mb-1.5">
            Master Password / Salt
          </label>
          <div class="relative">
            <input
              v-model="passphrase"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••••••"
              required
              minlength="4"
              class="w-full bg-[#141414] border-2 border-[#333333] rounded-xl px-4 py-3 pr-11 text-[#e3e3e3] placeholder-[#999999] neo-input"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#e3e3e3] p-1 transition cursor-pointer"
              tabindex="-1"
            >
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-[#e3e3e3] mb-1.5">
            Confirm Password / Salt
          </label>
          <div class="relative">
            <input
              v-model="confirmPassphrase"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••••••"
              required
              class="w-full bg-[#141414] border-2 border-[#333333] rounded-xl px-4 py-3 pr-11 text-[#e3e3e3] placeholder-[#999999] neo-input"
              :class="{ 'border-[#f06595]': confirmError }"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#e3e3e3] p-1 transition cursor-pointer"
              tabindex="-1"
            >
              <i :class="showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
          <p v-if="confirmError" class="mt-1 text-xs text-[#f06595]">{{ confirmError }}</p>
        </div>

        <div class="p-3 bg-[#1e1e1e] border-2 border-[#333333] rounded-xl text-xs text-[#6965db] flex items-start gap-2.5">
          <i class="fa-solid fa-shield-halved text-[#6965db] mt-0.5"></i>
          <span>
            <strong>Security:</strong> All accounts are stored locally in your browser and encrypted with PBKDF2 + AES-GCM (256-bit). Data cannot be decrypted without your password / salt.
          </span>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !passphrase || !confirmPassphrase"
          class="w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 bg-[#6965db] border-2 border-[#6965db] text-white neo-button hover:bg-[#12b886] hover:border-[#12b886] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin text-sm"></i>
          <i v-else class="fa-solid fa-lock-open text-xs"></i>
          <span>{{ isLoading ? 'Creating Vault…' : 'Create Encrypted Vault' }}</span>
        </button>
      </form>

      <!-- Unlock Form (Subsequent Visits) -->
      <form v-else @submit.prevent="handleUnlock" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-[#e3e3e3] mb-1.5">
            Master Password / Salt
          </label>
          <div class="relative">
            <input
              v-model="passphrase"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••••••"
              required
              autofocus
              class="w-full bg-[#141414] border-2 border-[#333333] rounded-xl px-4 py-3 pr-11 text-[#e3e3e3] placeholder-[#999999] neo-input"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#e3e3e3] p-1 transition cursor-pointer"
              tabindex="-1"
            >
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !passphrase"
          class="w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 bg-[#6965db] border-2 border-[#6965db] text-white neo-button hover:bg-[#12b886] hover:border-[#12b886] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin text-sm"></i>
          <i v-else class="fa-solid fa-lock-open text-xs"></i>
          <span>{{ isLoading ? 'Decrypting…' : 'Unlock Vault' }}</span>
        </button>

        <!-- Reset Vault Section -->
        <div class="pt-4 border-t-2 border-[#333333] text-center">
          <button
            type="button"
            @click="showResetConfirm = !showResetConfirm"
            class="text-xs text-[#999999] hover:text-[#e3e3e3] underline transition cursor-pointer"
          >
            Forgot password? Reset and wipe vault
          </button>

          <div
            v-if="showResetConfirm"
            class="mt-4 p-4 rounded-xl bg-[#1e1e1e] border-2 border-[#f06595] text-left space-y-3"
          >
            <div class="flex items-center gap-2 text-[#f06595] font-semibold text-xs">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>Warning: Data Loss Danger</span>
            </div>
            <p class="text-xs text-[#999999] leading-relaxed">
              Resetting the vault will permanently delete all encrypted accounts stored in this browser. You will then be able to configure a new master password / salt.
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="confirmReset"
                class="flex-1 py-2 px-3 bg-[#f06595] border-2 border-[#f06595] hover:bg-[#f06595] text-white text-xs font-semibold rounded-lg neo-button cursor-pointer"
              >
                Yes, Reset Vault
              </button>
              <button
                type="button"
                @click="showResetConfirm = false"
                class="py-2 px-3 bg-[#1e1e1e] border-2 border-[#333333] hover:bg-[#1e1e1e] text-[#999999] text-xs font-semibold rounded-lg neo-button cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isVaultInitialized: {
    type: Boolean,
    required: true,
  },
  authError: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['init-vault', 'unlock-vault', 'reset-vault'])

const passphrase = ref('')
const confirmPassphrase = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showResetConfirm = ref(false)

const confirmError = computed(() => {
  if (!confirmPassphrase.value) return ''
  if (passphrase.value !== confirmPassphrase.value) {
    return 'Passwords do not match!'
  }
  return ''
})

function handleInit() {
  if (passphrase.value.length < 4) {
    return
  }
  if (passphrase.value !== confirmPassphrase.value) {
    return
  }
  emit('init-vault', passphrase.value)
}

function handleUnlock() {
  if (!passphrase.value) return
  emit('unlock-vault', passphrase.value)
}

function confirmReset() {
  showResetConfirm.value = false
  passphrase.value = ''
  confirmPassphrase.value = ''
  emit('reset-vault')
}
</script>
