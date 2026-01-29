import { ref } from 'vue'

export type SupportedLocale = 'en' | 'fr' | 'es' | 'de' | 'zh' | 'ja'

export const supportedLocales: Array<{ value: SupportedLocale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

type TranslationValue = string
type TranslationMap = Record<TranslationKey, TranslationValue>

const enTranslations = {
  // App
  appTitle: 'Simple Input Translator',

  // Provider
  providerLabel: 'Provider',
  providerBuiltin: 'Chrome Built-in AI',
  providerDeepL: 'DeepL API',
  providerGemini: 'Gemini API',

  // API Keys
  apiKeyValidate: 'Validate & Save',
  apiKeyValidating: 'Validating...',
  apiKeyValid: 'Valid API key',
  apiKeyValidCached: 'API key configured',
  apiKeyRequired: 'API key required',
  apiKeyPlaceholder: 'Enter API key',

  // API Key Labels
  apiKeyLabelDeepL: 'DeepL API Key',
  apiKeyLabelGemini: 'Gemini API Key',
  apiKeyLabelOpenAI: 'OpenAI API Key',
  apiKeyLabelGroq: 'Groq API Key',
  apiKeyLabelOpenRouter: 'OpenRouter API Key',

  // Configuration Labels
  labelModel: 'Model',
  labelBaseUrl: 'Base URL',
  labelApiKeyOptional: 'API Key (Optional)',

  // Placeholders
  placeholderModel: 'model-name',
  placeholderBaseUrl: 'https://api.example.com/v1',
  placeholderOptional: 'Optional',

  // Validation Messages
  validationSuccess: 'Configuration valid',
  validationFailed: 'Validation failed',
  validationLoaded: 'Configuration loaded',
  modelRequired: 'Model name required',
  baseUrlRequired: 'Base URL required',

  // Languages
  sourceLanguage: 'Source Language',
  sourceLanguageDescription: 'Select "Auto-detect" to let the provider detect the source language',
  targetLanguage: 'Target Language',
  autoDetect: 'Auto-detect',

  // Keyboard Shortcut
  keyboardShortcut: 'Keyboard Shortcut',
  keyboardShortcutDescription: 'Press the desired keyboard combination (e.g., Alt+T, Ctrl+Shift+T)',

  // Usage
  howToUse: 'How to use:',
  usageSelect: 'Select text and press {shortcut} to translate it',
  usageInput: 'Focus on an input field and press {shortcut} to translate the content',
  usageWorks: 'Works on any website!',

  // Footer
  footerText: 'Simple Input Translator • Built with Vue 3',

  // Theme
  themeToggle: 'Toggle theme',
} as const

export type TranslationKey = keyof typeof enTranslations

const frTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: 'Fournisseur',
  providerBuiltin: 'IA intégrée Chrome',
  providerDeepL: 'API DeepL',
  providerGemini: 'API Gemini',
  apiKeyValidate: 'Valider & Sauvegarder',
  apiKeyValidating: 'Validation...',
  apiKeyValid: 'Clé API valide',
  apiKeyValidCached: 'Clé API configurée',
  apiKeyRequired: 'Clé API requise',
  apiKeyPlaceholder: 'Entrer la clé API',
  apiKeyLabelDeepL: 'Clé API DeepL',
  apiKeyLabelGemini: 'Clé API Gemini',
  apiKeyLabelOpenAI: 'Clé API OpenAI',
  apiKeyLabelGroq: 'Clé API Groq',
  apiKeyLabelOpenRouter: 'Clé API OpenRouter',
  labelModel: 'Modèle',
  labelBaseUrl: 'URL de base',
  labelApiKeyOptional: 'Clé API (Optionnel)',
  placeholderModel: 'nom-du-modèle',
  placeholderBaseUrl: 'https://api.exemple.com/v1',
  placeholderOptional: 'Optionnel',
  validationSuccess: 'Configuration valide',
  validationFailed: 'Validation échouée',
  validationLoaded: 'Configuration chargée',
  modelRequired: 'Nom du modèle requis',
  baseUrlRequired: 'URL de base requise',
  sourceLanguage: 'Langue source',
  sourceLanguageDescription:
    'Sélectionner "Détection auto" pour laisser le fournisseur détecter la langue source',
  targetLanguage: 'Langue cible',
  autoDetect: 'Détection auto',
  keyboardShortcut: 'Raccourci clavier',
  keyboardShortcutDescription:
    'Appuyez sur la combinaison de touches souhaitée (ex: Alt+T, Ctrl+Shift+T)',
  howToUse: 'Comment utiliser :',
  usageSelect: 'Sélectionnez du texte et appuyez sur {shortcut} pour le traduire',
  usageInput:
    'Concentrez-vous sur un champ de saisie et appuyez sur {shortcut} pour traduire le contenu',
  usageWorks: 'Fonctionne sur tous les sites web !',
  footerText: 'Simple Input Translator • Créé avec Vue 3',
  themeToggle: 'Changer de thème',
}

const esTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: 'Proveedor',
  providerBuiltin: 'IA integrada de Chrome',
  providerDeepL: 'API DeepL',
  providerGemini: 'API Gemini',
  apiKeyValidate: 'Validar y Guardar',
  apiKeyValidating: 'Validando...',
  apiKeyValid: 'Clave API válida',
  apiKeyValidCached: 'Clave API configurada',
  apiKeyRequired: 'Clave API requerida',
  apiKeyPlaceholder: 'Ingresar clave API',
  apiKeyLabelDeepL: 'Clave API DeepL',
  apiKeyLabelGemini: 'Clave API Gemini',
  apiKeyLabelOpenAI: 'Clave API OpenAI',
  apiKeyLabelGroq: 'Clave API Groq',
  apiKeyLabelOpenRouter: 'Clave API OpenRouter',
  labelModel: 'Modelo',
  labelBaseUrl: 'URL base',
  labelApiKeyOptional: 'Clave API (Opcional)',
  placeholderModel: 'nombre-del-modelo',
  placeholderBaseUrl: 'https://api.ejemplo.com/v1',
  placeholderOptional: 'Opcional',
  validationSuccess: 'Configuración válida',
  validationFailed: 'Validación fallida',
  validationLoaded: 'Configuración cargada',
  modelRequired: 'Nombre del modelo requerido',
  baseUrlRequired: 'URL base requerida',
  sourceLanguage: 'Idioma de origen',
  sourceLanguageDescription:
    'Seleccione "Detección automática" para que el proveedor detecte el idioma de origen',
  targetLanguage: 'Idioma de destino',
  autoDetect: 'Detección automática',
  keyboardShortcut: 'Atajo de teclado',
  keyboardShortcutDescription:
    'Presione la combinación de teclas deseada (ej: Alt+T, Ctrl+Shift+T)',
  howToUse: 'Cómo usar:',
  usageSelect: 'Seleccione texto y presione {shortcut} para traducirlo',
  usageInput: 'Enfóquese en un campo de entrada y presione {shortcut} para traducir el contenido',
  usageWorks: '¡Funciona en cualquier sitio web!',
  footerText: 'Simple Input Translator • Creado con Vue 3',
  themeToggle: 'Cambiar tema',
}

const deTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: 'Anbieter',
  providerBuiltin: 'Chrome integrierte KI',
  providerDeepL: 'DeepL API',
  providerGemini: 'Gemini API',
  apiKeyValidate: 'Validieren & Speichern',
  apiKeyValidating: 'Validierung...',
  apiKeyValid: 'Gültiger API-Schlüssel',
  apiKeyValidCached: 'API-Schlüssel konfiguriert',
  apiKeyRequired: 'API-Schlüssel erforderlich',
  apiKeyPlaceholder: 'API-Schlüssel eingeben',
  apiKeyLabelDeepL: 'DeepL API-Schlüssel',
  apiKeyLabelGemini: 'Gemini API-Schlüssel',
  apiKeyLabelOpenAI: 'OpenAI API-Schlüssel',
  apiKeyLabelGroq: 'Groq API-Schlüssel',
  apiKeyLabelOpenRouter: 'OpenRouter API-Schlüssel',
  labelModel: 'Modell',
  labelBaseUrl: 'Basis-URL',
  labelApiKeyOptional: 'API-Schlüssel (Optional)',
  placeholderModel: 'modellname',
  placeholderBaseUrl: 'https://api.beispiel.com/v1',
  placeholderOptional: 'Optional',
  validationSuccess: 'Konfiguration gültig',
  validationFailed: 'Validierung fehlgeschlagen',
  validationLoaded: 'Konfiguration geladen',
  modelRequired: 'Modellname erforderlich',
  baseUrlRequired: 'Basis-URL erforderlich',
  sourceLanguage: 'Quellsprache',
  sourceLanguageDescription:
    'Wählen Sie "Automatische Erkennung", damit der Anbieter die Quellsprache erkennt',
  targetLanguage: 'Zielsprache',
  autoDetect: 'Automatische Erkennung',
  keyboardShortcut: 'Tastenkombination',
  keyboardShortcutDescription:
    'Drücken Sie die gewünschte Tastenkombination (z.B. Alt+T, Ctrl+Shift+T)',
  howToUse: 'Verwendung:',
  usageSelect: 'Wählen Sie Text aus und drücken Sie {shortcut}, um ihn zu übersetzen',
  usageInput:
    'Fokussieren Sie ein Eingabefeld und drücken Sie {shortcut}, um den Inhalt zu übersetzen',
  usageWorks: 'Funktioniert auf jeder Website!',
  footerText: 'Simple Input Translator • Erstellt mit Vue 3',
  themeToggle: 'Thema wechseln',
}

const zhTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: '提供商',
  providerBuiltin: 'Chrome 内置 AI',
  providerDeepL: 'DeepL API',
  providerGemini: 'Gemini API',
  apiKeyValidate: '验证并保存',
  apiKeyValidating: '验证中...',
  apiKeyValid: '有效的 API 密钥',
  apiKeyValidCached: 'API 密钥已配置',
  apiKeyRequired: '需要 API 密钥',
  apiKeyPlaceholder: '输入 API 密钥',
  apiKeyLabelDeepL: 'DeepL API 密钥',
  apiKeyLabelGemini: 'Gemini API 密钥',
  apiKeyLabelOpenAI: 'OpenAI API 密钥',
  apiKeyLabelGroq: 'Groq API 密钥',
  apiKeyLabelOpenRouter: 'OpenRouter API 密钥',
  labelModel: '模型',
  labelBaseUrl: '基础 URL',
  labelApiKeyOptional: 'API 密钥（可选）',
  placeholderModel: '模型名称',
  placeholderBaseUrl: 'https://api.example.com/v1',
  placeholderOptional: '可选',
  validationSuccess: '配置有效',
  validationFailed: '验证失败',
  validationLoaded: '配置已加载',
  modelRequired: '需要模型名称',
  baseUrlRequired: '需要基础 URL',
  sourceLanguage: '源语言',
  sourceLanguageDescription: '选择"自动检测"让提供商检测源语言',
  targetLanguage: '目标语言',
  autoDetect: '自动检测',
  keyboardShortcut: '键盘快捷键',
  keyboardShortcutDescription: '按下所需的键盘组合（例如：Alt+T, Ctrl+Shift+T）',
  howToUse: '如何使用：',
  usageSelect: '选择文本并按 {shortcut} 翻译',
  usageInput: '聚焦输入字段并按 {shortcut} 翻译内容',
  usageWorks: '适用于任何网站！',
  footerText: 'Simple Input Translator • 使用 Vue 3 构建',
  themeToggle: '切换主题',
}

const jaTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: 'プロバイダー',
  providerBuiltin: 'Chrome 内蔵 AI',
  providerDeepL: 'DeepL API',
  providerGemini: 'Gemini API',
  apiKeyValidate: '検証して保存',
  apiKeyValidating: '検証中...',
  apiKeyValid: '有効な API キー',
  apiKeyValidCached: 'API キー設定済み',
  apiKeyRequired: 'API キーが必要です',
  apiKeyPlaceholder: 'API キーを入力',
  apiKeyLabelDeepL: 'DeepL API キー',
  apiKeyLabelGemini: 'Gemini API キー',
  apiKeyLabelOpenAI: 'OpenAI API キー',
  apiKeyLabelGroq: 'Groq API キー',
  apiKeyLabelOpenRouter: 'OpenRouter API キー',
  labelModel: 'モデル',
  labelBaseUrl: 'ベース URL',
  labelApiKeyOptional: 'API キー（オプション）',
  placeholderModel: 'モデル名',
  placeholderBaseUrl: 'https://api.example.com/v1',
  placeholderOptional: 'オプション',
  validationSuccess: '設定が有効です',
  validationFailed: '検証に失敗しました',
  validationLoaded: '設定が読み込まれました',
  modelRequired: 'モデル名が必要です',
  baseUrlRequired: 'ベース URL が必要です',
  sourceLanguage: 'ソース言語',
  sourceLanguageDescription: 'プロバイダーにソース言語を検出させるには「自動検出」を選択',
  targetLanguage: 'ターゲット言語',
  autoDetect: '自動検出',
  keyboardShortcut: 'キーボードショートカット',
  keyboardShortcutDescription:
    '希望のキーボード組み合わせを押してください（例：Alt+T, Ctrl+Shift+T）',
  howToUse: '使い方：',
  usageSelect: 'テキストを選択して {shortcut} を押して翻訳',
  usageInput: '入力フィールドにフォーカスして {shortcut} を押してコンテンツを翻訳',
  usageWorks: 'すべてのウェブサイトで動作します！',
  footerText: 'Simple Input Translator • Vue 3 で構築',
  themeToggle: 'テーマを切り替え',
}

const translations: Record<SupportedLocale, TranslationMap> = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
  de: deTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

const localeMap: Record<string, SupportedLocale> = {
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  fr: 'fr',
  'fr-fr': 'fr',
  es: 'es',
  'es-es': 'es',
  'es-mx': 'es',
  de: 'de',
  'de-de': 'de',
  zh: 'zh',
  'zh-cn': 'zh',
  'zh-tw': 'zh',
  ja: 'ja',
  'ja-jp': 'ja',
}

const fallbackLocale: SupportedLocale = 'en'
const activeLocale = ref<SupportedLocale>(detectLocale())
const localeSet = new Set(supportedLocales.map((item) => item.value))

function detectLocale(): SupportedLocale {
  const chromeLang =
    typeof chrome !== 'undefined' && chrome?.i18n?.getUILanguage ? chrome.i18n.getUILanguage() : ''
  const language = (
    chromeLang ||
    navigator.language ||
    navigator.languages?.[0] ||
    ''
  ).toLowerCase()

  if (language && localeMap[language]) {
    return localeMap[language]
  }

  const prefix = language.split('-')[0]
  if (prefix && localeMap[prefix]) {
    return localeMap[prefix]
  }

  return fallbackLocale
}

function formatMessage(message: string, params?: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!params || params[key] === undefined) {
      return `{${key}}`
    }
    return String(params[key])
  })
}

export function translate(
  key: TranslationKey,
  options?: { params?: Record<string, string | number> }
): string {
  const locale = activeLocale.value
  const messages = translations[locale] || translations[fallbackLocale]
  const value = messages[key] ?? translations[fallbackLocale][key]

  return formatMessage(value, options?.params)
}

export function useI18n() {
  return {
    t: translate,
    locale: activeLocale,
    setLocale,
    supportedLocales,
  }
}

export function setLocale(locale: SupportedLocale): void {
  if (!localeSet.has(locale)) {
    activeLocale.value = fallbackLocale
    return
  }
  activeLocale.value = locale
}
