<template>
  <button
    @click="$emit('edit')"
    type="button"
    title="Edit account name"
    class="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-indigo-400 transition-all p-1.5 rounded-lg hover:bg-indigo-400/10 flex-shrink-0"
  >
    <i class="fa-solid fa-pencil text-sm block"></i>
  </button>
</template>

<script setup>
defineEmits(['edit'])
</script>
