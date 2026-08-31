<template>
  <div class="bg-[#1e1e1e] rounded-2xl border-2 border-[#333333] neo-shadow overflow-hidden">
    <!-- Header - click to toggle -->
    <button
      @click="open = !open"
      class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1e1e1e]/50 transition-colors"
    >
      <div class="flex items-center gap-2.5">
        <i class="fa-solid fa-plus text-[#6965db]"></i>
        <span class="font-semibold text-[#e3e3e3]">Add New Account</span>
      </div>
      <i
        class="fa-solid fa-chevron-down text-[#999999] text-xs transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      ></i>
    </button>

    <!-- Form Container -->
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <AddAccountForm
        v-if="open"
        @add-account="$emit('add-account', $event)"
        @submitted="open = false"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AddAccountForm from './AddAccountForm.vue'

defineEmits(['add-account'])

const open = ref(false)
</script>
