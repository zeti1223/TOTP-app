<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-400 mb-1">
      {{ label }}
    </label>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      :spellcheck="spellcheck"
      class="w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
      :class="[
        error ? 'border-red-500' : 'border-gray-700',
        inputClass
      ]"
      @input="onInput"
    />
    <p v-if="error" class="mt-1 text-xs text-red-400">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-600">{{ hint }}</p>
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
