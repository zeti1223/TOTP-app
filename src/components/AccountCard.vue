<template>
  <div
    @click="!isEditing && copyCode()"
    class="bg-[#1e1e1e] border-2 border-[#333333] rounded-xl px-5 py-4 flex flex-col gap-3 neo-shadow-hover transition-all cursor-pointer"
  >
    <div class="flex items-center justify-between gap-2 min-h-[36px]">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <AccountAvatar :name="isEditing ? (editName || account.name) : account.name" />

        <form
          v-if="isEditing"
          @submit.prevent="saveEdit"
          @click.stop
          class="flex items-center gap-1.5 flex-1 min-w-0"
        >
          <input
            ref="editInput"
            v-model="editName"
            type="text"
            maxlength="50"
            class="w-full bg-[#141414] border-2 border-[#6965db] rounded-lg px-2.5 py-1 text-sm font-semibold text-[#e3e3e3] placeholder-[#999999] neo-input"
            placeholder="Account name"
            @keydown.esc.stop="cancelEdit"
          />
          <button
            type="submit"
            @click.stop
            title="Save name"
            class="text-[#12b886] hover:text-[#12b886] p-1.5 rounded-lg bg-[#1e1e1e] border-2 border-[#333333] neo-button flex-shrink-0"
          >
            <i class="fa-solid fa-check text-sm block"></i>
          </button>
          <button
            type="button"
            @click.stop="cancelEdit"
            title="Cancel"
            class="text-[#999999] hover:text-[#e3e3e3] p-1.5 rounded-lg bg-[#1e1e1e] border-2 border-[#333333] neo-button flex-shrink-0"
          >
            <i class="fa-solid fa-xmark text-sm block"></i>
          </button>
        </form>

        <div v-else class="flex flex-col min-w-0 flex-1">
          <span
            @click.stop
            class="font-semibold text-[#e3e3e3] truncate cursor-pointer hover:text-white transition-colors"
            :title="`${account.name} (Double-click to edit)`"
            @dblclick="startEdit"
          >
            {{ account.name }}
          </span>
          <div v-if="protocolBadges.length" @click.stop class="flex flex-wrap gap-1 mt-0.5">
            <span
              v-for="badge in protocolBadges"
              :key="badge.label"
              class="text-[10px] px-1.5 py-0.5 rounded font-medium border-2"
              :class="badge.class"
            >{{ badge.label }}</span>
          </div>
        </div>
      </div>

      <div v-if="!isEditing" class="flex items-center gap-0.5 flex-shrink-0">
        <button
          @click.stop="showQrModal = true"
          title="Show QR code for transfer"
          class="p-1.5 rounded-lg text-[#999999] hover:text-[#6965db] bg-[#1e1e1e] border-2 border-[#333333] neo-button"
        >
          <i class="fa-solid fa-qrcode text-sm block"></i>
        </button>
        <AccountEditButton @edit="startEdit" />
        <AccountDeleteButton @delete="showDeleteModal = true" />
      </div>
    </div>

    <div class="flex items-center justify-between gap-4" @click.stop>
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

    <div @click.stop>
      <TotpProgressBar
        :progress-percent="progressPercent"
        :time-left="timeLeft"
        :period="account.period || 30"
        :is-error="isError"
      />
    </div>
  </div>

  <AccountQrModal
    v-if="showQrModal"
    :account="account"
    @close="showQrModal = false"
  />

  <AccountDeleteModal
    v-if="showDeleteModal"
    :account="account"
    @close="showDeleteModal = false"
    @confirm="$emit('remove', $event)"
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
import AccountDeleteModal from './AccountDeleteModal.vue'
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
const showDeleteModal = ref(false)

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

const protocolBadges = computed(() => {
  const defaults = getAccountDefaults()
  const acc = props.account
  const badges = []

  if (acc.type === 'steam') {
    badges.push({ label: '🎮 Steam Guard', class: 'bg-[#1e1e1e] text-[#6965db] border-[#333333]' })
    return badges
  }

  const algorithm = acc.algorithm || defaults.algorithm
  const digits = acc.digits || defaults.digits
  const period = acc.period || defaults.period

  if (algorithm !== 'SHA-1') {
    badges.push({ label: algorithm, class: 'bg-[#1e1e1e] text-[#f06595] border-[#333333]' })
  }
  if (digits !== 6) {
    badges.push({ label: `${digits}-digit`, class: 'bg-[#1e1e1e] text-[#6965db] border-[#333333]' })
  }
  if (period !== 30) {
    badges.push({ label: `${period}s`, class: 'bg-[#1e1e1e] text-[#ff922b] border-[#333333]' })
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
