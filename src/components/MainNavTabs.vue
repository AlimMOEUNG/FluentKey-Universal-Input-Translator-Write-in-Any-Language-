<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="px-3 pt-3 pb-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
  >
    <div
      class="main-nav-container p-1 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center relative"
    >
      <button
        @click="currentView = 'presets'"
        :class="['main-nav-tab', { active: currentView === 'presets' }]"
      >
        Presets
      </button>

      <!-- Visual separator hidden when an adjacent tab is active -->
      <div class="nav-separator h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-0.5"></div>

      <button
        @click="currentView = 'provider'"
        :class="['main-nav-tab', { active: currentView === 'provider' }]"
      >
        Global
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePopupState } from '@/composables/usePopupState'

// currentView is reactive and persisted to storage via usePopupState
const { currentView } = usePopupState()
</script>

<style scoped>
.main-nav-container {
  background-color: theme('colors.gray.200');
  padding: 0.25rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

:root[data-theme='dark'] .main-nav-container {
  background-color: theme('colors.gray.800');
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.main-nav-tab {
  flex: 1;
  padding: 0.5rem 0;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
  border-radius: 0.5rem;
  color: theme('colors.gray.600');
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
  background: transparent;
}

:root[data-theme='dark'] .main-nav-tab {
  color: theme('colors.gray.400');
}

.main-nav-tab:hover:not(.active) {
  color: theme('colors.gray.900');
  background-color: rgba(0, 0, 0, 0.05);
}

:root[data-theme='dark'] .main-nav-tab:hover:not(.active) {
  color: theme('colors.gray.200');
  background-color: rgba(255, 255, 255, 0.05);
}

.main-nav-tab.active {
  background-color: theme('colors.blue.600');
  color: theme('colors.white');
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
}

:root[data-theme='dark'] .main-nav-tab.active {
  background-color: theme('colors.blue.500');
  color: theme('colors.white');
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.nav-separator {
  width: 1px;
  height: 1.25rem;
  background-color: theme('colors.gray.400');
  opacity: 0.5;
}

:root[data-theme='dark'] .nav-separator {
  background-color: theme('colors.gray.600');
}

/* Hide separator when the tab directly before or after it is active */
.main-nav-tab.active + .nav-separator,
.nav-separator:has(+ .main-nav-tab.active) {
  visibility: hidden;
}
</style>
