<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-[#999999] mb-1">
      {{ label }}
    </label>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      :spellcheck="spellcheck"
      class="w-full bg-[#141414] border-2 rounded-lg px-4 py-2.5 text-[#e3e3e3] placeholder-[#999999] neo-input"
      :class="[
        error ? 'border-[#f06595]' : 'border-[#333333]',
        inputClass
      ]"
      @input="onInput"
    />
    <p v-if="error" class="mt-1 text-xs text-[#f06595]">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-[#999999]">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  autocomplete: {
    type: String,
    default: undefined,
  },
  spellcheck: {
    type: [Boolean, String],
    default: undefined,
  },
  error: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  inputClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'input'])

function onInput(event) {
  emit('update:modelValue', event.target.value)
  emit('input', event)
}
</script>
