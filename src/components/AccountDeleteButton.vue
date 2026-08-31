<template>
  <button
    @click.stop="$emit('delete')"
    title="Delete account"
    class="text-[#999999] hover:text-[#f06595] transition-all p-1.5 -mr-1 rounded-lg bg-[#1e1e1e] border-2 border-[#333333] neo-button flex-shrink-0"
  >
    <i class="fa-solid fa-trash-can text-sm block"></i>
  </button>
</template>

<script setup>
defineEmits(['delete'])
</script>
