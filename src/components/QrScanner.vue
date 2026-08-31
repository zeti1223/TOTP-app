<template>
  <div class="space-y-4">
    <div class="flex rounded-lg bg-[#121212] p-1 border-2 border-[#333333]">
      <button
        type="button"
        @click="mode = 'camera'"
        :class="[
          'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition flex items-center justify-center gap-2',
          mode === 'camera'
            ? 'bg-[#6965db] text-white shadow-sm'
            : 'text-[#999999] hover:text-[#e3e3e3]'
        ]"
      >
        <i class="fa-solid fa-camera"></i>
        <span>Camera</span>
      </button>

      <button
        type="button"
        @click="mode = 'file'"
        :class="[
          'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition flex items-center justify-center gap-2',
          mode === 'file'
            ? 'bg-[#6965db] text-white shadow-sm'
            : 'text-[#999999] hover:text-[#e3e3e3]'
        ]"
      >
        <i class="fa-solid fa-file-image"></i>
        <span>Upload</span>
      </button>
    </div>

    <div v-if="mode === 'camera'" class="space-y-3">
      <div class="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border-2 border-[#333333]">
        <video ref="videoEl" playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1);"></video>
        <canvas ref="canvasEl" class="hidden"></canvas>

        <div v-if="cameraLoading" class="absolute inset-0 bg-[#121212]/80 flex items-center justify-center gap-2 text-[#e3e3e3]">
          <i class="fa-solid fa-spinner fa-spin text-xl text-[#6965db]"></i>
          <span class="text-xs">Starting camera...</span>
        </div>

        <div v-if="cameraError" class="absolute inset-0 bg-[#121212]/95 flex flex-col items-center justify-center p-5 text-center gap-3 text-[#e3e3e3]">
          <div class="w-10 h-10 rounded-full bg-[#1e1e1e] border-2 border-[#f06595] flex items-center justify-center text-[#f06595]">
            <i class="fa-solid fa-video-slash"></i>
          </div>
          <p class="text-xs text-[#f06595] max-w-xs">{{ cameraError }}</p>
          <button
            type="button"
            @click="startCamera"
            class="px-3 py-1.5 bg-[#1e1e1e] border-2 border-[#333333] hover:bg-[#1e1e1e] text-xs text-[#999999] font-medium rounded-lg neo-button"
          >
            Retry
          </button>
        </div>
      </div>

      <div v-if="!cameraError && !cameraLoading" class="flex items-center justify-between text-xs text-[#999999] px-1">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-[#12b886] animate-pulse"></span>
          Point at QR code
        </span>
      </div>
    </div>

    <div v-if="mode === 'file'" class="space-y-3">
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
        :class="[
          'relative w-full aspect-[4/3] rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center p-6 text-center cursor-pointer',
          isDragging
            ? 'border-[#6965db] bg-[#121212]/20'
            : 'border-[#333333] hover:border-[#333333] bg-[#121212]/40'
        ]"
      >
        <input
          ref="fileInputEl"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileSelected"
        />

        <div class="w-12 h-12 rounded-xl bg-[#1e1e1e] border-2 border-[#333333] flex items-center justify-center text-[#6965db] mb-3">
          <i class="fa-solid fa-qrcode text-xl"></i>
        </div>

        <p class="text-sm font-medium text-[#e3e3e3] mb-1">
          Drop image or <span class="text-[#6965db] underline">browse</span>
        </p>
        <p class="text-xs text-[#999999]">
          Supports PNG, JPG. Press Ctrl+V to paste.
        </p>

        <div v-if="fileLoading" class="absolute inset-0 bg-[#121212]/80 flex items-center justify-center gap-2 text-[#e3e3e3] rounded-xl">
          <i class="fa-solid fa-spinner fa-spin text-xl text-[#6965db]"></i>
          <span class="text-xs">Scanning...</span>
        </div>
      </div>
    </div>

    <div v-if="scanError" class="flex items-center gap-2 px-3 py-2 bg-[#1e1e1e] border-2 border-[#f06595] rounded-lg text-xs text-[#f06595]">
      <i class="fa-solid fa-circle-exclamation shrink-0"></i>
      <span>{{ scanError }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import jsQR from 'jsqr'
import { parseOtpAuth } from '../totp.js'

const emit = defineEmits(['scanned'])

const mode = ref('camera')
const videoEl = ref(null)
const canvasEl = ref(null)
const fileInputEl = ref(null)

const isScanning = ref(false)
const cameraLoading = ref(false)
const cameraError = ref('')
const scanError = ref('')
const fileLoading = ref(false)
const isDragging = ref(false)

let mediaStream = null
let animationFrameId = null

watch(mode, (newMode) => {
  scanError.value = ''
  if (newMode === 'camera') {
    startCamera()
  } else {
    stopCamera()
  }
})

async function startCamera() {
  stopCamera()
  cameraError.value = ''
  scanError.value = ''
  cameraLoading.value = true

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera not supported')
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })

    if (!videoEl.value) return

    videoEl.value.srcObject = mediaStream
    videoEl.value.setAttribute('playsinline', 'true')
    await videoEl.value.play()

    cameraLoading.value = false
    isScanning.value = true
    scanFrame()
  } catch (err) {
    cameraLoading.value = false
    isScanning.value = false
    cameraError.value = err.message || 'Unable to access camera'
  }
}

function stopCamera() {
  isScanning.value = false
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
  if (videoEl.value) {
    videoEl.value.srcObject = null
  }
}

function scanFrame() {
  if (!isScanning.value || !videoEl.value || !canvasEl.value) return

  if (videoEl.value.readyState === videoEl.value.HAVE_ENOUGH_DATA) {
    const canvas = canvasEl.value
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const width = videoEl.value.videoWidth
    const height = videoEl.value.videoHeight

    if (width > 0 && height > 0) {
      canvas.width = width
      canvas.height = height
      ctx.translate(width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(videoEl.value, 0, 0, width, height)
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      const imageData = ctx.getImageData(0, 0, width, height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code && code.data) {
        const parsed = parseOtpAuth(code.data)
        if (parsed) {
          stopCamera()
          emit('scanned', parsed)
          return
        } else {
          scanError.value = 'Invalid TOTP code'
        }
      }
    }
  }

  animationFrameId = requestAnimationFrame(scanFrame)
}

function triggerFileInput() {
  if (fileInputEl.value) {
    fileInputEl.value.click()
  }
}

function handleFileSelected(event) {
  const file = event.target.files?.[0]
  if (file) {
    processImageFile(file)
  }
  event.target.value = ''
}

function handleDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  } else {
    scanError.value = 'Please drop an image file'
  }
}

function handlePaste(event) {
  if (mode.value !== 'file') return
  const items = event.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile()
      if (file) {
        processImageFile(file)
        break
      }
    }
  }
}

function processImageFile(file) {
  scanError.value = ''
  fileLoading.value = true

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      fileLoading.value = false

      if (code && code.data) {
        const parsed = parseOtpAuth(code.data)
        if (parsed) {
          emit('scanned', parsed)
        } else {
          scanError.value = 'Invalid TOTP code'
        }
      } else {
        scanError.value = 'No QR code found'
      }
    }
    img.onerror = () => {
      fileLoading.value = false
      scanError.value = 'Failed to load image'
    }
    img.src = e.target.result
  }
  reader.onerror = () => {
    fileLoading.value = false
    scanError.value = 'Failed to read file'
  }
  reader.readAsDataURL(file)
}

onMounted(() => {
  window.addEventListener('paste', handlePaste)
  if (mode.value === 'camera') {
    startCamera()
  }
})

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste)
  stopCamera()
})
</script>
