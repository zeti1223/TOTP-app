<template>
  <div class="flex flex-col gap-1">
    <button
      @click.stop="$emit('copy')"
      :title="copied ? 'Copied!' : 'Click to copy'"
      class="flex items-center gap-2 group/copy text-left w-fit"
    >
      <span
        class="totp-code font-bold tracking-[0.2em] transition-colors"
        :class="[
          isError ? 'text-[#f06595] text-2xl' :
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
        class="text-[#999999] transition-all ml-1"
        :class="copied ? 'text-[#12b886]' : 'group-hover/copy:text-[#e3e3e3]'"
      >
        <i v-if="!copied" class="fa-regular fa-copy text-sm"></i>
        <i v-else class="fa-solid fa-check text-[#12b886] text-sm"></i>
      </span>
    </button>

    <!-- Next code preview -->
    <div
      v-if="!isError && formattedNextCode"
      class="flex items-center gap-1.5 text-xs text-[#999999]"
    >
      <span class="text-[#999999] font-medium">Next:</span>
      <button
        @click.stop="$emit('copy-next')"
        :title="copiedNext ? 'Copied!' : 'Click to copy next code'"
        class="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#1e1e1e] border-2 border-[#333333] hover:bg-[#1e1e1e] text-[#e3e3e3] hover:text-white transition-colors group/next neo-button"
      >
        <span class="font-mono tracking-wider font-semibold">{{ formattedNextCode }}</span>
        <i
          class="text-[10px] transition-colors"
          :class="copiedNext ? 'fa-solid fa-check text-[#12b886]' : 'fa-regular fa-copy text-[#999999] group-hover/next:text-[#e3e3e3]'"
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
  if (ratio <= 0.17) return 'text-[#f06595]'
  if (ratio <= 0.33) return 'text-[#ff922b]'
  return 'text-[#6965db]'
})
</script>
