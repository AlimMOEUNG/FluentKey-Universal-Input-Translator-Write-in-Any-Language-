<template>
  <div class="preset-tabs-container">
    <div class="tabs-header">
      <!-- Left side: Preset tabs -->
      <div class="preset-tabs-left">
        <button
          v-for="preset in presets"
          :key="preset.id"
          @click="$emit('select-preset', preset.id)"
          :class="['tab-button', { active: preset.id === activePresetId }]"
          :title="`${preset.name}: ${preset.keyboardShortcut}`"
        >
          <span class="tab-name">{{ preset.name }}</span>
        </button>

        <button @click="$emit('add-preset')" class="tab-button add-button" :title="t('addPreset')">
          <Plus :size="14" />
        </button>
      </div>

      <!-- Right side: Provider selector -->
      <div class="provider-tab-wrapper">
        <div class="provider-separator"></div>
        <button
          @click="$emit('toggle-provider')"
          class="provider-tab"
          :title="t('providerLabel')"
        >
          <span class="provider-name">{{ providerDisplayName }}</span>
          <ChevronDown :size="14" class="chevron" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, ChevronDown } from 'lucide-vue-next'
import type { TranslationPreset } from '@/types/common'
import { useI18nWrapper } from '@/composables/useI18nWrapper'

const { t } = useI18nWrapper()

interface Props {
  presets: TranslationPreset[]
  activePresetId: string | null
  provider: string
}

const props = defineProps<Props>()

defineEmits<{
  'select-preset': [id: string]
  'add-preset': []
  'toggle-provider': []
}>()

// Provider display names mapping
const providerNames: Record<string, string> = {
  google: 'Google',
  builtin: 'Chrome AI',
  deepl: 'DeepL',
  gemini: 'Gemini',
  chatgpt: 'ChatGPT',
  groq: 'Groq',
  ollama: 'Ollama',
  openrouter: 'OpenRouter',
  custom: 'Custom',
}

const providerDisplayName = computed(() => {
  return providerNames[props.provider] || props.provider
})
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

/* Right side: Provider tab */
.provider-tab-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.provider-separator {
  width: 1px;
  height: 24px;
  background-color: theme('colors.gray.300');
}

:root[data-theme='dark'] .provider-separator {
  background-color: theme('colors.gray.600');
}

.provider-tab {
  padding: 0.4rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: 1.5px solid theme('colors.purple.400');
  background: linear-gradient(135deg, theme('colors.purple.50'), theme('colors.purple.100'));
  color: theme('colors.purple.700');
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  flex-shrink: 0;
}

:root[data-theme='dark'] .provider-tab {
  background: linear-gradient(135deg, theme('colors.purple.900'), theme('colors.purple.800'));
  border-color: theme('colors.purple.600');
  color: theme('colors.purple.300');
}

.provider-name {
  font-weight: 700;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron {
  flex-shrink: 0;
  opacity: 0.7;
}

.provider-tab:hover {
  background: linear-gradient(135deg, theme('colors.purple.100'), theme('colors.purple.200'));
  border-color: theme('colors.purple.500');
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(147, 51, 234, 0.3);
}

:root[data-theme='dark'] .provider-tab:hover {
  background: linear-gradient(135deg, theme('colors.purple.800'), theme('colors.purple.700'));
  border-color: theme('colors.purple.500');
  box-shadow: 0 2px 6px rgba(147, 51, 234, 0.5);
}
</style>
