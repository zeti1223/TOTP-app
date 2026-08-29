<template>
  <div class="max-w-md mx-auto px-4 py-12">
    <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <!-- Glow background effect -->
      <div class="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Icon & Header -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 mb-4 shadow-inner">
          <i :class="isVaultInitialized ? 'fa-solid fa-lock text-2xl' : 'fa-solid fa-key text-2xl'"></i>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-white">
          {{ isVaultInitialized ? 'Unlock Vault' : 'Set Up Encrypted Vault' }}
        </h2>
        <p class="text-sm text-gray-400 mt-2">
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
        class="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-3"
      >
        <i class="fa-solid fa-triangle-exclamation text-red-400 mt-0.5"></i>
        <div class="flex-1">
          <p class="font-medium">{{ authError }}</p>
        </div>
      </div>

      <!-- Setup Form (First Time) -->
      <form v-if="!isVaultInitialized" @submit.prevent="handleInit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">
            Master Password / Salt
          </label>
          <div class="relative">
            <input
              v-model="passphrase"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••••••"
              required
              minlength="4"
              class="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 transition cursor-pointer"
              tabindex="-1"
            >
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">
            Confirm Password / Salt
          </label>
          <div class="relative">
            <input
              v-model="confirmPassphrase"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••••••"
              required
              class="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              :class="{ 'border-red-500': confirmError }"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 transition cursor-pointer"
              tabindex="-1"
            >
              <i :class="showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
          <p v-if="confirmError" class="mt-1 text-xs text-red-400">{{ confirmError }}</p>
        </div>

        <div class="p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
          <i class="fa-solid fa-shield-halved text-indigo-400 mt-0.5"></i>
          <span>
            <strong>Security:</strong> All accounts are stored locally in your browser and encrypted with PBKDF2 + AES-GCM (256-bit). Data cannot be decrypted without your password / salt.
          </span>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !passphrase || !confirmPassphrase"
          class="w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin text-sm"></i>
          <i v-else class="fa-solid fa-lock-open text-xs"></i>
          <span>{{ isLoading ? 'Creating Vault…' : 'Create Encrypted Vault' }}</span>
        </button>
      </form>

      <!-- Unlock Form (Subsequent Visits) -->
      <form v-else @submit.prevent="handleUnlock" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">
            Master Password / Salt
          </label>
          <div class="relative">
            <input
              v-model="passphrase"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••••••"
              required
              autofocus
              class="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 transition cursor-pointer"
              tabindex="-1"
            >
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !passphrase"
          class="w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin text-sm"></i>
          <i v-else class="fa-solid fa-lock-open text-xs"></i>
          <span>{{ isLoading ? 'Decrypting…' : 'Unlock Vault' }}</span>
        </button>

        <!-- Reset Vault Section -->
        <div class="pt-4 border-t border-gray-800/80 text-center">
          <button
            type="button"
            @click="showResetConfirm = !showResetConfirm"
            class="text-xs text-gray-500 hover:text-gray-400 underline transition cursor-pointer"
          >
            Forgot password? Reset and wipe vault
          </button>

          <div
            v-if="showResetConfirm"
            class="mt-4 p-4 rounded-xl bg-red-950/30 border border-red-800/50 text-left space-y-3"
          >
            <div class="flex items-center gap-2 text-red-400 font-semibold text-xs">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>Warning: Data Loss Danger</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed">
              Resetting the vault will permanently delete all encrypted accounts stored in this browser. You will then be able to configure a new master password / salt.
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="confirmReset"
                class="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Yes, Reset Vault
              </button>
              <button
                type="button"
                @click="showResetConfirm = false"
                class="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition cursor-pointer"
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
