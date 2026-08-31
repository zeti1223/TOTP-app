<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <div class="bg-[#1e1e1e] border-2 border-[#333333] rounded-2xl w-full max-w-sm neo-shadow overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b-2 border-[#333333]">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation text-[#f06595] text-lg"></i>
            <h2 class="font-bold text-[#e3e3e3] text-base">Delete Account</h2>
          </div>
          <button
            @click="$emit('close')"
            class="text-[#999999] hover:text-[#e3e3e3] p-1.5 rounded-lg bg-[#1e1e1e] border-2 border-[#333333] neo-button"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-5 space-y-4">
          <!-- Account name -->
          <p class="text-sm text-[#e3e3e3] text-center font-medium">{{ account.name }}</p>

          <!-- Warning message -->
          <div class="flex items-start gap-2 p-3 rounded-xl bg-[#1e1e1e] border-2 border-[#f06595] text-[#f06595] text-xs">
            <i class="fa-solid fa-triangle-exclamation text-[#f06595] mt-0.5 flex-shrink-0"></i>
            <span>This action cannot be undone. The account will be permanently deleted.</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 pb-5 flex gap-2">
          <button
            @click="$emit('close')"
            class="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#1e1e1e] border-2 border-[#333333] text-[#999999] neo-button hover:text-[#e3e3e3]"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            class="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#f06595] border-2 border-[#f06595] text-white hover:bg-[#e05a84] hover:border-[#e05a84] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  account: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'confirm'])

function confirmDelete() {
  emit('confirm', props.account.id)
  emit('close')
}
</script>
