<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-overlay" @click.self="handleCancel">
        <div class="dialog-container" role="dialog" aria-modal="true">
          <!-- Icon -->
          <div class="dialog-icon" :class="iconColorClass">
            <AlertTriangle v-if="variant === 'danger'" :size="20" />
            <AlertCircle v-else-if="variant === 'warning'" :size="20" />
            <Info v-else :size="20" />
          </div>

          <!-- Content -->
          <div class="dialog-content">
            <h3 class="dialog-title">{{ title }}</h3>
            <p class="dialog-message">{{ message }}</p>
          </div>

          <!-- Actions -->
          <div class="dialog-actions">
            <button
              ref="cancelButton"
              @click="handleCancel"
              class="dialog-button dialog-button-secondary"
              type="button"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              class="dialog-button dialog-button-primary"
              :class="confirmButtonClass"
              type="button"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { AlertTriangle, AlertCircle, Info } from 'lucide-vue-next'

interface Props {
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const cancelButton = ref<HTMLButtonElement>()

// Computed classes based on variant
const iconColorClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
    case 'warning':
      return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
    case 'info':
      return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
    case 'warning':
      return 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700'
    case 'info':
      return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
    default:
      return 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700'
  }
})

// Focus management
watch(
  () => props.show,
  async (isShown) => {
    if (isShown) {
      // Focus cancel button when dialog opens
      await nextTick()
      cancelButton.value?.focus()

      // Add escape key listener
      document.addEventListener('keydown', handleEscape)
    } else {
      // Remove escape key listener
      document.removeEventListener('keydown', handleEscape)
    }
  }
)

// Handle escape key
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleCancel()
  }
}

// Handle confirm
function handleConfirm() {
  emit('confirm')
}

// Handle cancel
function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
/* Overlay - semi-transparent background with blur */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

:root.dark .dialog-overlay {
  background-color: rgba(0, 0, 0, 0.65);
}

/* Container - clean white box */
.dialog-container {
  position: relative;
  background-color: #ffffff;
  border-radius: 0.5rem;
  padding: 1.25rem;
  width: 100%;
  max-width: 340px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:root.dark .dialog-container {
  background-color: #1f2937;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

/* Icon */
.dialog-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

/* Content */
.dialog-content {
  margin-bottom: 1rem;
}

/* Title */
.dialog-title {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  color: #111827;
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

:root.dark .dialog-title {
  color: #f3f4f6;
}

/* Message */
.dialog-message {
  font-size: 0.8125rem;
  text-align: center;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

:root.dark .dialog-message {
  color: #9ca3af;
}

/* Actions */
.dialog-actions {
  display: flex;
  gap: 0.625rem;
}

/* Buttons */
.dialog-button {
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
}

.dialog-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.dialog-button-secondary {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.dialog-button-secondary:hover {
  background-color: #f9fafb;
}

:root.dark .dialog-button-secondary {
  background-color: #374151;
  color: #e5e7eb;
  border-color: #4b5563;
}

:root.dark .dialog-button-secondary:hover {
  background-color: #4b5563;
}

.dialog-button-primary {
  color: #ffffff;
  border: none;
}

/* Transitions */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog-container,
.dialog-leave-active .dialog-container {
  transition: all 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-container {
  transform: scale(0.95) translateY(-10px);
}

.dialog-leave-to .dialog-container {
  transform: scale(0.95);
}
</style>
