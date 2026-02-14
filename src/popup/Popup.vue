<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    ref="wrapperRef"
    class="w-full max-w-[400px] min-w-[360px] flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-200 ease-in-out"
    style="height: fit-content; min-height: fit-content; max-height: 600px; overflow: hidden"
  >
    <!-- Header: title + language selector + theme toggle -->
    <PopupHeader />

    <!-- Main navigation: Presets / Provider segmented control -->
    <MainNavTabs />

    <!-- Tab content -->
    <div class="flex-1 flex flex-col px-3 pb-3 bg-white dark:bg-gray-900">
      <ProviderTab v-if="currentView === 'provider'" />
      <PresetsTab v-else />
    </div>

    <!-- Cross-promo banner: hidden when popup would overflow and trigger a browser scrollbar -->
    <AllExtensionsBanner v-if="showBanner" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePopupState } from '@/composables/usePopupState'
import PopupHeader from '@/components/PopupHeader.vue'
import MainNavTabs from '@/components/MainNavTabs.vue'
import ProviderTab from '@/components/ProviderTab.vue'
import PresetsTab from '@/components/PresetsTab.vue'
import AllExtensionsBanner from '@/components/AllExtensionsBanner.vue'
import { isMajorOrMinorRelease, hasMajorOrMinorDiff } from '@/utils/version-utils'

// currentView drives which tab content is rendered
const { currentView } = usePopupState()

// Hide the cross-promo banner when the popup is tall enough to trigger
// a browser-level scrollbar. The threshold is set just below Chrome's
// practical scroll point (~600px). The hysteresis (+BANNER_HEIGHT) prevents
// oscillation: the banner only reappears once enough space is freed.
const POPUP_MAX_HEIGHT = 590 // px — hide banner above this total height
const BANNER_HEIGHT = 52 // px — estimated rendered height of AllExtensionsBanner

const wrapperRef = ref<HTMLElement | null>(null)
const showBanner = ref(true)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!wrapperRef.value) return
  resizeObserver = new ResizeObserver(([entry]) => {
    const h = entry.contentRect.height
    if (showBanner.value && h > POPUP_MAX_HEIGHT) {
      // Content alone already fills the popup — remove the banner
      showBanner.value = false
    } else if (!showBanner.value && h + BANNER_HEIGHT <= POPUP_MAX_HEIGHT) {
      // Content shrank enough for the banner to fit again — restore it
      showBanner.value = true
    }
  })
  resizeObserver.observe(wrapperRef.value)
})

// Check whether the extension was updated since the last popup open.
// If a significant update (major or minor) is detected, open the What's New page
// with URL params so the page can show a contextual modal.
async function checkForUpdate(): Promise<void> {
  try {
    const currentVersion = chrome.runtime.getManifest().version
    const result = await chrome.storage.sync.get(['currentVersion'])
    const storedVersion = result.currentVersion as string | undefined

    if (!storedVersion || storedVersion !== currentVersion) {
      // Persist the new version immediately so the modal only shows once
      await chrome.storage.sync.set({ currentVersion })

      const isSignificant =
        isMajorOrMinorRelease(currentVersion) ||
        hasMajorOrMinorDiff(storedVersion, currentVersion)

      if (isSignificant) {
        const params = new URLSearchParams({
          fromUpdate: 'true',
          oldVersion: storedVersion ?? 'unknown',
          newVersion: currentVersion,
        })
        const url = chrome.runtime.getURL(`src/whats-new/whats-new.html?${params.toString()}`)
        chrome.tabs.create({ url })
      }
    }
  } catch {
    // Non-critical — silently ignore errors
  }
}

onUnmounted(() => {
  resizeObserver?.disconnect()
})

onMounted(() => {
  checkForUpdate()
})
</script>
