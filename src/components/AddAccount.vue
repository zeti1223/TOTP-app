<template>
  <div class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
    <!-- Header - click to toggle -->
    <button
      @click="open = !open"
      class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
    >
      <div class="flex items-center gap-2.5">
        <i class="fa-solid fa-plus text-indigo-400"></i>
        <span class="font-semibold text-gray-200">Add New Account</span>
      </div>
      <i
        class="fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-200"
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
