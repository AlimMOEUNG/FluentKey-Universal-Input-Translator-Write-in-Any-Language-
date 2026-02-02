<template>
  <div class="preset-editor space-y-1.5">
    <!-- Preset Name -->
    <div class="relative">
      <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
        {{ t('presetName') }}
      </label>
      <div class="flex gap-1 items-center">
        <input
          v-model="localPreset.name"
          :placeholder="t('presetNamePlaceholder')"
          class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <!-- Save/Undo buttons (only visible if changes detected) -->
        <template v-if="hasUnsavedChanges">
          <button
            @click="undoChanges"
            class="px-2 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
            :title="t('undoChanges')"
          >
            <RotateCcw :size="12" />
          </button>
          <button
            @click="savePreset"
            class="px-2 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
            :title="t('saveChanges')"
          >
            <Check :size="12" />
          </button>
        </template>
      </div>
    </div>

    <!-- Source Language -->
    <div>
      <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
        {{ t('sourceLanguage') }}
      </label>
      <select
        v-model="localPreset.sourceLang"
        class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="auto">{{ t('autoDetect') }}</option>
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="es">Spanish</option>
        <option value="de">German</option>
        <option value="it">Italian</option>
        <option value="pt">Portuguese</option>
        <option value="nl">Dutch</option>
        <option value="pl">Polish</option>
        <option value="ru">Russian</option>
        <option value="zh">Chinese</option>
        <option value="ja">Japanese</option>
        <option value="ko">Korean</option>
      </select>
    </div>

    <!-- Target Language -->
    <div>
      <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
        {{ t('targetLanguage') }}
      </label>
      <select
        v-model="localPreset.targetLang"
        class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="es">Spanish</option>
        <option value="de">German</option>
        <option value="it">Italian</option>
        <option value="pt">Portuguese</option>
        <option value="nl">Dutch</option>
        <option value="pl">Polish</option>
        <option value="ru">Russian</option>
        <option value="zh">Chinese</option>
        <option value="ja">Japanese</option>
        <option value="ko">Korean</option>
      </select>
    </div>

    <!-- Keyboard Shortcut -->
    <div>
      <label class="block text-[10px] font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
        {{ t('keyboardShortcut') }}
      </label>
      <input
        v-model="localPreset.keyboardShortcut"
        @keydown="handleShortcutInput"
        @keyup="handleShortcutKeyUp"
        placeholder="Alt+T, Alt+T+1, or Alt"
        class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
      />
      <p v-if="shortcutError" class="text-[10px] text-red-600 mt-0.5">
        {{ shortcutError }}
      </p>
      <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
        {{ t('shortcutHelp') }}
      </p>
    </div>

    <!-- Unsaved changes warning -->
    <div
      v-if="hasUnsavedChanges"
      class="flex items-center justify-between gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded"
    >
      <span class="text-[10px] text-yellow-800 dark:text-yellow-200">
        {{ t('unsavedChanges') }}
      </span>
      <div class="flex gap-2">
        <button
          @click="undoChanges"
          class="px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {{ t('undo') }}
        </button>
        <button
          @click="savePreset"
          class="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {{ t('saveChanges') }}
        </button>
      </div>
    </div>

    <!-- Delete Button -->
    <button
      v-if="canDelete"
      @click="showDeleteDialog = true"
      class="w-full px-2 py-1.5 text-xs rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
    >
      {{ t('deletePreset') }}
    </button>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :title="t('presetDeleteTitle')"
      :message="t('presetDeleteMessage', { params: { name: localPreset.name } })"
      :confirm-text="t('deletePreset')"
      :cancel-text="t('cancel')"
      variant="danger"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Check, RotateCcw } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import {
  buildShortcutFromEvent,
  normalizeShortcut,
  KeyboardSequenceDetector,
} from '@/core/utils/keyboardUtils'
import type { TranslationPreset } from '@/types/common'
import ConfirmDialog from './ConfirmDialog.vue'

const { t } = useI18nWrapper()

// Sequence detector for multi-key shortcuts
const sequenceDetector = new KeyboardSequenceDetector()

interface Props {
  preset: TranslationPreset
  allPresets: TranslationPreset[]
  canDelete: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-preset': [preset: TranslationPreset]
  'delete-preset': [id: string]
}>()

// Local copy of preset for editing
const localPreset = ref<TranslationPreset>({ ...props.preset })
const shortcutError = ref('')
const showDeleteDialog = ref(false)

// Detect unsaved changes
const hasUnsavedChanges = computed(() => {
  return (
    localPreset.value.name !== props.preset.name ||
    localPreset.value.sourceLang !== props.preset.sourceLang ||
    localPreset.value.targetLang !== props.preset.targetLang ||
    localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut
  )
})

// Watch for external preset changes (e.g., when switching tabs)
watch(
  () => props.preset,
  (newPreset) => {
    localPreset.value = { ...newPreset }
    shortcutError.value = ''
  },
  { deep: true }
)

/**
 * Undo changes to the local preset, reverting to the passed prop
 */
function undoChanges() {
  localPreset.value = { ...props.preset }
  shortcutError.value = ''
}

/**
 * Handle keyboard input for shortcut field
 * Supports multi-key sequences (Alt+T+1), single keys (T), modifiers (Alt), etc.
 */
function handleShortcutInput(event: KeyboardEvent) {
  // Allow Backspace and Delete for editing
  if (event.key === 'Backspace' || event.key === 'Delete') {
    sequenceDetector.reset()
    return
  }

  event.preventDefault()

  // Process through sequence detector for multi-key support
  const sequenceShortcut = sequenceDetector.processKeyDown(event)

  // Also build simple shortcut for single-key shortcuts
  const simpleShortcut = buildShortcutFromEvent(event)

  // Use sequence if it's longer, otherwise use simple
  const shortcut = sequenceShortcut || simpleShortcut

  // Only update if we got a valid shortcut (not null)
  if (shortcut) {
    localPreset.value.keyboardShortcut = shortcut
    validateShortcut()
  }
}

/**
 * Handle keyup to reset sequence detector
 */
function handleShortcutKeyUp(event: KeyboardEvent) {
  sequenceDetector.processKeyUp(event)
}

/**
 * Validate shortcut format and uniqueness (without saving)
 * Accepts:
 * - Modifier only: "Alt", "Ctrl"
 * - Modifier + key: "Alt+T", "Ctrl+1"
 * - Modifier + 2 keys: "Alt+T+1", "Ctrl+A+B" (max 2 keys)
 *
 * DOES NOT accept:
 * - Single key without modifier (e.g., "T" or "1")
 * - More than 2 keys after modifiers (e.g., "Alt+A+B+C")
 *
 * Handles permutations: "Alt+T+1" === "Alt+1+T"
 */
function validateShortcut(): boolean {
  const shortcut = localPreset.value.keyboardShortcut.trim()

  // Validate format - must be non-empty and contain valid characters
  if (!shortcut) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  // Valid pattern: must have at least one modifier
  // Examples: "Alt", "Alt+T", "Alt+T+1", "Ctrl+Alt+Shift+A"
  // INVALID: "T", "1" (no modifier)
  const validPattern = /^(Ctrl|Alt|Shift|Meta)(\+(Ctrl|Alt|Shift|Meta|[A-Z0-9]))*$/i
  if (!validPattern.test(shortcut)) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  // Count non-modifier keys
  const tokens = shortcut.split('+').map((t) => t.trim())
  const modifiers = ['ctrl', 'alt', 'shift', 'meta', 'control', 'cmd', 'command', 'super']
  const keys = tokens.filter((token) => !modifiers.includes(token.toLowerCase()))

  // Reject if more than 2 keys
  if (keys.length > 2) {
    shortcutError.value = t('shortcutTooManyKeys')
    return false
  }

  // Normalize shortcuts for comparison to ensure consistency (handles permutations)
  const normalizedShortcut = normalizeShortcut(shortcut)

  // Reject if normalization returned empty (e.g., single key without modifier)
  if (!normalizedShortcut) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  // Validate uniqueness (CRITICAL) - uses normalized shortcuts to handle permutations
  const duplicate = props.allPresets.find(
    (p) => p.id !== props.preset.id && normalizeShortcut(p.keyboardShortcut) === normalizedShortcut
  )

  if (duplicate) {
    shortcutError.value = t('shortcutDuplicate', { params: { name: duplicate.name } })
    return false
  }

  shortcutError.value = ''
  return true
}

/**
 * Save preset changes (called only when user clicks save button)
 */
function savePreset() {
  // Validate shortcut before saving
  if (!validateShortcut()) {
    return // Don't save if validation fails
  }

  // Emit the update
  emit('update-preset', { ...localPreset.value })
  console.log('[PresetEditor] Preset saved:', localPreset.value)
}

/**
 * Handle delete confirmation from dialog
 */
function handleDeleteConfirm() {
  // Close dialog
  showDeleteDialog.value = false

  // Emit delete event
  emit('delete-preset', props.preset.id)
}
</script>

<style scoped>
.preset-editor {
  padding-bottom: 0.5rem;
}
</style>
