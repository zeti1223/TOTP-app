<template>
  <div class="px-5 pb-5 border-t-2 border-[#333333] pt-4 space-y-4">
    <div class="flex rounded-xl bg-[#121212] p-1 border-2 border-[#333333]">
      <button
        type="button"
        @click="activeTab = 'qr'"
        :class="[
          'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2',
          activeTab === 'qr'
            ? 'bg-[#6965db] text-white shadow-md'
            : 'text-[#999999] hover:text-[#e3e3e3]'
        ]"
      >
        <i class="fa-solid fa-qrcode"></i>
        <span>Scan QR</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'manual'"
        :class="[
          'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2',
          activeTab === 'manual'
            ? 'bg-[#6965db] text-white shadow-md'
            : 'text-[#999999] hover:text-[#e3e3e3]'
        ]"
      >
        <i class="fa-solid fa-keyboard"></i>
        <span>Manual</span>
      </button>
    </div>

    <div v-if="activeTab === 'qr'" class="space-y-4">
      <div v-if="scannedResult" class="space-y-4">
        <div class="flex items-center justify-between p-3 rounded-xl bg-[#1e1e1e] border-2 border-[#12b886] text-[#12b886] text-xs">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-circle-check text-[#12b886] text-sm"></i>
            <span class="font-medium">QR code recognized!</span>
          </div>
          <button
            type="button"
            @click="resetScan"
            class="text-[#12b886] hover:text-[#12b886] underline text-xs transition"
          >
            Scan again
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <BaseInput
            v-model="name"
            label="Account Name"
            placeholder="e.g. GitHub, Google"
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

          <div v-if="hasAdvancedParams" class="flex flex-wrap gap-2">
            <span class="text-xs px-2 py-1 rounded-lg bg-[#1e1e1e] text-[#999999] border-2 border-[#333333]">
              <i class="fa-solid fa-shield-halved mr-1 text-[#6965db]"></i>{{ algorithm }}
            </span>
            <span class="text-xs px-2 py-1 rounded-lg bg-[#1e1e1e] text-[#999999] border-2 border-[#333333]">
              <i class="fa-solid fa-hashtag mr-1 text-[#6965db]"></i>{{ digits }} digits
            </span>
            <span class="text-xs px-2 py-1 rounded-lg bg-[#1e1e1e] text-[#999999] border-2 border-[#333333]">
              <i class="fa-regular fa-clock mr-1 text-[#6965db]"></i>{{ period }}s interval
            </span>
            <span v-if="type === 'steam'" class="text-xs px-2 py-1 rounded-lg bg-[#1e1e1e] text-[#6965db] border-2 border-[#333333]">
              <i class="fa-brands fa-steam mr-1"></i>Steam Guard
            </span>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="resetScan"
              class="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition bg-[#1e1e1e] border-2 border-[#333333] text-[#999999] neo-button hover:text-[#e3e3e3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!!secretError || !name || !secret"
              class="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 bg-[#6965db] border-2 border-[#6965db] text-white disabled:opacity-40 disabled:cursor-not-allowed neo-button hover:bg-[#12b886] hover:border-[#12b886]"
            >
              <i class="fa-solid fa-plus text-xs"></i>
              <span>Save Account</span>
            </button>
          </div>
        </form>
      </div>

      <QrScanner
        v-else
        @scanned="handleScanned"
      />
    </div>

    <form v-else-if="activeTab === 'manual'" @submit.prevent="submit" class="space-y-4">
      <BaseInput
        v-model="name"
        label="Account Name"
        placeholder="e.g. GitHub, Google"
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

      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-[#999999]">Account Type</label>
        <div class="flex rounded-lg bg-[#121212] p-0.5 border-2 border-[#333333]">
          <button
            type="button"
            @click="type = 'totp'"
            :class="[
              'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1.5',
              type === 'totp' ? 'bg-[#6965db] text-white' : 'text-[#999999] hover:text-[#e3e3e3]'
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
              type === 'steam' ? 'bg-[#6965db] text-white' : 'text-[#999999] hover:text-[#e3e3e3]'
            ]"
          >
            <i class="fa-brands fa-steam"></i>
            Steam Guard
          </button>
        </div>
      </div>

      <div v-if="type === 'totp'" class="space-y-1">
        <button
          type="button"
          @click="showAdvanced = !showAdvanced"
          class="flex items-center gap-1.5 text-xs text-[#999999] hover:text-[#e3e3e3] transition w-full text-left py-1"
        >
          <i
            class="fa-solid fa-chevron-right text-[10px] transition-transform"
            :class="{ 'rotate-90': showAdvanced }"
          ></i>
          Advanced Settings
        </button>

        <div v-if="showAdvanced" class="bg-[#121212] border-2 border-[#333333] rounded-xl p-3 space-y-3">
          <div class="space-y-1">
            <label class="block text-xs font-medium text-[#999999]">HMAC Algorithm</label>
            <div class="flex rounded-lg bg-[#1e1e1e] p-0.5 border-2 border-[#333333] gap-0.5">
              <button
                v-for="alg in ['SHA-1', 'SHA-256', 'SHA-512']"
                :key="alg"
                type="button"
                @click="algorithm = alg"
                :class="[
                  'flex-1 py-1.5 px-1 rounded-md text-[11px] font-semibold transition',
                  algorithm === alg ? 'bg-[#6965db] text-white' : 'text-[#999999] hover:text-[#e3e3e3]'
                ]"
              >{{ alg }}</button>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-medium text-[#999999]">Code Length</label>
            <div class="flex rounded-lg bg-[#1e1e1e] p-0.5 border-2 border-[#333333] gap-0.5">
              <button
                type="button"
                @click="digits = 6"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  digits === 6 ? 'bg-[#6965db] text-white' : 'text-[#999999] hover:text-[#e3e3e3]'
                ]"
              >6 digits</button>
              <button
                type="button"
                @click="digits = 8"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  digits === 8 ? 'bg-[#6965db] text-white' : 'text-[#999999] hover:text-[#e3e3e3]'
                ]"
              >8 digits</button>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-medium text-[#999999]">Refresh Interval</label>
            <div class="flex rounded-lg bg-[#1e1e1e] p-0.5 border-2 border-[#333333] gap-0.5">
              <button
                type="button"
                @click="setPresetPeriod(30)"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  period === 30 && !customPeriodActive ? 'bg-[#6965db] text-white' : 'text-[#999999] hover:text-[#e3e3e3]'
                ]"
              >30s</button>
              <button
                type="button"
                @click="setPresetPeriod(60)"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  period === 60 && !customPeriodActive ? 'bg-[#6965db] text-white' : 'text-[#999999] hover:text-[#e3e3e3]'
                ]"
              >60s</button>
              <button
                type="button"
                @click="customPeriodActive = true"
                :class="[
                  'flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition',
                  customPeriodActive ? 'bg-[#6965db] text-white' : 'text-[#999999] hover:text-[#e3e3e3]'
                ]"
              >Custom</button>
            </div>
            <input
              v-if="customPeriodActive"
              v-model.number="period"
              type="number"
              min="10"
              max="300"
              class="w-full bg-[#141414] border-2 border-[#333333] rounded-lg px-3 py-1.5 text-sm text-[#e3e3e3] neo-input"
              placeholder="Seconds (10–300)"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        :disabled="!!secretError || !name || !secret"
        class="w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 bg-[#6965db] border-2 border-[#6965db] text-white disabled:opacity-40 disabled:cursor-not-allowed neo-button hover:bg-[#12b886] hover:border-[#12b886]"
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

const activeTab = ref('qr')
const scannedResult = ref(null)

const name = ref('')
const secret = ref('')
const secretError = ref('')

const type = ref('totp')
const algorithm = ref('SHA-1')
const digits = ref(6)
const period = ref(30)
const showAdvanced = ref(false)
const customPeriodActive = ref(false)

const BASE32_RE = /^[A-Z2-7]+=*$/

const hasAdvancedParams = computed(() =>
  algorithm.value !== 'SHA-1' || digits.value !== 6 || period.value !== 30 || type.value === 'steam'
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
