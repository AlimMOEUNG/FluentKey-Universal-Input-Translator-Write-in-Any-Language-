# Freemium System — Documentation

## Overview

PowerInput uses a **3-tier model**:

| Tier | Condition | Max Presets |
|------|-----------|-------------|
| `free` | Default for all new users | 5 |
| `beta_unlocked` | Entered the beta code (from Tally form) | Unlimited |
| `pro_paid` | Stripe payment *(not yet implemented)* | Unlimited |

The status is stored in `chrome.storage.sync` under the key `proStatus`, so it syncs across all the user's devices.

---

## Phase 1 — Beta (current, implemented)

### How it works

1. User hits the 5-preset limit → `ProUpgradePrompt` overlay appears
2. The overlay embeds the Tally form directly (`https://tally.so/embed/2ENdXV`)
3. User submits their email on the form
4. Tally's thank-you page shows the beta code **inside the popup**
5. User copies the code, enters it in the input field below the iframe
6. Extension validates, sets `proStatus = 'beta_unlocked'` → unlimited presets unlocked forever

### Beta cutoff date

```typescript
// src/composables/usePro.ts
export const BETA_CUTOFF_DATE = new Date('2026-03-15').getTime()
```

- **Before the cutoff**: anyone can enter the beta code to unlock unlimited access
- **After the cutoff**: new beta code activations are blocked. Users who already activated (`beta_unlocked`) revert to the free 5-preset cap — their extra presets are kept locked in storage until they upgrade to Pro
- To extend the beta window, simply update this date and republish the extension

### Beta code

```typescript
// src/composables/usePro.ts
const BETA_CODE = 'ILOVEPOWERINPUT<3'
```

- Comparison is **case-insensitive** (`ILOVEPOWERINPUT<3`, `ilovepowerinput<3`, etc. all work)
- This code is shown on the Tally form's thank-you page
- It is NOT visible anywhere in the extension UI (only `'Enter beta code'` as placeholder)
- The code is embedded in the extension bundle — do not share it publicly outside the Tally flow

### Tally form

- **Form URL**: `https://tally.so/r/2ENdXV`
- **Embed URL**: `https://tally.so/embed/2ENdXV?alignLeft=1&hideTitle=1&transparentBackground=1`
- Fields: email + "What feature do you want the most?"
- The thank-you page must display the beta code `ILOVEPOWERINPUT<3`

### Manifest CSP

Both `manifests/manifest.chrome.json` and `manifests/manifest.firefox.json` include:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; frame-src https://tally.so;"
}
```

This is required for the Tally iframe to load inside the extension popup.

---

## Phase 2 — Stripe (to implement)

### Architecture

```
User clicks "Upgrade Pro" button
    │
    ▼
Opens Stripe Checkout (new tab or iframe)
    │
    ▼ (payment success)
Stripe webhook → Vercel/Netlify serverless function
    │
    ▼
Function generates a license key: HMAC(email + timestamp, STRIPE_SECRET)
    │
    ▼
Function stores { email, licenseKey, status: 'pro_paid' } in DB (Supabase / KV)
    │
    ▼
Extension receives licenseKey (via redirect URL or email)
User enters licenseKey in extension
    │
    ▼
Extension calls activateProLicense(licenseKey)
    → POST to Vercel function → validates key → returns { valid: true }
    → proStatus = 'pro_paid' stored in chrome.storage.sync
```

### The stub is already in place

```typescript
// src/composables/usePro.ts
async function activateProLicense(_licenseKey: string): Promise<boolean> {
  // TODO: validate licenseKey against Stripe/backend before setting pro_paid
  proStatus.value = 'pro_paid'
  await saveProStatus('pro_paid')
  return true
}
```

When ready, replace the body with an actual API call:

```typescript
async function activateProLicense(licenseKey: string): Promise<boolean> {
  const response = await fetch('https://your-vercel-app.vercel.app/api/validate-license', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey }),
  })
  const { valid } = await response.json()
  if (valid) {
    proStatus.value = 'pro_paid'
    await saveProStatus('pro_paid')
  }
  return valid
}
```

### UI to add for Stripe

In `ProUpgradePrompt.vue`, the "Upgrade to Pro" button is currently `disabled` with `(coming soon)`. When Stripe is live:

1. Remove `disabled` and `opacity-60`
2. `@click` opens Stripe Checkout URL (generated server-side or via `stripe.js`)
3. After payment, user lands on a success page with their license key
4. Add a second input field below the button: "Enter your license key" + "Activate Pro" button
5. Call `activateProLicense(licenseKey)` on submit

### Pricing

- **€9 lifetime** (one-time payment, no subscription)
- Stripe product: `Power Input Pro`
- No refund policy needed (lifetime = no recurring billing disputes)

### Beta users after Stripe launch

Beta users (`proStatus = 'beta_unlocked'`) do **not** keep unlimited access once the `BETA_CUTOFF_DATE` has passed. After the cutoff, `beta_unlocked` behaves the same as `free` (5-preset cap). To keep unlimited access they must upgrade to `pro_paid`.

Their presets above the free limit are **kept in `chrome.storage.sync`** (never deleted), shown locked/grayed in the UI, and excluded from keyboard shortcuts. When they pay, all presets are restored instantly.

```typescript
const isUnlimited = computed(() => {
  return (proStatus.value === 'beta_unlocked' && Date.now() < BETA_CUTOFF_DATE)
    || proStatus.value === 'pro_paid'
})
```

---

## Key files

| File | Role |
|------|------|
| `src/composables/usePro.ts` | All pro/beta logic: status, activation, storage, `isPresetLocked()` |
| `src/components/ProUpgradePrompt.vue` | Upgrade overlay UI (Tally iframe + code input + Pro button) |
| `src/components/PresetsTab.vue` | Shows `ProUpgradePrompt` when `canAddPreset()` returns false |
| `src/components/PresetTabs.vue` | Renders lock icon on tabs at index ≥ 5 when not unlimited |
| `src/components/PresetEditor.vue` | Shows locked overlay when editing a locked preset |
| `src/composables/usePresetsSettings.ts` | `canAddPreset()` and `maxPresets` use `usePro` dynamically |
| `src/core/storage/SettingsManager.ts` | Loads `proStatus` from storage; exposes `isPresetLocked()` for content script |
| `src/core/handlers/KeyboardShortcutHandler.ts` | Skips locked presets when building the shortcut map |
| `src/core/utils/i18n.ts` | Translation keys: `proUpgrade*`, `proBeta*`, `presetLocked*` |
| `manifests/manifest.chrome.json` | CSP: `frame-src https://tally.so` |
| `manifests/manifest.firefox.json` | Same CSP for Firefox |

---

## Configuration quick reference

To update any configuration, edit `src/composables/usePro.ts`:

```typescript
const BETA_CODE = 'ILOVEPOWERINPUT<3'        // Code shown on Tally thank-you page
const BETA_CUTOFF_DATE = new Date('2026-03-15') // Extend if needed before republishing
const TALLY_EMBED_URL = 'https://tally.so/embed/2ENdXV?...'  // Already set
const FREE_MAX_PRESETS = 5                    // Free tier limit
```

---

## Timeline

```
Phase 1 — Beta (NOW)
├── 5 preset limit live ✅
├── Tally form embedded in popup ✅
├── Beta code activation + chrome.storage ✅
├── Locked presets: kept in storage, grayed in UI, shortcuts disabled ✅
├── Beta expires at BETA_CUTOFF_DATE (beta_unlocked reverts to free cap) ✅
└── Pro button (disabled, "coming soon") ✅

Phase 2 — Stripe (when user base justifies it)
├── Create Stripe product (€9 lifetime)
├── Create Vercel serverless function (webhook + license validation)
├── Implement activateProLicense() in usePro.ts
├── Enable "Upgrade Pro" button in ProUpgradePrompt.vue
└── Add license key input field in ProUpgradePrompt.vue
```
