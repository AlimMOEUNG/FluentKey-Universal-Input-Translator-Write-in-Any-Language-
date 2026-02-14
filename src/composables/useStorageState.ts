import { ref, watch, onUnmounted, type Ref } from 'vue'
import { browserAPI } from '@/utils/browser-polyfill'

/**
 * Composable to sync a Vue ref with Chrome storage (local or sync)
 * Automatically loads on mount and saves on change
 * Listens for external storage changes and updates the value reactively
 *
 * @param storageKey - Key to use in Chrome storage
 * @param defaultValue - Default value if key doesn't exist in storage
 * @param options - Optional configuration
 * @returns Object with reactive value, loading state, and error
 *
 * @example
 * // Simple boolean preference (local storage)
 * const { value: isExpanded, isLoading } = useStorageState('banner_expanded', true)
 *
 * @example
 * // Theme mode with sync storage (synced across devices)
 * const { value: theme } = useStorageState('theme', 'light', { storageArea: 'sync' })
 *
 * @example
 * // With custom error handling
 * const { value: darkMode, error } = useStorageState('dark_mode', false, {
 *   onError: (err, operation) => console.error(`Dark mode ${operation} failed:`, err)
 * })
 */
export function useStorageState<T>(
  storageKey: string,
  defaultValue: T,
  options?: {
    storageArea?: 'local' | 'sync' // Which storage area to use (default: 'local')
    onError?: (error: unknown, operation: 'load' | 'save') => void
  }
) {
  const value = ref(defaultValue) as Ref<T>
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  // Determine which storage area to use
  const storageArea = options?.storageArea || 'local'
  const storage = browserAPI.storage[storageArea]

  // Load value from storage on creation
  const loadFromStorage = async () => {
    try {
      const result = await storage.get(storageKey)
      if (result[storageKey] !== undefined) {
        value.value = result[storageKey] as T
      }
      error.value = null
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      if (options?.onError) {
        options.onError(e, 'load')
      } else {
        console.error(`[useStorageState] Failed to load "${storageKey}" from ${storageArea}:`, e)
      }
    } finally {
      isLoading.value = false
    }
  }

  // Save value to storage whenever it changes
  const saveToStorage = async (newValue: T) => {
    try {
      await storage.set({ [storageKey]: newValue })
      error.value = null
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      if (options?.onError) {
        options.onError(e, 'save')
      } else {
        console.error(`[useStorageState] Failed to save "${storageKey}" to ${storageArea}:`, e)
      }
    }
  }

  // Listen for external storage changes (from other parts of the extension)
  const handleStorageChange = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    // Only react to changes in the correct storage area
    if (areaName !== storageArea) return

    // Check if our key changed
    if (changes[storageKey] !== undefined) {
      const newValue = changes[storageKey].newValue as T
      // Update local value without triggering a save
      value.value = newValue
    }
  }

  // Initialize: load from storage
  loadFromStorage()

  // Start listening for external storage changes
  browserAPI.storage.onChanged.addListener(handleStorageChange)

  // Watch for local changes and save automatically (deep: true to catch nested property mutations)
  watch(value, (newValue) => {
    // Only save after initial load is complete to avoid saving default value
    if (!isLoading.value) {
      saveToStorage(newValue)
    }
  }, { deep: true })

  // Cleanup: remove listener on unmount
  onUnmounted(() => {
    browserAPI.storage.onChanged.removeListener(handleStorageChange)
  })

  return {
    value,
    isLoading,
    error,
  }
}
