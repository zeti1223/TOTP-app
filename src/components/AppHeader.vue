<template>
  <header class="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800">
    <div class="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-shield-halved text-2xl text-indigo-400"></i>
        <h1 class="text-xl font-bold tracking-tight">TOTP Authenticator</h1>
      </div>

      <div v-if="isUnlocked" class="flex items-center gap-3">
        <AccountCounter :count="count" />
        <button
          type="button"
          @click="$emit('lock')"
          title="Lock Vault"
          class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition cursor-pointer"
        >
          <i class="fa-solid fa-lock text-xs text-amber-400"></i>
          <span>Lock</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import AccountCounter from './AccountCounter.vue'

defineProps({
  count: {
    type: Number,
    default: 0,
  },
  isUnlocked: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['lock'])
</script>
