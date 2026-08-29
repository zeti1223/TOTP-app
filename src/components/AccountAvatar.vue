<template>
  <div
    class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
    :style="{ backgroundColor: avatarColor + '33', color: avatarColor }"
  >
    {{ initialLetter }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
})

const COLORS = ['#818cf8', '#34d399', '#f472b6', '#fb923c', '#38bdf8', '#a78bfa', '#4ade80']

const initialLetter = computed(() => {
  return props.name ? props.name.charAt(0).toUpperCase() : '?'
})

const avatarColor = computed(() => {
  let hash = 0
  for (const ch of props.name) {
    hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  }
  return COLORS[Math.abs(hash) % COLORS.length]
})
</script>
