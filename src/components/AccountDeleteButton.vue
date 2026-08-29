<template>
  <button
    @click="$emit('delete')"
    title="Delete account"
    class="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1.5 -mr-1 rounded-lg hover:bg-red-400/10 flex-shrink-0"
  >
    <i class="fa-solid fa-trash-can text-sm block"></i>
  </button>
</template>

<script setup>
defineEmits(['delete'])
</script>
