/**
 * Composable for managing pro/beta subscription status.
 *
 * Status lifecycle:
 * - 'free'          : 5 preset slots max
 * - 'beta_unlocked' : Unlimited presets (user entered beta code from Tally form)
 * - 'pro_paid'      : Unlimited presets (future Stripe payment — stub for now)
 *
 * Beta flow:
 * 1. User hits the 5-preset limit → ProUpgradePrompt is shown
 * 2. User clicks "Get beta code" → opens Tally form (collects their email)
 * 3. Tally thank-you page shows BETA_CODE
 * 4. User enters the code in the extension → beta_unlocked forever (grandfathered)
 *
 * After BETA_CUTOFF_DATE:
 * - New activations of BETA_CODE are blocked
 * - Existing 'beta_unlocked' users keep unlimited access forever
 * - Only 'pro_paid' unlocks new unlimited access (future Stripe)
 */

import { ref, computed } from 'vue'

// ---------------------------------------------------------------------------
// Configuration — update these values before publishing
// ---------------------------------------------------------------------------

/**
 * Code shown on the Tally form thank-you page.
 * User submits their email on Tally, gets this code, enters it in the extension.
 * Keep it short and memorable (e.g. "BETA2026").
 */
const BETA_CODE = 'ILOVEPOWERINPUT<3'

/**
 * Date after which BETA_CODE can no longer be activated by new users.
 * Existing 'beta_unlocked' users are grandfathered and keep unlimited access forever.
 * Update this value before publishing if you want a longer/shorter beta window.
 */
export const BETA_CUTOFF_DATE = new Date('2026-03-15').getTime()

/**
 * Tally form embed URL (iframe src).
 * Parameters:
 *   alignLeft=1           — left-align content (better fit in narrow popup)
 *   hideTitle=1           — hide the form title (shown in our own UI)
 *   transparentBackground=1 — no white box, inherits popup background
 */
export const TALLY_EMBED_URL =
  'https://tally.so/embed/2ENdXV?alignLeft=1&hideTitle=1&transparentBackground=1'

/** Maximum presets allowed on the free tier. */
export const FREE_MAX_PRESETS = 5

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProStatus = 'free' | 'beta_unlocked' | 'pro_paid'

// ---------------------------------------------------------------------------
// Module-level shared state (singleton pattern — same instance across all callers)
// ---------------------------------------------------------------------------

const proStatus = ref<ProStatus>('free')
const isProLoading = ref(true)
const isProInitialized = ref(false)

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

async function loadProStatus(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get(['proStatus'])
    const stored = result.proStatus as string | undefined
    if (stored && (['free', 'beta_unlocked', 'pro_paid'] as string[]).includes(stored)) {
      proStatus.value = stored as ProStatus
    }
  } catch (error) {
    console.error('[usePro] Failed to load pro status:', error)
  } finally {
    isProLoading.value = false
    isProInitialized.value = true
  }
}

async function saveProStatus(status: ProStatus): Promise<void> {
  try {
    await chrome.storage.sync.set({ proStatus: status })
  } catch (error) {
    console.error('[usePro] Failed to save pro status:', error)
  }
}

// Initialize once at module load
if (!isProInitialized.value) {
  loadProStatus()
}

// Keep in sync across tabs/windows
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.proStatus) {
    const newValue = changes.proStatus.newValue as string
    if ((['free', 'beta_unlocked', 'pro_paid'] as string[]).includes(newValue)) {
      proStatus.value = newValue as ProStatus
    }
  }
})

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function usePro() {
  /**
   * Returns true if the beta activation window is still open.
   * After BETA_CUTOFF_DATE, new beta activations are blocked.
   * Already-unlocked users are unaffected (grandfathered).
   */
  function isBetaActive(): boolean {
    return Date.now() < BETA_CUTOFF_DATE
  }

  /**
   * Returns true if the user has unlimited preset access.
   * Beta access only counts while the beta period is still open.
   * After the cutoff, beta_unlocked users revert to the free tier (5 presets max).
   * pro_paid always grants unlimited access.
   */
  const isUnlimited = computed(() => {
    return (
      (proStatus.value === 'beta_unlocked' && Date.now() < BETA_CUTOFF_DATE) ||
      proStatus.value === 'pro_paid'
    )
  })

  /** Returns the maximum number of presets allowed for the current user. */
  function getMaxPresets(): number {
    return isUnlimited.value ? Infinity : FREE_MAX_PRESETS
  }

  /**
   * Returns true if the preset at the given index should be locked.
   * Presets beyond the free limit are kept in storage but locked when the user
   * does not have unlimited access, so they can be restored after upgrading.
   */
  function isPresetLocked(index: number): boolean {
    if (isUnlimited.value) return false
    return index >= FREE_MAX_PRESETS
  }

  /**
   * Attempt to activate beta access with the given code.
   *
   * Returns:
   * - { success: true }                       on valid code
   * - { success: false, error: 'invalid_code' } if code does not match
   * - { success: false, error: 'beta_expired' } if beta window is closed
   *   (only applies to users who have NOT already unlocked)
   */
  async function activateBetaCode(
    code: string
  ): Promise<{ success: boolean; error?: 'invalid_code' | 'beta_expired' }> {
    // Already unlocked — nothing to do, treat as success
    if (proStatus.value === 'beta_unlocked') {
      return { success: true }
    }

    // Beta window closed for new activations
    if (!isBetaActive()) {
      return { success: false, error: 'beta_expired' }
    }

    // Validate the code (case-insensitive comparison)
    if (code.trim().toUpperCase() !== BETA_CODE.toUpperCase()) {
      return { success: false, error: 'invalid_code' }
    }

    proStatus.value = 'beta_unlocked'
    await saveProStatus('beta_unlocked')
    return { success: true }
  }

  /**
   * Activate Pro license (stub — wired up to Stripe webhook in a future update).
   * The licenseKey parameter will be validated server-side once the backend is ready.
   */
  async function activateProLicense(_licenseKey: string): Promise<boolean> {
    // TODO: validate licenseKey against Stripe/backend before setting pro_paid
    proStatus.value = 'pro_paid'
    await saveProStatus('pro_paid')
    return true
  }

  return {
    proStatus,
    isProLoading,
    isUnlimited,
    isBetaActive,
    getMaxPresets,
    isPresetLocked,
    activateBetaCode,
    activateProLicense,
    betaCutoffDate: BETA_CUTOFF_DATE,
    tallyEmbedUrl: TALLY_EMBED_URL,
    freeMaxPresets: FREE_MAX_PRESETS,
  }
}
