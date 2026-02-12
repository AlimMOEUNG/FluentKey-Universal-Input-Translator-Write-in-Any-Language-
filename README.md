# FluentKey — Universal Input Translator

> Press a keyboard shortcut. Your text is translated, transformed, or processed by an AI — instantly, on any website.

A Chrome & Firefox extension that brings translation and text transformation directly into any input field or text selection, powered by your choice of 9 different providers.

![Popup — Presets tab](docs/screenshots/popup-presets.png)

---

## What it does

Most translation tools require you to copy text, open another tab, paste, translate, then copy the result back. FluentKey eliminates all of that.

**Select text or focus an input → press your shortcut → done.**

The extension works on any website, in any input field (textarea, `contenteditable`, rich text editors), and on any selected text on the page.

---

## Features

### 4 preset types

Each preset is bound to a keyboard shortcut. You can have up to 10 presets active simultaneously.

| Type | What it does |
|---|---|
| **Translator** | Translates text between any two languages |
| **Transformer** | Applies Unicode text effects (bold, italic, Morse, Zalgo, Braille, Leet, ROT13...) |
| **Custom Transform** | User-defined character mapping tables |
| **LLM Prompt** | Sends text to an AI with a custom prompt template using `{{input}}` |

### 9 translation / AI providers

| Provider | Type | Key required |
|---|---|---|
| Google Translate | Translation | No |
| Chrome Built-in AI | Translation (local) | No |
| DeepL | Translation | Yes |
| Google Gemini | LLM | Yes |
| ChatGPT (OpenAI) | LLM | Yes |
| Groq | LLM | Yes |
| Ollama | LLM (local) | No |
| OpenRouter | LLM | Yes |
| Custom OpenAI-compatible | LLM | Optional |

### Multi-shortcut system

- Single shortcuts: `Alt+T`, `Ctrl+Shift+Q`
- Multi-key sequences: `Alt+T+1`, `Alt+T+2` (up to 10 presets without conflicts)
- Automatic conflict detection and prevention

### Other highlights

- Works on **any website** — input fields, textareas, `contenteditable`, page selections
- **Per-preset provider override** — use Gemini for one preset and DeepL for another
- **6 UI languages**: English, Français, Español, Deutsch, 中文, 日本語
- **Dark / Light / Auto** theme
- **Cross-browser**: Chrome 88+ and Firefox 140+ (Manifest V3)

---

## Screenshots

| Presets tab | Provider tab |
|---|---|
| ![Presets tab](docs/screenshots/popup-presets.png) | ![Provider tab](docs/screenshots/popup-provider.png) |

![Translation in action](docs/screenshots/demo.gif)

![Transformation preset](docs/screenshots/popup-transformation.png)

---

## Installation

### Load from source

**Requirements:** Node.js 18+

```bash
git clone https://github.com/AlimMOEUNG/FluentKey-Universal-Input-Translator-Write-in-Any-Language-.git
cd FluentKey-Universal-Input-Translator-Write-in-Any-Language-
npm install
```

**Build for Chrome:**
```bash
npm run build:chrome:dev    # Development (with sourcemaps)
npm run build:chrome        # Production (minified + ZIP)
```

**Build for Firefox:**
```bash
npm run build:firefox:dev
npm run build:firefox
```

### Load the unpacked extension

**Chrome:**
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select `dist-chrome/`

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select any file inside `dist-firefox/`

---

## Quick start

### 1. Choose a provider

Click the extension icon → **Provider** tab → select your provider and enter credentials if required → **Validate & Save**.

Free options to get started immediately:
- **Google Translate** — no setup needed
- **Chrome Built-in AI** — requires Chrome 143+ with Gemini Nano enabled
- **Ollama** — local models, no API key

### 2. Configure a preset

Go to the **Presets** tab. The default preset translates to English with `Alt+T`. You can:
- Change the source / target language
- Assign a different keyboard shortcut
- Switch the preset type to Transformer, LLM Prompt, etc.

### 3. Use it

On any webpage:
- **Selected text**: select → press shortcut → text is replaced in place
- **Input field**: click inside → press shortcut → content is translated
- **Multiple presets**: `Alt+T` for one action, `Alt+T+2` for another

---

## Provider setup

### Google Translate
No setup required. Works out of the box.

### DeepL
1. Create a free account at [deepl.com/pro-api](https://www.deepl.com/pro-api)
2. Copy your API key from the dashboard
3. Paste it in the Provider tab → Validate & Save

### Gemini / ChatGPT / Groq / OpenRouter
Same pattern: get an API key from the provider's developer portal, paste it in the Provider tab, validate.

### Ollama (local)
1. Install [Ollama](https://ollama.com) and pull a model (`ollama pull llama3`)
2. Set Base URL to `http://localhost:11434`
3. Click **↻** to auto-discover your installed models

### Custom OpenAI-compatible endpoint
Point to any API that follows the OpenAI chat completions format — LM Studio, vLLM, Jan, etc.

---

## Architecture

```
src/
├── background.ts                    # Service worker — CORS proxy, API key validation
├── content-script.ts                # Injected script — keyboard listeners, text replacement
├── popup/
│   └── Popup.vue                    # Root popup (thin orchestrator)
├── components/
│   ├── PopupHeader.vue              # Title + language selector + theme toggle
│   ├── MainNavTabs.vue              # Presets / Provider segmented control
│   ├── PresetsTab.vue               # Preset management view
│   ├── ProviderTab.vue              # Provider configuration view
│   ├── PresetEditor.vue             # Full preset editor (all 4 types)
│   ├── PresetTabs.vue               # Tab bar for switching active preset
│   └── LanguageSelector.vue        # Searchable language picker with flags
├── core/
│   ├── handlers/
│   │   ├── KeyboardShortcutHandler.ts   # Shortcut → preset routing
│   │   ├── KeyboardSequenceDetector.ts  # Multi-key sequence detection
│   │   └── input/                       # Input detection & text replacement
│   └── translation/
│       ├── TranslationEngine.ts         # Provider factory & lazy init
│       ├── TransformationEngine.ts      # Unicode text transformations
│       ├── LLMPromptExecutor.ts         # LLM prompt execution
│       └── providers/                   # One file per provider (9 total)
├── composables/
│   ├── usePresetsSettings.ts        # Preset CRUD + storage sync
│   ├── useSettings.ts               # Provider keys + config
│   ├── usePopupState.ts             # Active tab persistence
│   └── useThemeMode.ts              # Dark / light / auto theme
└── types/
    └── common.ts                    # Shared TypeScript types
```

### Key design patterns

- **Factory**: `TranslationEngine` creates the right provider based on settings
- **Adapter**: `BaseTranslationProvider` abstract class, one concrete class per provider
- **Strategy**: runtime provider swapping without changing consumer code
- **Discriminated union**: `Preset = TranslationPreset | TransformationPreset | CustomTransformPreset | LLMPromptPreset`

---

## Development

```bash
npm run type-check      # TypeScript — 0 errors
npm run lint            # ESLint with auto-fix
npm run format          # Prettier
npm run build:all:dev   # Both browsers, development mode
```

---

## Tech stack

| Tool | Version | Role |
|---|---|---|
| Vue 3 | 3.4 | Popup UI (Composition API) |
| TypeScript | 5.8 | Type safety (strict mode) |
| Tailwind CSS | 4 | Styling |
| Vite | 6 | Build system |
| Manifest V3 | — | Chrome & Firefox |

---

## License

MIT — see [LICENSE](LICENSE)
