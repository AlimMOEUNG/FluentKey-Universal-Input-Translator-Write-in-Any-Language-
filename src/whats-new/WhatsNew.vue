<template>
  <div class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Update context modal — only shown when the page opens after a major/minor update -->
    <UpdateContextModal
      v-if="isFromUpdate"
      :old-version="oldVersion"
      :new-version="newVersion"
      @closed="scrollToLatestChangelog"
    />

    <!-- ===== STICKY HEADER ===== -->
    <header
      class="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div class="max-w-4xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo + title + version -->
          <div class="flex items-center gap-3">
            <img :src="logoUrl" alt="Power Input logo" class="w-10 h-10" />
            <div>
              <h1 class="text-2xl font-bold">{{ t('whatsNewTitle') }}</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('whatsNewCurrentVersion', { params: { version: currentVersion } }) }}
              </p>
            </div>
          </div>

          <!-- Right controls -->
          <div class="flex items-center gap-3">
            <a
              :href="reviewUrl"
              target="_blank"
              rel="noopener"
              class="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <span class="flex gap-0.5" aria-hidden="true">
                <svg
                  v-for="i in 5"
                  :key="i"
                  class="w-3.5 h-3.5 fill-yellow-400"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              </span>
              {{ t('whatsNewRateExtension') }}
            </a>

            <!-- Language selector -->
            <select
              v-model="locale"
              class="px-3 py-2 pr-8 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors appearance-none"
              :style="selectArrowStyle"
            >
              <option v-for="lang in supportedLocales" :key="lang.value" :value="lang.value">
                {{ lang.label }}
              </option>
            </select>

            <!-- Theme toggle -->
            <button
              @click="cycleTheme"
              class="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              :title="themeTooltip"
            >
              <svg
                v-if="themeMode === 'auto'"
                class="w-5 h-5 text-gray-600 dark:text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
              <svg
                v-else-if="themeMode === 'light'"
                class="w-5 h-5 text-yellow-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="5" />
                <path
                  d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5 text-blue-500 dark:text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- View tabs -->
        <div class="mt-4 flex gap-2">
          <button
            @click="currentView = 'updates'"
            :class="[
              'flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all',
              currentView === 'updates'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
          >
            <svg
              class="inline w-4 h-4 mr-1.5 -mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            {{ t('whatsNewViewUpdates') }}
          </button>
          <button
            @click="currentView = 'features'"
            :class="[
              'flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all',
              currentView === 'features'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
          >
            <svg
              class="inline w-4 h-4 mr-1.5 -mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            {{ t('whatsNewViewFeatures') }}
          </button>
        </div>
      </div>
    </header>

    <!-- ===== FREEMIUM MODEL BANNER ===== -->
    <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white">
      <div class="max-w-4xl mx-auto px-6 py-7">
        <div class="flex items-start gap-4">
          <div
            class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h2 class="text-xl font-bold">{{ t('freemiumTitle') }}</h2>
              <span class="px-2 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full">
                {{ t('freemiumBadge') }}
              </span>
            </div>
            <div class="grid sm:grid-cols-2 gap-2 text-sm mt-3">
              <div
                v-for="key in freemiumPointKeys"
                :key="key"
                class="flex items-start gap-2 bg-white/10 rounded-lg px-3 py-2"
              >
                <svg
                  class="w-4 h-4 mt-0.5 flex-shrink-0 text-green-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{{ t(key) }}</span>
              </div>
            </div>
            <p class="mt-3 text-sm opacity-90 bg-white/10 rounded-lg px-3 py-2">
              <svg
                class="inline w-4 h-4 mr-1 -mt-0.5 text-yellow-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {{ t('freemiumLimitText') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== SUBSCRIPTION SURVEY — always visible, below freemium banner ===== -->
    <div class="max-w-4xl mx-auto px-6 pt-8">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div class="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-1">
            <svg
              class="w-5 h-5 text-indigo-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            <h2 class="text-lg font-bold">{{ t('surveyTitle') }}</h2>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('surveyDescription') }}</p>
        </div>
        <iframe
          src="https://tally.so/embed/9qDkWK?alignLeft=1&hideTitle=1&transparentBackground=1"
          width="100%"
          height="440"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
          :title="t('surveyTitle')"
          class="block"
        />
      </div>
    </div>

    <!-- ===== MAIN CONTENT ===== -->
    <main class="max-w-4xl mx-auto px-6 py-8">
      <!-- ===== UPDATES VIEW ===== -->
      <div v-if="currentView === 'updates'" class="space-y-8">
        <!-- Roadmap / What's Next -->
        <div
          class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow-md p-6 border-2 border-dashed border-purple-300 dark:border-purple-700"
        >
          <div class="flex items-center gap-2 mb-4">
            <svg
              class="w-5 h-5 text-purple-600 dark:text-purple-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            <h2 class="text-lg font-bold text-purple-600 dark:text-purple-400">
              {{ t('whatsNewRoadmapTitle') }}
            </h2>
            <span
              class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full"
            >
              {{ t('whatsNewRoadmapBadge') }}
            </span>
          </div>

          <!-- Ideas list -->
          <ul class="space-y-2 mb-5">
            <li
              v-for="key in roadmapKeys"
              :key="key"
              class="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg"
            >
              <svg
                class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="9" y1="18" x2="15" y2="18" />
                <line x1="10" y1="22" x2="14" y2="22" />
                <path
                  d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"
                />
              </svg>
              <span class="text-sm text-gray-800 dark:text-gray-200">{{ t(key) }}</span>
            </li>
          </ul>

          <!-- Disclaimer + feedback CTA -->
          <div
            class="border-t border-purple-200 dark:border-purple-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <p class="flex-1 text-sm text-gray-600 dark:text-gray-400 italic">
              {{ t('whatsNewRoadmapDisclaimer') }}
            </p>
            <a
              :href="feedbackUrl"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <!-- message icon -->
              <svg
                class="w-4 h-4 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {{ t('whatsNewRoadmapCtaLabel') }}
            </a>
          </div>
        </div>

        <!-- Changelog entries — id used for scroll-to after update modal closes -->
        <div
          v-for="entry in changelog"
          :key="entry.version"
          :id="`changelog-v${entry.version}`"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div class="flex items-center gap-3 mb-4">
            <h2 class="text-xl font-bold text-blue-600 dark:text-blue-400">v{{ entry.version }}</h2>
            <span
              v-if="entry.version === currentVersion"
              class="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full"
            >
              {{ t('whatsNewLatestVersion') }}
            </span>
            <span class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
              {{ formatDate(entry.date) }}
            </span>
          </div>
          <ul class="space-y-2">
            <li v-for="(change, idx) in entry.changes" :key="idx" class="flex items-start gap-3">
              <span
                :class="[
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5',
                  changeTypeColor(change.type),
                ]"
              >
                {{ changeTypeIcon(change.type) }}
              </span>
              <span class="text-sm leading-relaxed">{{ t(change.key) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- ===== FEATURES VIEW ===== -->
      <div v-else class="space-y-6">
        <div
          v-for="category in featureSummary"
          :key="category.categoryKey"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
            <svg
              class="w-5 h-5 text-blue-600 dark:text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {{ t(category.categoryKey) }}
          </h2>
          <ul class="space-y-3">
            <li v-for="(feat, idx) in category.features" :key="idx" class="flex items-center gap-3">
              <svg
                class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <div class="flex-1">
                <span class="text-sm">{{ t(feat.key) }}</span>
                <span class="ml-2 text-xs text-gray-400">(v{{ feat.version }})</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Discover other extensions (bottom of page) -->
      <div class="mt-8 rounded-lg overflow-hidden border border-violet-200 dark:border-violet-800">
        <a
          href="https://subtiltee.com/all-extensions?from=power-input-whats-new"
          target="_blank"
          rel="noopener"
          class="flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 hover:from-violet-100 hover:to-blue-100 dark:hover:from-violet-900/30 dark:hover:to-blue-900/30 transition-colors group"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0"
            >
              <svg
                class="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-violet-700 dark:text-violet-300 text-sm">
                {{ t('allExtensionsPromoTitle') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('allExtensionsPromoDesc') }}
              </p>
            </div>
          </div>
          <svg
            class="w-5 h-5 text-violet-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { changelog, featureSummary, getCurrentVersion } from '../data/changelog'
import { useI18nWrapper } from '../composables/useI18nWrapper'
import { useThemeMode } from '../composables/useThemeMode'
import { supportedLocales } from '../core/utils/i18n'
import { isFirefox } from '../utils/browser-detection'
import type { TranslationKey } from '../core/utils/i18n'
import UpdateContextModal from './UpdateContextModal.vue'

const { t, locale } = useI18nWrapper()
const { themeMode, cycleTheme } = useThemeMode()

const currentVersion = getCurrentVersion()
const currentView = ref<'updates' | 'features'>('updates')

// Update context from URL parameters (set by Popup.vue when a major/minor update is detected)
const isFromUpdate = ref(false)
const oldVersion = ref('unknown')
const newVersion = ref(getCurrentVersion())

onMounted(() => {
  // Read update context from URL params
  const params = new URLSearchParams(window.location.search)
  isFromUpdate.value = params.get('fromUpdate') === 'true'
  oldVersion.value = params.get('oldVersion') ?? 'unknown'
  newVersion.value = params.get('newVersion') ?? getCurrentVersion()
})

// Logo loaded from extension resources
const logoUrl = chrome.runtime.getURL('icons/logo-48.png')

// Tally feedback / feature-request form URL
const feedbackUrl = 'https://tally.so/r/q4ArEg'

// Store review URL based on browser
const reviewUrl = isFirefox()
  ? 'https://addons.mozilla.org/firefox/addon/power-input/reviews/'
  : 'https://chromewebstore.google.com/detail/power-input/reviews'

// Inline arrow style for the language select dropdown
const selectArrowStyle =
  "background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27%3e%3cpath fill=%27%23666%27 d=%27M6 8L0 0h12z%27/%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 0.65rem;"

// Freemium points — listed as i18n keys
const freemiumPointKeys: TranslationKey[] = [
  'freemiumPoint1',
  'freemiumPoint2',
  'freemiumPoint3',
  'freemiumPoint4',
]

// Roadmap items — i18n keys
const roadmapKeys: TranslationKey[] = [
  'whatsNewRoadmapItem1',
  'whatsNewRoadmapItem2',
  'whatsNewRoadmapItem3',
  'whatsNewRoadmapItem4',
]

const themeTooltip = computed(() => {
  if (themeMode.value === 'auto') return t('themeAuto')
  if (themeMode.value === 'light') return t('themeLight')
  return t('themeDark')
})

// Scroll to the most recent changelog entry after the update modal is dismissed.
// Uses the first entry in the array (newest first) regardless of current version.
function scrollToLatestChangelog() {
  if (currentView.value !== 'updates') {
    currentView.value = 'updates'
  }

  // Wait one tick for Vue to render after potential view switch
  setTimeout(() => {
    const el = document.querySelector('[id^="changelog-v"]')
    if (!el) return

    const header = document.querySelector('header')
    const headerHeight = header ? header.offsetHeight : 80
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16
    window.scrollTo({ top, behavior: 'smooth' })
  }, 0)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value as string, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function changeTypeColor(type: string): string {
  switch (type) {
    case 'feature':
      return 'bg-blue-500'
    case 'improvement':
      return 'bg-green-500'
    case 'fix':
      return 'bg-orange-500'
    default:
      return 'bg-gray-400'
  }
}

function changeTypeIcon(type: string): string {
  switch (type) {
    case 'feature':
      return '+'
    case 'improvement':
      return '↑'
    case 'fix':
      return '✓'
    default:
      return '•'
  }
}
</script>
