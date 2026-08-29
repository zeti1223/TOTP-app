<template>
  <span class="text-xs text-gray-500 font-medium">
    {{ count }} {{ count === 1 ? 'account' : 'accounts' }}
  </span>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    required: true,
  },
})
</script>
