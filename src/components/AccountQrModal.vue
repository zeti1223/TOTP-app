<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-qrcode text-indigo-400 text-lg"></i>
            <h2 class="font-bold text-gray-100 text-base">Transfer / Share Account</h2>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-5 space-y-4">
          <!-- Account name -->
          <p class="text-sm text-gray-300 text-center font-medium">{{ account.name }}</p>

          <!-- QR code canvas -->
          <div class="flex justify-center">
            <div
              v-if="qrError"
              class="w-48 h-48 flex flex-col items-center justify-center bg-gray-800 rounded-xl border border-gray-700 text-gray-400 text-center text-xs gap-2 p-4"
            >
              <i class="fa-solid fa-triangle-exclamation text-yellow-400 text-2xl"></i>
              <span>QR generation failed. Use the URI below.</span>
            </div>
            <canvas
              v-else
              ref="qrCanvas"
              class="rounded-xl border border-gray-700"
              :class="isLoading ? 'opacity-30' : 'opacity-100'"
              style="image-rendering: pixelated;"
            ></canvas>
          </div>

          <!-- Security warning -->
          <div class="flex items-start gap-2 p-3 rounded-xl bg-yellow-950/40 border border-yellow-800/50 text-yellow-300 text-xs">
            <i class="fa-solid fa-triangle-exclamation text-yellow-400 mt-0.5 flex-shrink-0"></i>
            <span>This QR code contains your <strong>secret key</strong>. Only scan it on a trusted device in a private space.</span>
          </div>

          <!-- URI display + copy -->
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500">otpauth:// URI</label>
            <div class="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
              <span class="text-xs text-gray-400 font-mono break-all flex-1 select-all leading-relaxed">{{ otpUri }}</span>
              <button
                @click="copyUri"
                :title="uriCopied ? 'Copied!' : 'Copy URI'"
                class="flex-shrink-0 text-gray-500 hover:text-gray-200 transition-colors p-1 rounded"
              >
                <i :class="uriCopied ? 'fa-solid fa-check text-green-400' : 'fa-regular fa-copy'" class="text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Account params summary -->
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="badge in paramBadges"
              :key="badge.label"
              class="text-[11px] px-2 py-0.5 rounded-md border font-medium"
              :class="badge.class"
            >
              {{ badge.label }}
            </span>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 pb-5">
          <button
            @click="$emit('close')"
            class="w-full py-2.5 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'
import { buildOtpAuthUri, getAccountDefaults } from '../totp.js'

const props = defineProps({
  account: {
    type: Object,
    required: true,
  },
})

defineEmits(['close'])

const qrCanvas = ref(null)
const isLoading = ref(true)
const qrError = ref(false)
const uriCopied = ref(false)

const otpUri = computed(() => buildOtpAuthUri(props.account))

const paramBadges = computed(() => {
  const defaults = getAccountDefaults()
  const badges = []
  const acc = props.account

  if (acc.type === 'steam') {
    badges.push({ label: 'Steam Guard', class: 'bg-blue-950/60 text-blue-300 border-blue-800/50' })
    badges.push({ label: '5 chars', class: 'bg-gray-800 text-gray-400 border-gray-700' })
    badges.push({ label: '30s', class: 'bg-gray-800 text-gray-400 border-gray-700' })
    return badges
  }

  const algorithm = acc.algorithm || defaults.algorithm
  const digits = acc.digits || defaults.digits
  const period = acc.period || defaults.period

  badges.push({
    label: algorithm,
    class: algorithm === 'SHA-1'
      ? 'bg-gray-800 text-gray-400 border-gray-700'
      : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
  })
  badges.push({
    label: `${digits} digits`,
    class: digits === 8
      ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50'
      : 'bg-gray-800 text-gray-400 border-gray-700',
  })
  badges.push({
    label: `${period}s`,
    class: period !== 30
      ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50'
      : 'bg-gray-800 text-gray-400 border-gray-700',
  })

  return badges
})

async function generateQr() {
  isLoading.value = true
  qrError.value = false
  try {
    await QRCode.toCanvas(qrCanvas.value, otpUri.value, {
      width: 192,
      margin: 2,
      color: {
        dark: '#e0e7ff',  // indigo-100
        light: '#111827', // gray-900
      },
      errorCorrectionLevel: 'M',
    })
  } catch (err) {
    console.error('QR generation failed:', err)
    qrError.value = true
  } finally {
    isLoading.value = false
  }
}

async function copyUri() {
  try {
    await navigator.clipboard.writeText(otpUri.value)
    uriCopied.value = true
    setTimeout(() => { uriCopied.value = false }, 2000)
  } catch {
    // Clipboard not available
  }
}

onMounted(() => {
  generateQr()
})
</script>
