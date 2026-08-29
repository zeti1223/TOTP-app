<template>
  <div class="space-y-4">
    <!-- Scanner mode switch -->
    <div class="flex rounded-lg bg-gray-950/60 p-1 border border-gray-800">
      <button
        type="button"
        @click="mode = 'camera'"
        :class="[
          'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition flex items-center justify-center gap-2',
          mode === 'camera'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        ]"
      >
        <i class="fa-solid fa-camera"></i>
        <span>Live Camera</span>
      </button>

      <button
        type="button"
        @click="mode = 'file'"
        :class="[
          'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition flex items-center justify-center gap-2',
          mode === 'file'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        ]"
      >
        <i class="fa-solid fa-file-image"></i>
        <span>Upload / Paste Image</span>
      </button>
    </div>

    <!-- Live Camera View -->
    <div v-show="mode === 'camera'" class="space-y-3">
      <div
        class="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center"
      >
        <video
          ref="videoEl"
          playsinline
          muted
          class="w-full h-full object-cover"
        ></video>

        <!-- Hidden canvas for QR image analysis -->
        <canvas ref="canvasEl" class="hidden"></canvas>

        <!-- Viewfinder Reticle Overlay -->
        <div
          v-if="isScanning && !cameraError"
          class="absolute inset-0 pointer-events-none flex items-center justify-center p-6"
        >
          <div class="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl border-2 border-indigo-500/40">
            <!-- Reticle Corners -->
            <div class="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg"></div>
            <div class="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg"></div>
            <div class="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg"></div>
            <div class="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-2 border-r-2 border-indigo-400 rounded-br-lg"></div>

            <!-- Animated Laser Scan Line -->
            <div class="scan-laser"></div>
          </div>
        </div>

        <!-- Camera Loading State -->
        <div
          v-if="cameraLoading"
          class="absolute inset-0 bg-gray-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-gray-300"
        >
          <i class="fa-solid fa-spinner fa-spin text-2xl text-indigo-400"></i>
          <span class="text-xs">Starting camera...</span>
        </div>

        <!-- Camera Error State -->
        <div
          v-if="cameraError"
          class="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-5 text-center gap-3 text-gray-300"
        >
          <div class="w-10 h-10 rounded-full bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400">
            <i class="fa-solid fa-video-slash"></i>
          </div>
          <p class="text-xs text-red-300 max-w-xs">{{ cameraError }}</p>
          <button
            type="button"
            @click="startCamera"
            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 font-medium rounded-lg transition border border-gray-700"
          >
            <i class="fa-solid fa-rotate-right mr-1.5"></i> Retry
          </button>
        </div>
      </div>

      <!-- Camera Controls -->
      <div v-if="!cameraError && !cameraLoading" class="flex items-center justify-between text-xs text-gray-400 px-1">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Point camera at QR code
        </span>

        <div class="flex items-center gap-2">
          <!-- Switch Camera Button (if multiple devices) -->
          <button
            v-if="videoDevices.length > 1"
            type="button"
            @click="switchCamera"
            class="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition flex items-center gap-1.5"
            title="Switch camera"
          >
            <i class="fa-solid fa-arrows-rotate text-xs"></i>
            <span>Switch camera</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Upload / Paste Image View -->
    <div v-show="mode === 'file'" class="space-y-3">
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
        :class="[
          'relative w-full aspect-[4/3] rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none',
          isDragging
            ? 'border-indigo-500 bg-indigo-950/20'
            : 'border-gray-800 hover:border-gray-700 bg-gray-950/40 hover:bg-gray-950/60'
        ]"
      >
        <input
          ref="fileInputEl"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileSelected"
        />

        <div class="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition">
          <i class="fa-solid fa-qrcode text-xl"></i>
        </div>

        <p class="text-sm font-medium text-gray-200 mb-1">
          Drop QR code image here or <span class="text-indigo-400 underline">browse</span>
        </p>
        <p class="text-xs text-gray-400 max-w-xs">
          Supports PNG, JPG, WebP. You can also press <kbd class="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 font-mono">Ctrl+V</kbd> to paste a screenshot.
        </p>

        <!-- Image Processing Loading -->
        <div
          v-if="fileLoading"
          class="absolute inset-0 bg-gray-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-gray-300 rounded-xl"
        >
          <i class="fa-solid fa-spinner fa-spin text-2xl text-indigo-400"></i>
          <span class="text-xs">Analyzing image...</span>
        </div>
      </div>
    </div>

    <!-- General Error Banner -->
    <div
      v-if="scanError"
      class="flex items-center gap-2 px-3 py-2 bg-red-950/50 border border-red-800/60 rounded-lg text-xs text-red-300"
    >
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

const mode = ref('camera') // 'camera' | 'file'
const videoEl = ref(null)
const canvasEl = ref(null)
const fileInputEl = ref(null)

const isScanning = ref(false)
const cameraLoading = ref(false)
const cameraError = ref('')
const scanError = ref('')
const fileLoading = ref(false)
const isDragging = ref(false)

const videoDevices = ref([])
const currentDeviceIndex = ref(0)
let mediaStream = null
let animationFrameId = null

// Watch mode changes to start/stop camera
watch(mode, (newMode) => {
  scanError.value = ''
  if (newMode === 'camera') {
    startCamera()
  } else {
    stopCamera()
  }
})

async function enumerateCameras() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoDevices.value = devices.filter((d) => d.kind === 'videoinput')
  } catch {
    // Non-critical, ignore
  }
}

async function startCamera() {
  stopCamera()
  cameraError.value = ''
  scanError.value = ''
  cameraLoading.value = true

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported by your browser or environment (requires HTTPS/localhost).')
    }

    await enumerateCameras()

    let videoConstraints = {
      facingMode: { ideal: 'environment' },
    }

    if (videoDevices.value.length > 0 && videoDevices.value[currentDeviceIndex.value]?.deviceId) {
      videoConstraints = {
        deviceId: { exact: videoDevices.value[currentDeviceIndex.value].deviceId },
      }
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
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
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      cameraError.value = 'Camera permission was denied. Please allow camera access in your browser.'
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      cameraError.value = 'No camera found on your device.'
    } else {
      cameraError.value = err.message || 'Unable to access camera.'
    }
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

function switchCamera() {
  if (videoDevices.value.length <= 1) return
  currentDeviceIndex.value = (currentDeviceIndex.value + 1) % videoDevices.value.length
  startCamera()
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
      ctx.drawImage(videoEl.value, 0, 0, width, height)

      const imageData = ctx.getImageData(0, 0, width, height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code && code.data) {
        const parsed = parseOtpAuth(code.data)
        if (parsed) {
          stopCamera()
          emit('scanned', parsed)
          return
        } else {
          scanError.value = 'Found QR code, but it is not a valid TOTP (otpauth://) code.'
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
    scanError.value = 'Please drop an image file.'
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
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })

      fileLoading.value = false

      if (code && code.data) {
        const parsed = parseOtpAuth(code.data)
        if (parsed) {
          emit('scanned', parsed)
        } else {
          scanError.value = 'QR code detected, but it does not contain a valid TOTP key or otpauth:// URI.'
        }
      } else {
        scanError.value = 'No QR code could be found in the image. Please try a clearer picture.'
      }
    }
    img.onerror = () => {
      fileLoading.value = false
      scanError.value = 'Failed to load image file.'
    }
    img.src = e.target.result
  }
  reader.onerror = () => {
    fileLoading.value = false
    scanError.value = 'Failed to read file.'
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

<style scoped>
.scan-laser {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #818cf8, #6366f1, #818cf8, transparent);
  box-shadow: 0 0 8px #6366f1;
  animation: scan 2s linear infinite alternate;
}

@keyframes scan {
  0% {
    top: 5%;
    opacity: 0.8;
  }
  100% {
    top: 95%;
    opacity: 0.8;
  }
}
</style>
