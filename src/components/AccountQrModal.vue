<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <div class="bg-[#1e1e1e] border-2 border-[#333333] rounded-2xl w-full max-w-sm neo-shadow overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b-2 border-[#333333]">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-qrcode text-[#6965db] text-lg"></i>
            <h2 class="font-bold text-[#e3e3e3] text-base">Transfer / Share Account</h2>
          </div>
          <button
            @click="$emit('close')"
            class="text-[#999999] hover:text-[#e3e3e3] p-1.5 rounded-lg bg-[#1e1e1e] border-2 border-[#333333] neo-button"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-5 space-y-4">
          <!-- Account name -->
          <p class="text-sm text-[#e3e3e3] text-center font-medium">{{ account.name }}</p>

          <!-- QR code canvas -->
          <div class="flex justify-center">
            <div
              v-if="qrError"
              class="w-48 h-48 flex flex-col items-center justify-center bg-[#1e1e1e] rounded-xl border-2 border-[#333333] text-[#999999] text-center text-xs gap-2 p-4"
            >
              <i class="fa-solid fa-triangle-exclamation text-[#ff922b] text-2xl"></i>
              <span>QR generation failed. Use the URI below.</span>
            </div>
            <canvas
              v-else
              ref="qrCanvas"
              class="rounded-xl border-2 border-[#333333]"
              :class="isLoading ? 'opacity-30' : 'opacity-100'"
              style="image-rendering: pixelated;"
            ></canvas>
          </div>

          <!-- Security warning -->
          <div class="flex items-start gap-2 p-3 rounded-xl bg-[#1e1e1e] border-2 border-[#ff922b] text-[#ff922b] text-xs">
            <i class="fa-solid fa-triangle-exclamation text-[#ff922b] mt-0.5 flex-shrink-0"></i>
            <span>This QR code contains your <strong>secret key</strong>. Only scan it on a trusted device in a private space.</span>
          </div>

          <!-- URI display + copy -->
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[#999999]">otpauth:// URI</label>
            <div class="flex items-center gap-2 bg-[#121212] border-2 border-[#333333] rounded-lg px-3 py-2">
              <span class="text-xs text-[#999999] font-mono break-all flex-1 select-all leading-relaxed">{{ otpUri }}</span>
              <button
                @click="copyUri"
                :title="uriCopied ? 'Copied!' : 'Copy URI'"
                class="flex-shrink-0 text-[#999999] hover:text-[#e3e3e3] transition-colors p-1 rounded"
              >
                <i :class="uriCopied ? 'fa-solid fa-check text-[#12b886]' : 'fa-regular fa-copy'" class="text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Account params summary -->
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="badge in paramBadges"
              :key="badge.label"
              class="text-[11px] px-2 py-0.5 rounded-md border-2 font-medium"
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
            class="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#1e1e1e] border-2 border-[#333333] text-[#999999] neo-button hover:text-[#e3e3e3]"
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
    badges.push({ label: 'Steam Guard', class: 'bg-[#1e1e1e] text-[#6965db] border-[#333333]' })
    badges.push({ label: '5 chars', class: 'bg-[#1e1e1e] text-[#999999] border-[#333333]' })
    badges.push({ label: '30s', class: 'bg-[#1e1e1e] text-[#999999] border-[#333333]' })
    return badges
  }

  const algorithm = acc.algorithm || defaults.algorithm
  const digits = acc.digits || defaults.digits
  const period = acc.period || defaults.period

  badges.push({
    label: algorithm,
    class: algorithm === 'SHA-1'
      ? 'bg-[#1e1e1e] text-[#999999] border-[#333333]'
      : 'bg-[#1e1e1e] text-[#6965db] border-[#333333]',
  })
  badges.push({
    label: `${digits} digits`,
    class: digits === 8
      ? 'bg-[#1e1e1e] text-[#6965db] border-[#333333]'
      : 'bg-[#1e1e1e] text-[#999999] border-[#333333]',
  })
  badges.push({
    label: `${period}s`,
    class: period !== 30
      ? 'bg-[#1e1e1e] text-[#6965db] border-[#333333]'
      : 'bg-[#1e1e1e] text-[#999999] border-[#333333]',
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
        dark: '#6965db',  // accent-purple
        light: '#1e1e1e', // card-bg
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
