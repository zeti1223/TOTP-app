<template>
  <header class="sticky top-0 z-10 bg-[rgba(18,18,18,0.95)] backdrop-blur border-b-2 border-[#333333]">
    <div class="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-decoration-none px-3 py-1.5 border-2 border-[#333333] rounded-lg bg-[#1e1e1e] neo-shadow transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_var(--accent-purple)]">
          <i class="fa-solid fa-shield-halved text-xl text-[#6965db]"></i>
          <h1 class="text-lg font-bold tracking-tight" style="font-family: var(--font-hand)">TOTP Authenticator</h1>
        </div>
      </div>

      <div v-if="isUnlocked" class="flex items-center gap-3">
        <AccountCounter :count="count" />
        <button
          type="button"
          @click="$emit('lock')"
          title="Lock Vault"
          class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#1e1e1e] border-2 border-[#333333] text-[#e3e3e3] neo-button hover:border-[#6965db] cursor-pointer"
        >
          <i class="fa-solid fa-lock text-xs text-[#ff922b]"></i>
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
