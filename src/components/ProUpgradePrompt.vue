<template>
  <!-- Overlay shown when the user hits the free-tier preset limit -->
  <div
    class="absolute inset-0 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
      <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100">
        {{ t('proUpgradeTitle') }}
      </h3>
      <button
        @click="emit('close')"
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        :title="t('proClose')"
      >
        <X :size="16" />
      </button>
    </div>

    <!-- Limit message -->
    <p class="px-3 pb-2 text-xs text-gray-500 dark:text-gray-400 shrink-0">
      {{ t('proUpgradeLimitReached', { params: { max: freeMaxPresets } }) }}
    </p>

    <!-- ── Beta section (only during beta window) ── -->
    <template v-if="isBetaActive()">
      <div class="px-3 pb-2 shrink-0">
        <p class="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
          {{ t('proBetaTitle') }}
        </p>
        <p class="text-[11px] text-gray-500 dark:text-gray-400">
          {{ t('proBetaDescription') }}
        </p>
      </div>

      <!-- Tally form embedded — user submits email, sees code on thank-you page -->
      <div
        class="flex-1 mx-3 mb-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 min-h-0"
      >
        <iframe
          :src="tallyEmbedUrl"
          width="100%"
          height="100%"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
          title="Beta access form"
          class="w-full h-full"
          style="min-height: 200px"
        />
      </div>

      <!-- Code input: user copies the code from Tally's thank-you page -->
      <div class="px-3 pb-2 space-y-1.5 shrink-0">
        <div class="flex gap-1.5 items-center">
          <input
            v-model="betaCode"
            :placeholder="t('proBetaCodePlaceholder')"
            :disabled="activating || activationSuccess"
            @keyup.enter="activateBeta"
            class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            @click="activateBeta"
            :disabled="!betaCode.trim() || activating || activationSuccess"
            class="px-2.5 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {{ activating ? t('proBetaActivating') : t('proBetaActivate') }}
          </button>
        </div>

        <!-- Feedback -->
        <p v-if="errorKey" class="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle :size="11" />
          {{ t(errorKey) }}
        </p>
        <p
          v-if="activationSuccess"
          class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"
        >
          <CheckCircle :size="11" />
          {{ t('proBetaSuccess') }}
        </p>
      </div>
    </template>

    <!-- ── Beta expired ── -->
    <template v-else>
      <p class="px-3 pb-3 text-xs text-amber-600 dark:text-amber-400">
        {{ t('proBetaErrorExpired') }}
      </p>
    </template>

    <!-- Divider -->
    <div class="flex items-center gap-2 px-3 pb-2 shrink-0">
      <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
      <span class="text-[10px] text-gray-400">or</span>
      <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
    </div>

    <!-- Pro upgrade button (stub — Stripe not yet implemented) -->
    <div class="px-3 pb-3 shrink-0">
      <button
        disabled
        class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white opacity-60 cursor-not-allowed"
        title="Coming soon"
      >
        <Sparkles :size="13" />
        {{ t('proUpgradeButton') }}
        <span class="text-[10px] opacity-80">{{ t('proUpgradeComingSoon') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X, AlertCircle, CheckCircle, Sparkles } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { usePro } from '@/composables/usePro'
import type { TranslationKey } from '@/core/utils/i18n'

const emit = defineEmits<{
  close: []
  activated: []
}>()

const { t } = useI18nWrapper()
const { isBetaActive, activateBetaCode, tallyEmbedUrl, freeMaxPresets } = usePro()

const betaCode = ref('')
const activating = ref(false)
const activationSuccess = ref(false)
const errorKey = ref<TranslationKey | null>(null)

async function activateBeta() {
  if (!betaCode.value.trim() || activating.value) return

  activating.value = true
  errorKey.value = null

  const result = await activateBetaCode(betaCode.value)

  activating.value = false

  if (result.success) {
    activationSuccess.value = true
    // Close after a short delay so the user sees the success message
    setTimeout(() => emit('activated'), 1200)
  } else {
    errorKey.value = result.error === 'beta_expired' ? 'proBetaErrorExpired' : 'proBetaErrorInvalid'
  }
}
</script>
