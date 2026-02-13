<template>
  <div class="relative" ref="containerRef">
    <input
      :id="inputId"
      ref="inputRef"
      v-model="searchText"
      type="text"
      :placeholder="placeholder"
      class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
      @focus="handleFocus"
      @blur="handleBlur"
      @input="handleInput"
    />
    <!-- Dropdown custom avec position fixed pour déborder de la popup -->
    <Teleport to="body">
      <div
        v-if="showDropdown && filteredLanguages.length > 0"
        ref="dropdownRef"
        class="fixed z-[9999] overflow-auto rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg language-dropdown"
        :style="dropdownStyle"
      >
        <button
          v-for="lang in filteredLanguages"
          :key="lang.code"
          type="button"
          @mousedown.prevent="selectLanguage(lang.code)"
          class="w-full px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer flex items-center gap-1.5"
          :class="lang.code === modelValue ? 'bg-blue-50 dark:bg-blue-900/20' : ''"
        >
          <span class="text-base">{{ lang.flag }}</span>
          <span class="flex-1 text-xs text-gray-900 dark:text-gray-100">{{
            lang.displayName
          }}</span>
          <span
            class="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded"
            >{{ lang.code }}</span
          >
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { getLanguageDisplayName } from '@/core/utils/i18n'
import { SUPPORTED_LANGUAGES } from '@/core/constants/languages'

const { locale } = useI18nWrapper()

interface Props {
  modelValue: string
  placeholder?: string
  inputId?: string
  includeAutoDetect?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search language...',
  inputId: 'language-selector',
  includeAutoDetect: false,
})

const emit = defineEmits<Emits>()

// State
const searchText = ref('')
const showDropdown = ref(false)
const previousSearchText = ref('')
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownPosition = ref<Record<string, string>>({
  top: '0px',
  left: '0px',
  width: '0px',
  maxHeight: '15rem', // 60 = 15rem
})

const { t } = useI18nWrapper()

// Calculate dropdown position
const dropdownStyle = computed(() => dropdownPosition.value)

// Update dropdown position when it opens
function updateDropdownPosition() {
  if (!inputRef.value) return

  const rect = inputRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top

  const dropdownMaxHeight = 240 // 15rem = 240px
  const dropdownNeededSpace = dropdownMaxHeight + 8 // +8 for gap

  // Determine if we should show dropdown above or below
  const showAbove = spaceBelow < dropdownNeededSpace && spaceAbove > spaceBelow

  if (showAbove) {
    // Show above input
    const availableHeight = Math.min(spaceAbove - 8, dropdownMaxHeight)
    dropdownPosition.value = {
      top: 'auto',
      bottom: `${viewportHeight - rect.top + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${availableHeight}px`,
    }
  } else {
    // Show below input (default)
    const availableHeight = Math.min(spaceBelow - 8, dropdownMaxHeight)
    dropdownPosition.value = {
      top: `${rect.bottom + 4}px`,
      bottom: 'auto',
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${availableHeight}px`,
    }
  }
}

// Watch for dropdown opening to update position
watch(showDropdown, (isOpen) => {
  if (isOpen) {
    // Use nextTick to ensure DOM is updated
    setTimeout(updateDropdownPosition, 0)
  }
})

// Entry type is widened to string so the 'auto' pseudo-entry can be included
interface LanguageOption {
  code: string
  flag: string
  displayName: string
  searchableText: string
}

// Computed: liste des langues avec noms localisés
const availableLanguages = computed((): LanguageOption[] => {
  const languages: LanguageOption[] = SUPPORTED_LANGUAGES.map((lang) => {
    const nameInUI = getLanguageDisplayName(lang.code, locale.value)
    const nameNative = getLanguageDisplayName(lang.code, lang.code)

    // Show native name in parentheses if different from UI name
    const displayName = nameInUI !== nameNative ? `${nameInUI} (${nameNative})` : nameInUI

    return {
      code: lang.code,
      flag: lang.flag,
      displayName,
      searchableText: `${nameInUI} ${nameNative} ${lang.code}`.toLowerCase(),
    }
  }).sort((a, b) => a.displayName.localeCompare(b.displayName))

  // Add auto-detect option at the beginning if requested
  if (props.includeAutoDetect) {
    languages.unshift({
      code: 'auto',
      flag: '🔍',
      displayName: t('autoDetect'),
      searchableText: `${t('autoDetect')} auto`.toLowerCase(),
    })
  }

  return languages
})

// Computed: langues filtrées en fonction de la recherche
const filteredLanguages = computed(() => {
  const search = searchText.value.toLowerCase().trim()
  if (!search) return availableLanguages.value

  return availableLanguages.value.filter((lang) => lang.searchableText.includes(search))
})

// Fonction pour sélectionner une langue
function selectLanguage(code: string) {
  emit('update:modelValue', code)

  // Mettre à jour le texte de recherche avec le nom affiché
  const selected = availableLanguages.value.find((lang) => lang.code === code)
  if (selected) {
    searchText.value = selected.displayName
    previousSearchText.value = selected.displayName // Update previous value to prevent blur from restoring old value
  }

  showDropdown.value = false
}

// Fonction pour gérer l'input
function handleInput() {
  showDropdown.value = true
  updateDropdownPosition()
}

// Fonction pour gérer le focus (vider le champ pour afficher toutes les langues)
function handleFocus() {
  previousSearchText.value = searchText.value
  searchText.value = ''
  showDropdown.value = true
  updateDropdownPosition()
}

// Fonction pour gérer la perte de focus
function handleBlur() {
  // Délai pour permettre au clic sur un item de se déclencher
  setTimeout(() => {
    showDropdown.value = false

    // Si le champ est vide, restaurer la valeur précédente
    if (!searchText.value) {
      searchText.value = previousSearchText.value
      return
    }

    // Vérifier si le texte tapé correspond exactement à un code de langue
    const exactMatch = availableLanguages.value.find(
      (lang) => lang.code.toLowerCase() === searchText.value.toLowerCase().trim()
    )

    if (exactMatch) {
      // Auto-sélectionner la langue correspondante
      selectLanguage(exactMatch.code)
    } else {
      // Pas de match exact, restaurer la valeur précédente
      searchText.value = previousSearchText.value
    }
  }, 200)
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    showDropdown.value = false
    if (!searchText.value) {
      searchText.value = previousSearchText.value
    }
  }
}

// Initialiser le texte de recherche avec la langue sélectionnée
watch(
  () => props.modelValue,
  (newValue) => {
    const selected = availableLanguages.value.find((lang) => lang.code === newValue)
    if (selected && !showDropdown.value) {
      searchText.value = selected.displayName
    }
  },
  { immediate: true }
)

// Setup click outside listener
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
/* Scrollbar styling pour dark mode */
.language-dropdown {
  scrollbar-width: thin;
  scrollbar-color: rgb(156 163 175) transparent; /* gray-400 in light mode */
}

.dark .language-dropdown {
  scrollbar-color: rgb(75 85 99) transparent; /* gray-600 in dark mode */
}

/* Webkit browsers (Chrome, Safari, Edge) */
.language-dropdown::-webkit-scrollbar {
  width: 8px;
}

.language-dropdown::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.language-dropdown::-webkit-scrollbar-thumb {
  background-color: rgb(156 163 175); /* gray-400 in light mode */
  border-radius: 4px;
}

.language-dropdown::-webkit-scrollbar-thumb:hover {
  background-color: rgb(107 114 128); /* gray-500 in light mode */
}

/* Dark mode webkit scrollbar */
.dark .language-dropdown::-webkit-scrollbar-thumb {
  background-color: rgb(75 85 99); /* gray-600 in dark mode */
}

.dark .language-dropdown::-webkit-scrollbar-thumb:hover {
  background-color: rgb(107 114 128); /* gray-500 in dark mode */
}
</style>
