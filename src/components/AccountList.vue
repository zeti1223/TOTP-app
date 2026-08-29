<template>
  <div>
    <!-- Empty State -->
    <transition name="fade">
      <EmptyState v-if="accounts.length === 0" />
    </transition>

    <!-- Accounts List -->
    <transition-group
      name="list"
      tag="div"
      class="space-y-3"
    >
      <AccountCard
        v-for="account in accounts"
        :key="account.id"
        :account="account"
        @remove="$emit('remove-account', $event)"
        @update="$emit('update-account', $event)"
      />
    </transition-group>
  </div>
</template>

<script setup>
import AccountCard from './AccountCard.vue'
import EmptyState from './EmptyState.vue'

defineProps({
  accounts: {
    type: Array,
    required: true,
  },
})

defineEmits(['remove-account', 'update-account'])
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.list-enter-active {
  transition: all 0.3s ease;
}
.list-leave-active {
  transition: all 0.25s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.list-move {
  transition: transform 0.3s ease;
}
</style>
