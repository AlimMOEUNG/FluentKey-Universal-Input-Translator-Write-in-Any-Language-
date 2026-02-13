<template>
  <div class="preset-tabs-container">
    <div class="tabs-header">
      <!-- Left side: Preset tabs -->
      <div class="preset-tabs-left">
        <button
          v-for="(preset, index) in presets"
          :key="preset.id"
          @click="$emit('select-preset', preset.id)"
          :class="['tab-button', { active: preset.id === activePresetId, locked: isPresetLocked(index) }]"
          :title="isPresetLocked(index) ? t('presetLockedTooltip') : `${preset.name}: ${preset.keyboardShortcut}`"
        >
          <!-- Lock icon for locked presets (beyond free limit) -->
          <Lock v-if="isPresetLocked(index)" :size="11" class="lock-icon" />
          <span class="tab-name">{{ preset.name }}</span>
        </button>

        <button @click="$emit('add-preset')" class="tab-button add-button" :title="t('addPreset')">
          <Plus :size="14" />
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Lock } from 'lucide-vue-next'
import type { TranslationPreset } from '@/types/common'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { usePro } from '@/composables/usePro'

const { t } = useI18nWrapper()
const { isPresetLocked } = usePro()

interface Props {
  presets: TranslationPreset[]
  activePresetId: string | null
}

defineProps<Props>()

defineEmits<{
  'select-preset': [id: string]
  'add-preset': []
}>()
</script>

<style scoped>
.preset-tabs-container {
  margin-bottom: 0.75rem;
}

.tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid theme('colors.gray.200');
}

:root[data-theme='dark'] .tabs-header {
  border-bottom-color: theme('colors.gray.700');
}

/* Left side: Preset tabs */
.preset-tabs-left {
  display: flex;
  gap: 0.15rem;
  flex: 1;
  min-width: 0; /* Allow flex items to shrink */
}

.preset-tabs-left::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.tab-button {
  padding: 0.4rem 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: 1.5px solid theme('colors.gray.300');
  background-color: theme('colors.white');
  color: theme('colors.gray.700');
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

:root[data-theme='dark'] .tab-button {
  background-color: theme('colors.gray.800');
  border-color: theme('colors.gray.600');
  color: theme('colors.gray.300');
}

.tab-name {
  overflow: hidden;
  text-overflow: clip;
  display: block;
}

.tab-button:hover {
  background-color: theme('colors.gray.50');
  border-color: theme('colors.gray.400');
  color: theme('colors.gray.900');
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:root[data-theme='dark'] .tab-button:hover {
  background-color: theme('colors.gray.700');
  border-color: theme('colors.gray.500');
  color: theme('colors.gray.100');
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.tab-button.active {
  background-color: theme('colors.blue.600');
  color: theme('colors.white');
  border-color: theme('colors.blue.600');
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

:root[data-theme='dark'] .tab-button.active {
  background-color: theme('colors.blue.500');
  border-color: theme('colors.blue.500');
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.5);
}

/* Locked preset tab — grayed out, not interactive */
.tab-button.locked {
  opacity: 0.45;
  cursor: not-allowed;
  border-style: dashed;
}

.tab-button.locked:hover {
  transform: none;
  box-shadow: none;
  background-color: theme('colors.white');
  border-color: theme('colors.gray.300');
  color: theme('colors.gray.700');
}

:root[data-theme='dark'] .tab-button.locked:hover {
  background-color: theme('colors.gray.800');
  border-color: theme('colors.gray.600');
  color: theme('colors.gray.300');
  box-shadow: none;
}

/* Lock icon color */
.lock-icon {
  flex-shrink: 0;
  color: theme('colors.amber.500');
}

.add-button {
  background-color: theme('colors.emerald.50');
  color: theme('colors.emerald.600');
  border-color: theme('colors.emerald.300');
  padding: 0.4rem 0.5rem;
  flex: 0 0 auto;
}

:root[data-theme='dark'] .add-button {
  background-color: theme('colors.emerald.900');
  color: theme('colors.emerald.400');
  border-color: theme('colors.emerald.700');
}

.add-button:hover {
  background-color: theme('colors.emerald.100');
  color: theme('colors.emerald.700');
  border-color: theme('colors.emerald.400');
}

:root[data-theme='dark'] .add-button:hover {
  background-color: theme('colors.emerald.800');
  color: theme('colors.emerald.300');
  border-color: theme('colors.emerald.600');
}

</style>
