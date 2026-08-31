<template>
  <span class="text-xs text-[#999999] font-medium">
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
