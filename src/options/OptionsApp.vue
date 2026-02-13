<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-200">
          {{ t('optionsTitle') }}
        </h1>
        <button
          @click="cycleTheme"
          class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          :title="t('themeToggle')"
        >
          <component :is="themeIcon" :size="18" />
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-6 py-6">
      <!-- List View: visible when not editing -->
      <div v-if="!editingId" class="space-y-4">
        <!-- New Transformation Button -->
        <button
          @click="startNewTransform"
          :disabled="!canCreateNew"
          class="w-full px-4 py-3 rounded-lg border-2 border-dashed transition-colors"
          :class="
            canCreateNew
              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900'
              : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          "
        >
          <Plus :size="18" class="inline mr-2" />
          {{
            canCreateNew
              ? t('optionsNewTransformation')
              : t('optionsMaxReached', { params: { max: MAX_TRANSFORMS } })
          }}
        </button>

        <!-- Empty State -->
        <div v-if="transforms.length === 0" class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            {{ t('optionsEmptyList') }}
          </p>
        </div>

        <!-- Transformation Cards -->
        <div v-else class="grid gap-3">
          <div
            v-for="transform in transforms"
            :key="transform.id"
            class="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {{ transform.name }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{
                    t('optionsMappings', {
                      params: { count: Object.keys(transform.charMap).length },
                    })
                  }}
                </p>
              </div>
              <div class="flex gap-2 ml-4">
                <button
                  @click="startEdit(transform.id)"
                  class="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  {{ t('optionsEditButton') }}
                </button>
                <button
                  @click="confirmDelete(transform)"
                  class="px-3 py-1.5 text-xs rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                >
                  {{ t('optionsDeleteButton') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Editor View: visible when editingId is set -->
      <div v-else class="space-y-4">
        <!-- Name Input -->
        <div>
          <label class="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
            {{ t('optionsEditorName') }}
          </label>
          <input
            v-model="editorState.name"
            :placeholder="t('optionsEditorNamePlaceholder')"
            class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Pre-populate Dropdown -->
        <div>
          <label class="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
            {{ t('optionsPopulateLabel') }}
          </label>
          <div class="flex gap-2">
            <select
              v-model="selectedBaseStyle"
              class="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-unicode"
            >
              <option value="">{{ t('optionsPopulateLabel') }}</option>
              <option
                v-for="style in EXPORTABLE_STYLES"
                :key="style"
                :value="style"
                class="font-unicode"
              >
                {{ styleLabel(style) }}
              </option>
            </select>
            <button
              @click="loadBaseStyle"
              :disabled="!selectedBaseStyle"
              class="px-4 py-2 text-sm rounded transition-colors"
              :class="
                selectedBaseStyle
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              "
            >
              {{ t('optionsPopulateButton') }}
            </button>
          </div>
        </div>

        <!-- Mappings Table -->
        <div>
          <label class="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {{ t('optionsMappings', { params: { count: editorState.charMap.length } }) }}
          </label>
          <div class="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
            <!-- Table Header -->
            <div
              class="grid grid-cols-[1fr_2fr_auto] gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              <div>{{ t('optionsTableSource') }}</div>
              <div>{{ t('optionsTableTarget') }}</div>
              <div></div>
            </div>
            <!-- Table Rows -->
            <div class="max-h-96 overflow-y-auto">
              <div
                v-for="(mapping, index) in editorState.charMap"
                :key="index"
                class="grid grid-cols-[1fr_2fr_auto] gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700 items-center"
              >
                <input
                  v-model="mapping.source"
                  maxlength="1"
                  class="px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <input
                  v-model="mapping.target"
                  class="px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-unicode"
                />
                <button
                  @click="removeMapping(index)"
                  class="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
          <!-- Add Mapping Button -->
          <button
            @click="addMapping"
            class="mt-2 w-full px-3 py-2 text-sm rounded border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus :size="16" class="inline mr-1" />
            {{ t('optionsAddMapping') }}
          </button>
        </div>

        <!-- Live Preview -->
        <div>
          <label class="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
            {{ t('optionsPreviewLabel') }}
          </label>
          <input
            v-model="previewInput"
            :placeholder="t('optionsPreviewPlaceholder')"
            class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <div
            class="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 font-unicode min-h-[3rem]"
          >
            {{ previewOutput }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-2">
          <button
            @click="saveTransform"
            :disabled="!canSave"
            class="flex-1 px-4 py-2 text-sm rounded transition-colors"
            :class="
              canSave
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            "
          >
            {{ t('optionsSaveButton') }}
          </button>
          <button
            @click="cancelEdit"
            class="flex-1 px-4 py-2 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {{ t('optionsCancelButton') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="deleteDialogState.show"
      :title="t('optionsDeleteTitle')"
      :message="t('optionsDeleteMessage', { params: { name: deleteDialogState.transformName } })"
      :confirm-text="t('optionsDeleteButton')"
      :cancel-text="t('cancel')"
      variant="danger"
      @confirm="executeDelete"
      @cancel="deleteDialogState.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Sun, Moon, Monitor, Plus, Trash2 } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useThemeMode } from '@/composables/useThemeMode'
import type { CustomTransformation } from '@/types/common'
import {
  getAllCustomTransforms,
  createCustomTransform,
  updateCustomTransform,
  deleteCustomTransform,
  MAX_TRANSFORMS,
} from '@/services/customTransformService'
import { EXPORTABLE_STYLES, generateCharMapForStyle } from '@/core/transformation/exportableStyles'
import {
  TransformationEngine,
  applyCustomCharMap,
} from '@/core/transformation/TransformationEngine'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const { t } = useI18nWrapper()
const { themeMode, cycleTheme } = useThemeMode()

// Transformation engine for style label generation
const transformationEngine = new TransformationEngine()

// ─── State ────────────────────────────────────────────────────────

// List of all custom transformations
const transforms = ref<CustomTransformation[]>([])

// ID of the transformation being edited (null when viewing list)
const editingId = ref<string | null>(null)

// Editor scratch state (name + array of source/target pairs)
const editorState = ref<{
  name: string
  charMap: Array<{ source: string; target: string }>
}>({
  name: '',
  charMap: [],
})

// Pre-populate dropdown selection
const selectedBaseStyle = ref('')

// Live preview input text
const previewInput = ref('Type to preview...')

// Delete confirmation state
const deleteDialogState = ref({
  show: false,
  transformId: '',
  transformName: '',
})

// ─── Computed ─────────────────────────────────────────────────────

// Theme icon selector
const themeIcon = computed(() => {
  switch (themeMode.value) {
    case 'light':
      return Sun
    case 'dark':
      return Moon
    default:
      return Monitor
  }
})

// Can the user create a new transformation?
const canCreateNew = computed(() => transforms.value.length < MAX_TRANSFORMS)

// Apply the current editor charMap to the preview text
const previewOutput = computed(() => {
  const charMap: Record<string, string> = {}
  for (const mapping of editorState.value.charMap) {
    if (mapping.source && mapping.target) {
      charMap[mapping.source] = mapping.target
    }
  }
  return applyCustomCharMap(previewInput.value, charMap)
})

// Save is enabled when name is non-empty
const canSave = computed(() => editorState.value.name.trim().length > 0)

// ─── Lifecycle ────────────────────────────────────────────────────

onMounted(async () => {
  await loadTransforms()
})

// ─── Data Loading ────────────────────────────────────────────────

async function loadTransforms() {
  transforms.value = await getAllCustomTransforms()
}

// ─── List View Actions ───────────────────────────────────────────

/** Enter editor mode with blank state */
function startNewTransform() {
  if (!canCreateNew.value) return
  editingId.value = 'new'
  editorState.value = { name: '', charMap: [] }
  selectedBaseStyle.value = ''
  previewInput.value = 'Type to preview...'
}

/** Enter editor mode with existing transformation data */
function startEdit(id: string) {
  const transform = transforms.value.find((t) => t.id === id)
  if (!transform) return

  editingId.value = id
  editorState.value = {
    name: transform.name,
    charMap: Object.entries(transform.charMap).map(([source, target]) => ({ source, target })),
  }
  selectedBaseStyle.value = transform.baseStyle ?? ''
  previewInput.value = 'Type to preview...'
}

/** Show delete confirmation dialog */
function confirmDelete(transform: CustomTransformation) {
  deleteDialogState.value = {
    show: true,
    transformId: transform.id,
    transformName: transform.name,
  }
}

/** Actually delete the transformation after confirmation */
async function executeDelete() {
  deleteDialogState.value.show = false
  const id = deleteDialogState.value.transformId

  const success = await deleteCustomTransform(id)
  if (success) {
    await loadTransforms()
  } else {
    alert('Failed to delete transformation')
  }
}

// ─── Editor View Actions ─────────────────────────────────────────

/** Load a built-in style's charMap into the editor */
function loadBaseStyle() {
  if (!selectedBaseStyle.value) return

  const charMap = generateCharMapForStyle(selectedBaseStyle.value as any)
  editorState.value.charMap = Object.entries(charMap).map(([source, target]) => ({
    source,
    target,
  }))
}

/** Add a blank mapping row */
function addMapping() {
  editorState.value.charMap.push({ source: '', target: '' })
}

/** Remove a mapping row by index */
function removeMapping(index: number) {
  editorState.value.charMap.splice(index, 1)
}

/** Save the transformation (create or update) */
async function saveTransform() {
  if (!canSave.value) return

  const name = editorState.value.name.trim()
  if (!name) {
    alert(t('optionsEmptyName'))
    return
  }

  // Build charMap object from array
  const charMap: Record<string, string> = {}
  for (const mapping of editorState.value.charMap) {
    if (mapping.source && mapping.target) {
      charMap[mapping.source] = mapping.target
    }
  }

  try {
    if (editingId.value === 'new') {
      // Create new
      await createCustomTransform({
        name,
        charMap,
        baseStyle: (selectedBaseStyle.value as any) || undefined,
      })
    } else {
      // Update existing
      await updateCustomTransform(editingId.value!, {
        name,
        charMap,
        baseStyle: (selectedBaseStyle.value as any) || undefined,
      })
    }

    // Return to list view
    editingId.value = null
    await loadTransforms()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Failed to save transformation')
  }
}

/** Cancel editing and return to list view */
function cancelEdit() {
  editingId.value = null
}

// ─── Helpers ──────────────────────────────────────────────────────

/** Get human-readable label for a built-in style */
function styleLabel(style: string): string {
  const allStyles = transformationEngine.getAllStyles()
  const found = allStyles.find((s) => s.value === style)
  return found ? `${found.label} - ${found.example}` : style
}
</script>

<style scoped>
/* Additional scoped styles if needed */
</style>
