<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- Relative container so the upgrade overlay can be positioned absolutely.
       min-h-[420px] is applied when the prompt is open to give the iframe room. -->
  <div class="space-y-2 relative" :class="{ 'min-h-[420px]': showUpgradePrompt }">
    <!-- Preset tab bar with add button -->
    <PresetTabs
      :presets="presetsSettings.presets as TranslationPreset[]"
      :active-preset-id="presetsSettings.activePresetId"
      @select-preset="selectPreset"
      @add-preset="addPreset"
    />

    <!-- Active preset editor -->
    <PresetEditor
      v-if="activePreset"
      :preset="activePreset"
      :all-presets="presetsSettings.presets"
      :can-delete="presetsSettings.presets.length > 1"
      :global-provider="presetsSettings.provider"
      :is-pinned="presetsSettings.pinnedPresetId === activePreset.id"
      :preset-index="activePresetIndex"
      @update-preset="updatePreset"
      @delete-preset="deletePreset"
      @set-pinned="setPinnedPreset"
    />

    <!-- Pro/Beta upgrade prompt (shown when free-tier limit is reached) -->
    <ProUpgradePrompt
      v-if="showUpgradePrompt"
      @close="showUpgradePrompt = false"
      @activated="showUpgradePrompt = false"
    />

    <!-- Info dialog (replaces native alert) -->
    <ConfirmDialog
      :show="infoDialog.show"
      :title="infoDialog.title"
      :message="infoDialog.message"
      :variant="infoDialog.variant"
      confirm-text="OK"
      cancel-text="OK"
      @confirm="closeInfoDialog"
      @cancel="closeInfoDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { usePresetsSettings } from '@/composables/usePresetsSettings'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import PresetTabs from '@/components/PresetTabs.vue'
import PresetEditor from '@/components/PresetEditor.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ProUpgradePrompt from '@/components/ProUpgradePrompt.vue'
import type { Preset, TranslationPreset } from '@/types/common'

const { t } = useI18nWrapper()

const {
  presetsSettings,
  addPreset: addPresetHelper,
  updatePreset: updatePresetHelper,
  deletePreset: deletePresetHelper,
  setActivePreset,
  getActivePreset,
  setPinnedPreset,
  canAddPreset,
} = usePresetsSettings()

// Derived active preset from the current activePresetId
const activePreset = computed(() => getActivePreset())

// Index of the active preset in the presets array (needed by PresetEditor for lock check)
const activePresetIndex = computed(() =>
  presetsSettings.value.presets.findIndex((p) => p.id === presetsSettings.value.activePresetId)
)

// Controls visibility of the Pro/Beta upgrade overlay
const showUpgradePrompt = ref(false)

// Info dialog state (replaces native alert calls)
const infoDialog = reactive({
  show: false,
  title: '',
  message: '',
  variant: 'warning' as 'warning' | 'info' | 'danger',
})

function showInfoDialog(
  title: string,
  message: string,
  variant: 'warning' | 'info' | 'danger' = 'warning'
) {
  infoDialog.title = title
  infoDialog.message = message
  infoDialog.variant = variant
  infoDialog.show = true
}

function closeInfoDialog() {
  infoDialog.show = false
}

function selectPreset(id: string) {
  setActivePreset(id)
}

function addPreset() {
  if (!canAddPreset()) {
    // Show the upgrade prompt instead of a plain info dialog
    showUpgradePrompt.value = true
    return
  }
  const newPreset = addPresetHelper()
  if (!newPreset) {
    showUpgradePrompt.value = true
  }
}

function updatePreset(updatedPreset: Preset) {
  updatePresetHelper(updatedPreset)
}

function deletePreset(id: string) {
  if (presetsSettings.value.presets.length <= 1) {
    showInfoDialog('Cannot Delete', t('cannotDeleteLastPreset'), 'info')
    return
  }
  deletePresetHelper(id)
}
</script>
