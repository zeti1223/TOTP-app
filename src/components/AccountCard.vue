<template>
  <div
    class="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex flex-col gap-3 hover:border-gray-700 transition-colors group"
  >
    <!-- Top row: Name/Edit input + Action buttons -->
    <div class="flex items-center justify-between gap-2 min-h-[36px]">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <AccountAvatar :name="isEditing ? (editName || account.name) : account.name" />

        <!-- Edit Form -->
        <form
          v-if="isEditing"
          @submit.prevent="saveEdit"
          class="flex items-center gap-1.5 flex-1 min-w-0"
        >
          <input
            ref="editInput"
            v-model="editName"
            type="text"
            maxlength="50"
            class="w-full bg-gray-800 border border-indigo-500/70 rounded-lg px-2.5 py-1 text-sm font-semibold text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
            placeholder="Account name"
            @keydown.esc.stop="cancelEdit"
          />
          <button
            type="submit"
            title="Save name"
            class="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-400/10 transition-colors flex-shrink-0"
          >
            <i class="fa-solid fa-check text-sm block"></i>
          </button>
          <button
            type="button"
            @click="cancelEdit"
            title="Cancel"
            class="text-gray-400 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors flex-shrink-0"
          >
            <i class="fa-solid fa-xmark text-sm block"></i>
          </button>
        </form>

        <!-- Display Name + Protocol badges -->
        <div v-else class="flex flex-col min-w-0 flex-1">
          <span
            class="font-semibold text-gray-200 truncate cursor-pointer hover:text-white transition-colors"
            :title="`${account.name} (Double-click to edit)`"
            @dblclick="startEdit"
          >
            {{ account.name }}
          </span>
          <!-- Protocol parameter badges -->
          <div v-if="protocolBadges.length" class="flex flex-wrap gap-1 mt-0.5">
            <span
              v-for="badge in protocolBadges"
              :key="badge.label"
              class="text-[10px] px-1.5 py-0.5 rounded font-medium border"
              :class="badge.class"
            >{{ badge.label }}</span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div v-if="!isEditing" class="flex items-center gap-0.5 flex-shrink-0">
        <!-- QR Share button -->
        <button
          @click="showQrModal = true"
          title="Show QR code for transfer"
          class="p-1.5 rounded-lg text-gray-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
        >
          <i class="fa-solid fa-qrcode text-sm block"></i>
        </button>
        <AccountEditButton @edit="startEdit" />
        <AccountDeleteButton @delete="$emit('remove', account.id)" />
      </div>
    </div>

    <!-- TOTP Code + Timer -->
    <div class="flex items-center justify-between gap-4">
      <TotpCodeDisplay
        :formatted-code="formattedCode"
        :formatted-next-code="formattedNextCode"
        :is-error="isError"
        :time-left="timeLeft"
        :copied="copied"
        :copied-next="copiedNext"
        :is-steam="isSteam"
        @copy="copyCode"
        @copy-next="copyNextCode"
      />

      <TotpCountdown
        :time-left="timeLeft"
        :period="account.period || 30"
        :is-error="isError"
      />
    </div>

    <!-- Progress bar -->
    <TotpProgressBar
      :progress-percent="progressPercent"
      :time-left="timeLeft"
      :period="account.period || 30"
      :is-error="isError"
    />
  </div>

  <!-- QR Modal -->
  <AccountQrModal
    v-if="showQrModal"
    :account="account"
    @close="showQrModal = false"
  />
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import AccountAvatar from './AccountAvatar.vue'
import AccountEditButton from './AccountEditButton.vue'
import AccountDeleteButton from './AccountDeleteButton.vue'
import TotpCodeDisplay from './TotpCodeDisplay.vue'
import TotpCountdown from './TotpCountdown.vue'
import TotpProgressBar from './TotpProgressBar.vue'
import AccountQrModal from './AccountQrModal.vue'
import { useTotp } from '../composables/useTotp.js'
import { getAccountDefaults } from '../totp.js'

const props = defineProps({
  account: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['remove', 'update'])

const isEditing = ref(false)
const editName = ref('')
const editInput = ref(null)
const showQrModal = ref(false)

function startEdit() {
  editName.value = props.account.name
  isEditing.value = true
  nextTick(() => {
    editInput.value?.focus()
    editInput.value?.select()
  })
}

function cancelEdit() {
  isEditing.value = false
  editName.value = ''
}

function saveEdit() {
  const trimmed = editName.value.trim()
  if (trimmed && trimmed !== props.account.name) {
    emit('update', { id: props.account.id, name: trimmed })
  }
  isEditing.value = false
}

// Protocol parameter badges shown under account name
const protocolBadges = computed(() => {
  const defaults = getAccountDefaults()
  const acc = props.account
  const badges = []

  if (acc.type === 'steam') {
    badges.push({ label: '🎮 Steam Guard', class: 'bg-blue-950/50 text-blue-300 border-blue-800/50' })
    return badges
  }

  const algorithm = acc.algorithm || defaults.algorithm
  const digits = acc.digits || defaults.digits
  const period = acc.period || defaults.period

  if (algorithm !== 'SHA-1') {
    badges.push({ label: algorithm, class: 'bg-violet-950/50 text-violet-300 border-violet-800/50' })
  }
  if (digits !== 6) {
    badges.push({ label: `${digits}-digit`, class: 'bg-indigo-950/50 text-indigo-300 border-indigo-800/50' })
  }
  if (period !== 30) {
    badges.push({ label: `${period}s`, class: 'bg-amber-950/50 text-amber-300 border-amber-800/50' })
  }

  return badges
})

const {
  formattedCode,
  formattedNextCode,
  isError,
  timeLeft,
  progressPercent,
  isSteam,
  copied,
  copiedNext,
  copyCode,
  copyNextCode,
} = useTotp(() => props.account)
</script>
