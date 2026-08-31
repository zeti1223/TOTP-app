<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <AppHeader
      :count="accounts.length"
      :is-unlocked="isUnlocked"
      @lock="lockVault"
    />

    <main class="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
      <!-- Vault Locked / Setup State -->
      <VaultAuth
        v-if="!isUnlocked"
        :is-vault-initialized="isVaultInitialized"
        :auth-error="authError"
        :is-loading="isLoading"
        @init-vault="initVault"
        @unlock-vault="unlockVault"
        @reset-vault="resetVault"
      />

      <!-- Unlocked Main Content -->
      <div v-else class="space-y-6">
        <!-- Add Account -->
        <AddAccount @add-account="addAccount" />

        <!-- Accounts List -->
        <AccountList
          :accounts="accounts"
          @remove-account="removeAccount"
          @update-account="updateAccount"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import AddAccount from './components/AddAccount.vue'
import AccountList from './components/AccountList.vue'
import VaultAuth from './components/VaultAuth.vue'
import { useAccounts } from './composables/useAccounts.js'

const {
  isVaultInitialized,
  isUnlocked,
  accounts,
  authError,
  isLoading,
  initVault,
  unlockVault,
  lockVault,
  resetVault,
  addAccount,
  removeAccount,
  updateAccount,
} = useAccounts()
</script>
