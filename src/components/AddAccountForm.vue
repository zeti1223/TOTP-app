<template>
  <div class="px-5 pb-5 border-t border-gray-800 pt-4 space-y-4">
    <!-- Tab Switcher -->
    <div class="flex rounded-xl bg-gray-950 p-1 border border-gray-800">
      <button
        type="button"
        @click="activeTab = 'qr'"
        :class="[
          'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2',
          activeTab === 'qr'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-400 hover:text-gray-200'
        ]"
      >
        <i class="fa-solid fa-qrcode"></i>
        <span>Scan QR Code</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'manual'"
        :class="[
          'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2',
          activeTab === 'manual'
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-400 hover:text-gray-200'
        ]"
      >
        <i class="fa-solid fa-keyboard"></i>
        <span>Manual Entry</span>
      </button>
    </div>

    <!-- QR Code Tab -->
    <div v-if="activeTab === 'qr'" class="space-y-4">
      <!-- If scanned result exists, show review/confirmation form -->
      <div v-if="scannedResult" class="space-y-4">
        <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
            <span class="font-medium">QR code recognized!</span>
          </div>
          <button
            type="button"
            @click="resetScan"
            class="text-emerald-400 hover:text-emerald-200 underline text-xs transition"
          >
            Scan again
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <BaseInput
            v-model="name"
            label="Account Name"
            placeholder="e.g. GitHub, Google…"
            required
          />

          <BaseInput
            v-model="secret"
            label="Secret Key (Base32)"
            placeholder="JBSWY3DPEHPK3PXP"
            required
            autocomplete="off"
            spellcheck="false"
            input-class="font-mono tracking-wider uppercase"
            :error="secretError"
            hint="Base32 characters: A–Z and 2–7"
            @input="validateSecret"
          />

          <!-- Advanced params (read-only from QR) -->
          <div v-if="hasAdvancedParams" class="flex flex-wrap gap-2">
            <span class="text-xs px-2 py-1 rounded-lg bg-gray-800 text-gray-400 border border-gray-700">
              <i class="fa-solid fa-shield-halved mr-1 text-indigo-400"></i>{{ algorithm }}
            </span>
            <span class="text-xs px-2 py-1 rounded-lg bg-gray-800 text-gray-400 border border-gray-700">
              <i class="fa-solid fa-hashtag mr-1 text-indigo-400"></i>{{ digits }} digits
            </span>
            <span class="text-xs px-2 py-1 rounded-lg bg-gray-800 text-gray-400 border border-gray-700">
              <i class="fa-regular fa-clock mr-1 text-indigo-400"></i>{{ period }}s interval
            </span>
            <span v-if="type === 'steam'" class="text-xs px-2 py-1 rounded-lg bg-blue-950/60 text-blue-300 border border-blue-800/60">
              <i class="fa-brands fa-steam mr-1"></i>Steam Guard
            </span>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="resetScan"
              class="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition bg-gray-800 hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!!secretError || !name || !secret"
              class="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <i class="fa-solid fa-plus text-xs"></i>
              <span>Save Account</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Otherwise show QrScanner -->
      <QrScanner
        v-else
        @scanned="handleScanned"
      />
    </div>

    <!-- Manual Entry Tab -->
    <form v-else-if="activeTab === 'manual'" @submit.prevent="submit" class="space-y-4">
      <BaseInput
        v-model="name"
        label="Account Name"
        placeholder="e.g. GitHub, Google, Discord…"
        required
      />

      <BaseInput
        v-model="secret"
        label="Secret Key (Base32)"
        placeholder="JBSWY3DPEHPK3PXP"
        required
        autocomplete="off"
        spellcheck="false"
        input-class="font-mono tracking-wider uppercase"
        :error="secretError"
        hint="Base32 characters: A–Z and 2–7"
        @input="validateSecret"
      />

      <!-- Account Type -->
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-gray-400">Account Type</label>
        <div class="flex rounded-lg bg-gray-950 p-0.5 border border-gray-800">
          <button
            type="button"
            @click="type = 'totp'"
            :class="[
              'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1.5',
              type === 'totp' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
            ]"
          >
            <i class="fa-solid fa-key"></i>
            TOTP
          </button>
          <button
            type="button"
            @click="type = 'steam'"
            :class="[
              'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1.5',
              type === 'steam' ? 'bg-blue-700 text-white' : 'text-gray-400 hover:text-gray-200'
            ]"
          >
            <i class="fa-brands fa-steam"></i>
            Steam Guard
          </button>
        </div>
        <p v-if="type === 'steam'" class="text-xs text-blue-400/80">
          Steam Guard uses 5-character alphanumeric codes with a fixed 30s interval.
        </p>
      </div>

      <!-- Advanced Settings (only for TOTP) -->
      <div v-if="type === 'totp'" class="space-y-1">
        <button
          type="button"
          @click="showAdvanced = !showAdvanced"
          class="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition w-full text-left py-1"
        >
          <i
            class="fa-solid fa-chevron-right text-[10px] transition-transform"
            :class="{ 'rotate-90': showAdvanced }"
          ></i>
          Advanced Settings
          <span v-if="hasNonDefaultParams" class="ml-1 px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 text-[10px] font-medium">Modified</span>
        </button>

        <div v-if="showAdvanced" class="bg-gray-950 border border-gray-800 rounded-xl p-3 space-y-3">
          <!-- Algorithm -->
          <div class="space-y-1">
            <label class="block text-xs font-medium text-gray-400">HMAC Algorithm</label>
            <div class="flex rounded-lg bg-gray-900 p-0.5 border border-gray-800 gap-0.5">
              <button
                v-for="alg in ['SHA-1', 'SHA-256', 'SHA-512']"
                :key="alg"
                type="button"
                @click="algorithm = alg"
                :class="[
                  'flex-1 py-1.5 px-1 rounded-md text-[11px] font-semibold transition',
                  algorithm === alg ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                ]"
              >{{ alg }}</button>
            </div>
          </div>

          <!-- Code Length -->
          <div class="space-y-1">
            <label class="block text-xs font-medium text-gray-400">Code Length</label>
            <div class="flex rounded-lg bg-gray-900 p-0.5 border border-gray-800 gap-0.5">
              <button
                type="button"
                @click="digits = 6"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  digits === 6 ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                ]"
              >6 digits</button>
              <button
                type="button"
                @click="digits = 8"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  digits === 8 ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                ]"
              >8 digits</button>
            </div>
          </div>

          <!-- Interval -->
          <div class="space-y-1">
            <label class="block text-xs font-medium text-gray-400">Refresh Interval</label>
            <div class="flex rounded-lg bg-gray-900 p-0.5 border border-gray-800 gap-0.5">
              <button
                type="button"
                @click="setPresetPeriod(30)"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  period === 30 && !customPeriodActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                ]"
              >30s</button>
              <button
                type="button"
                @click="setPresetPeriod(60)"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  period === 60 && !customPeriodActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                ]"
              >60s</button>
              <button
                type="button"
                @click="customPeriodActive = true"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  customPeriodActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                ]"
              >Custom</button>
            </div>
            <input
              v-if="customPeriodActive"
              v-model.number="period"
              type="number"
              min="10"
              max="300"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="Seconds (10–300)"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        :disabled="!!secretError || !name || !secret"
        class="w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <i class="fa-solid fa-plus text-xs"></i>
        <span>Add Account</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseInput from './BaseInput.vue'
import QrScanner from './QrScanner.vue'
import { validateBase32 } from '../totp.js'

const emit = defineEmits(['add-account', 'submitted'])

const activeTab = ref('qr') // 'qr' | 'manual'
const scannedResult = ref(null)

const name = ref('')
const secret = ref('')
const secretError = ref('')

// Advanced TOTP params
const type = ref('totp')         // 'totp' | 'steam'
const algorithm = ref('SHA-1')
const digits = ref(6)
const period = ref(30)
const showAdvanced = ref(false)
const customPeriodActive = ref(false)

const BASE32_RE = /^[A-Z2-7]+=*$/

const hasAdvancedParams = computed(() =>
  algorithm.value !== 'SHA-1' || digits.value !== 6 || period.value !== 30 || type.value === 'steam'
)

const hasNonDefaultParams = computed(() =>
  algorithm.value !== 'SHA-1' || digits.value !== 6 || period.value !== 30
)

function validateSecret() {
  const val = secret.value.replace(/\s/g, '').toUpperCase()
  secret.value = val
  if (!val) {
    secretError.value = ''
    return
  }
  if (!BASE32_RE.test(val)) {
    secretError.value = 'Invalid Base32 character (only A–Z and 2–7 allowed)'
  } else if (!validateBase32(val)) {
    secretError.value = 'Key is too short (at least 10 bytes required)'
  } else {
    secretError.value = ''
  }
}

function setPresetPeriod(value) {
  period.value = value
  customPeriodActive.value = false
}

function handleScanned(parsed) {
  scannedResult.value = parsed
  name.value = parsed.name || ''
  secret.value = parsed.secret || ''
  algorithm.value = parsed.algorithm || 'SHA-1'
  digits.value = parsed.digits || 6
  period.value = parsed.period || 30
  type.value = parsed.type || 'totp'
  validateSecret()
}

function resetScan() {
  scannedResult.value = null
  name.value = ''
  secret.value = ''
  secretError.value = ''
  algorithm.value = 'SHA-1'
  digits.value = 6
  period.value = 30
  type.value = 'totp'
  showAdvanced.value = false
  customPeriodActive.value = false
}

function submit() {
  if (secretError.value || !name.value || !secret.value) return

  const account = {
    id: crypto.randomUUID(),
    name: name.value.trim(),
    secret: secret.value.replace(/\s/g, '').toUpperCase(),
    type: type.value,
    createdAt: Date.now(),
  }

  // Only add TOTP-specific params if not Steam
  if (type.value !== 'steam') {
    account.algorithm = algorithm.value
    account.digits = digits.value
    account.period = period.value
  }

  emit('add-account', account)

  name.value = ''
  secret.value = ''
  secretError.value = ''
  scannedResult.value = null
  algorithm.value = 'SHA-1'
  digits.value = 6
  period.value = 30
  type.value = 'totp'
  showAdvanced.value = false
  customPeriodActive.value = false
  emit('submitted')
}
</script>
