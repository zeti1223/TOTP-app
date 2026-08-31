<template>
  <div v-if="!isError" @click.stop class="h-2 bg-[#333333] rounded-full overflow-hidden">
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
  if (ratio <= 0.17) return 'bg-[#f06595]'
  if (ratio <= 0.33) return 'bg-[#ff922b]'
  return 'bg-[#6965db]'
})
</script>
