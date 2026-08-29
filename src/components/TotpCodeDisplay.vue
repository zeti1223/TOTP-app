<template>
  <div class="flex flex-col gap-1">
    <button
      @click="$emit('copy')"
      :title="copied ? 'Copied!' : 'Click to copy'"
      class="flex items-center gap-2 group/copy text-left w-fit"
    >
      <span
        class="totp-code font-bold tracking-[0.2em] transition-colors"
        :class="[
          isError ? 'text-red-500 text-2xl' :
          isSteam ? 'text-3xl font-mono tracking-[0.3em]' :
          'text-4xl',
          urgencyColorClass,
          'group-hover/copy:opacity-80'
        ]"
      >
        {{ formattedCode }}
      </span>
      <span
        v-if="!isError"
        class="text-gray-600 transition-all ml-1"
        :class="copied ? 'text-green-400' : 'group-hover/copy:text-gray-400'"
      >
        <i v-if="!copied" class="fa-regular fa-copy text-sm"></i>
        <i v-else class="fa-solid fa-check text-green-400 text-sm"></i>
      </span>
    </button>

    <!-- Next code preview -->
    <div
      v-if="!isError && formattedNextCode"
      class="flex items-center gap-1.5 text-xs text-gray-400"
    >
      <span class="text-gray-500 font-medium">Next:</span>
      <button
        @click="$emit('copy-next')"
        :title="copiedNext ? 'Copied!' : 'Click to copy next code'"
        class="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors group/next"
      >
        <span class="font-mono tracking-wider font-semibold">{{ formattedNextCode }}</span>
        <i
          class="text-[10px] transition-colors"
          :class="copiedNext ? 'fa-solid fa-check text-green-400' : 'fa-regular fa-copy text-gray-500 group-hover/next:text-gray-300'"
        ></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  formattedCode: {
    type: String,
    required: true,
  },
  formattedNextCode: {
    type: String,
    default: '',
  },
  isError: {
    type: Boolean,
    default: false,
  },
  timeLeft: {
    type: Number,
    required: true,
  },
  period: {
    type: Number,
    default: 30,
  },
  copied: {
    type: Boolean,
    default: false,
  },
  copiedNext: {
    type: Boolean,
    default: false,
  },
  isSteam: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['copy', 'copy-next'])

const urgencyColorClass = computed(() => {
  if (props.isError) return ''
  const ratio = props.timeLeft / props.period
  if (ratio <= 0.17) return 'text-red-400'
  if (ratio <= 0.33) return 'text-yellow-400'
  return 'text-indigo-300'
})
</script>
