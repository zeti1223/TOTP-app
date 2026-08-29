<template>
  <div v-if="!isError" class="h-0.5 bg-gray-800 rounded-full overflow-hidden">
    <div
      class="h-full rounded-full transition-all duration-1000 linear"
      :class="barClass"
      :style="{ width: progressPercent + '%' }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  progressPercent: {
    type: Number,
    required: true,
  },
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

const barClass = computed(() => {
  const ratio = props.timeLeft / props.period
  if (ratio <= 0.17) return 'bg-red-500'
  if (ratio <= 0.33) return 'bg-yellow-400'
  return 'bg-indigo-500'
})
</script>
