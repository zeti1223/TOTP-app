<template>
  <button
    @click.stop="$emit('edit')"
    type="button"
    title="Edit account name"
    class="text-[#999999] hover:text-[#6965db] transition-all p-1.5 rounded-lg bg-[#1e1e1e] border-2 border-[#333333] neo-button flex-shrink-0"
  >
    <i class="fa-solid fa-pencil text-sm block"></i>
  </button>
</template>

<script setup>
defineEmits(['edit'])
</script>
