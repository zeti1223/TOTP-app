<template>
  <div v-if="!isError" class="flex items-center gap-2">
    <i
      class="fa-regular fa-clock text-base"
      :class="urgencyClass"
    ></i>
    <span
      class="text-sm font-mono font-semibold tabular-nums"
      :class="urgencyClass"
    >
      {{ timeLeft }}s
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  timeLeft: {
    type: Number,
    required: true,
  },
  period: {
    type: Number,
    default: 30,
  },
  isError: {
    type: Boolean,
    default: false,
  },
})

const urgencyClass = computed(() => {
  const ratio = props.timeLeft / props.period
  if (ratio <= 0.17) return 'text-red-400 animate-pulse'  // last ~17%
  if (ratio <= 0.33) return 'text-yellow-400'             // last ~33%
  return 'text-gray-400'
})
</script>
