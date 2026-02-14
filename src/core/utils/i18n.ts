import { ref } from 'vue'

export type SupportedLocale = 'en' | 'fr' | 'es' | 'de' | 'zh' | 'ja'
export type Locale = SupportedLocale // Alias for compatibility

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
  appTitle: 'Power Input',

  // Tabs
  presetsTab: 'Presets',
  globalTab: 'Global',

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
  customModel: 'Custom Model',

  // Placeholders
  placeholderModel: 'model-name',
  placeholderCustomModel: 'Enter custom model name',
  placeholderBaseUrl: 'https://api.example.com/v1',
  placeholderOptional: 'Optional',

  // Validation Messages
  validationSuccess: 'Configuration valid',
  validationFailed: 'Validation failed',
  validationLoaded: 'Configuration loaded',
  modelRequired: 'Model name required',
  baseUrlRequired: 'Base URL required',
  ollamaHint: 'Click ↻ to load your installed Ollama models',

  // API Runtime Error Messages
  errorApiQuotaExceeded:
    'Your API key quota has been exceeded. Please check your API key quota.',
  errorApiKeyUnauthorized: 'Invalid or unauthorized API key. Please check your settings.',

  // Languages
  languagesLabel: 'Languages',
  sourceLanguage: 'Source Language',
  sourceLanguageDescription: 'Select "Auto-detect" to let the provider detect the source language',
  targetLanguage: 'Target Language',
  autoDetect: 'Auto-detect',
  searchLanguagePlaceholder: 'Search language...',

  // Translation Custom Provider
  translationUseCustomProvider: 'Use custom provider for this preset',
  translationCustomProviderLabel: 'Custom Provider',
  translationCustomModelLabel: 'Custom Model (for LLM providers)',
  translationCustomModelPlaceholder: 'e.g., gemini-1.5-flash, gpt-4o-mini',

  // Keyboard Shortcut
  keyboardShortcut: 'Keyboard Shortcut',
  keyboardShortcutDescription:
    'Press the desired keyboard combination (e.g., Ctrl+Alt+T, Ctrl+Alt+2)',

  // Presets
  presetName: 'Preset Name',
  presetNamePlaceholder: 'My Preset',
  presetNameDefault: 'Preset {index}',
  addPreset: 'Add Preset',
  deletePreset: 'Delete Preset',
  presetDeleteTitle: 'Delete Preset?',
  presetDeleteMessage: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
  presetDeleteConfirm: 'Are you sure you want to delete "{name}"?',
  shortcutInvalidFormat: 'Invalid shortcut format. Must be modifier+key (e.g., Alt+T, Ctrl+1)',
  shortcutModifierOnly:
    'Modifier-only shortcuts (Alt, Ctrl, etc.) are not allowed to prevent conflicts',
  shortcutDuplicate: 'Shortcut already used by "{name}"',
  shortcutConflictTitle: 'Keyboard Shortcut Conflict',
  shortcutTooManyKeys: 'Too many keys. Maximum 2 keys after modifiers (e.g., Alt+T+1)',
  shortcutHelp:
    'Supports: modifier+key (Alt+T) or sequences (Alt+T+1). Max 2 keys. Modifier-only shortcuts are forbidden.',
  cannotDeleteLastPreset: 'Cannot delete the last preset',
  saveChanges: 'Save',
  unsavedChanges: 'Unsaved changes',
  cancel: 'Cancel',
  undo: 'Undo',
  undoChanges: 'Undo changes',
  validationError: 'Validation error',
  ok: 'OK',

  // Transformation Presets
  enableTransformationMode: 'Fun text transformation',
  transformationModeDescription: 'Apply Unicode effects instead of translation',
  transformationStyle: 'Transformation Style',
  previewExample: 'Preview Example',
  previewPlaceholder: 'Type to see transformation...',

  // Usage
  howToUse: 'How to use:',
  usageSelect: 'Select text and press {shortcut} to translate it',
  usageInput: 'Focus on an input field and press {shortcut} to translate the content',
  usageWorks: 'Works on any website!',

  // Theme
  themeToggle: 'Toggle theme',

  // 4-mode selector
  presetModeLabel: 'Mode',
  presetModeTranslator: 'Translator',
  presetModeTransformer: 'Transformer',
  presetModeCustomTransform: 'Custom Transform',
  presetModeLLMPrompt: 'LLM Prompt',

  // Custom Transform preset panel
  customTransformLabel: 'Transformation',
  customTransformPlaceholder: 'Select a transformation',
  customTransformEmpty: 'No custom transformations. Open options to create one.',
  customTransformOpenOptions: 'Manage Transformations',

  // LLM Prompt preset panel
  llmPromptLabel: 'Prompt Template',
  llmPromptPlaceholder: 'Use {{input}} for the selected text',
  llmPromptHint: 'The {{input}} placeholder will be replaced with the selected text',
  llmPromptProviderLabel: 'LLM Provider',
  llmPromptModelLabel: 'Model',
  llmPromptModelPlaceholder: 'Enter model name',
  expandPrompt: 'Expand prompt editor',

  // Preset validation
  validationCustomTransformRequired: 'Please select a custom transformation',
  validationLLMPromptRequired: 'Please enter a prompt template with {{input}}',
  validationLLMProviderRequired: 'Please select an LLM provider',
  validationLLMModelRequired: 'Please enter a model name',
  validationCustomProviderRequired: 'Please select a custom provider',

  // Pinned preset (right-click context menu)
  pinnedPresetLabel: 'Use for right-click menu',
  contextMenuTitle: '{name}',

  // Word selection modifier (Global tab)
  selectionModifierLabel: 'Word Selection Modifier',
  selectionModifierHelp:
    'Hold Modifier+Arrow keys in any focused input to select text word by word. Great for quickly selecting words before translating with a keyboard shortcut!',
  selectionModifierExample: '{modifier}+← / {modifier}+→ selects word by word',

  // Options page
  optionsTitle: 'Custom Transformations',
  optionsNewTransformation: 'New Transformation',
  optionsEmptyList: 'No transformations yet',
  optionsEditButton: 'Edit',
  optionsDeleteButton: 'Delete',
  optionsDeleteTitle: 'Delete Transformation?',
  optionsDeleteMessage: 'Are you sure you want to delete "{name}"? This cannot be undone.',
  optionsMappings: '{count} mappings',
  optionsEditorName: 'Name',
  optionsEditorNamePlaceholder: 'My transformation',
  optionsPopulateLabel: 'Pre-populate from built-in style',
  optionsPopulateButton: 'Load',
  optionsTableSource: 'Source',
  optionsTableTarget: 'Target',
  optionsAddMapping: '+ Add Mapping',
  optionsPreviewLabel: 'Live Preview',
  optionsPreviewPlaceholder: 'Type text to preview...',
  optionsSaveButton: 'Save',
  optionsCancelButton: 'Cancel',
  optionsMaxReached: 'Maximum of {max} transformations reached',
  optionsEmptyName: 'Name is required',

  // Pro / Beta upgrade prompt
  proUpgradeTitle: 'Unlock Unlimited Presets',
  proUpgradeLimitReached: "You've reached the {max}-preset limit.",
  proBetaTitle: 'Free Beta Access',
  proBetaDescription: 'Submit your email on the form to receive a free beta code.',
  proBetaGetCode: 'Get beta code',
  proBetaCodePlaceholder: 'Enter beta code',
  proBetaActivate: 'Activate',
  proBetaErrorInvalid: 'Invalid code. Please check and try again.',
  proBetaErrorExpired: 'Beta period has ended. Upgrade to Pro for unlimited presets.',
  proBetaSuccess: 'Beta access activated! Unlimited presets unlocked.',
  proBetaActivating: 'Activating...',
  proUpgradeButton: 'Upgrade to Pro',
  proUpgradeComingSoon: '(coming soon)',
  proClose: 'Close',
  presetLockedTooltip: 'Locked. Upgrade to Pro to edit this preset',
  presetLockedMessage: 'This preset is locked. Upgrade to Pro to access it.',

  // What's New page — header & tabs
  whatsNewTitle: "What's New",
  whatsNewCurrentVersion: 'Version {version}',
  whatsNewViewUpdates: 'Updates',
  whatsNewViewFeatures: 'Features',
  whatsNewRateExtension: 'Rate Extension',
  whatsNewLatestVersion: 'Latest',

  // What's New page — roadmap
  whatsNewRoadmapTitle: "What's Next",
  whatsNewRoadmapBadge: 'Ideas',
  whatsNewRoadmapItem1: 'More LLM providers & smarter model auto-discovery',
  whatsNewRoadmapItem2: 'Preset sharing & import/export',
  whatsNewRoadmapItem3: 'Batch translation for entire pages',
  whatsNewRoadmapItem4: 'Pro plan: managed API keys, no setup required',
  whatsNewRoadmapDisclaimer:
    'These are ideas, not commitments. Whether they ship depends entirely on what you ask for. So tell me what matters to you.',
  whatsNewRoadmapCtaLabel: 'Share your ideas or report a bug',

  // Update context modal (shown when whats-new opens after a major/minor update)
  updateModalTitle: 'Power Input just got better!',
  updateModalFirstUse: 'This is your first use since the update.',
  updateModalPurpose:
    'This page keeps you informed of new features, improvements, and bug fixes. Below, you will find all the updates organized by version.',
  updateModalReassurance:
    "Don't worry! This page opened automatically for the update. The extension still works normally. Just click the extension icon again to use it as usual.",
  updateModalGotIt: "Got it. Show me what's new",

  // What's New page — freemium banner
  freemiumTitle: 'Free & open to everyone',
  freemiumBadge: 'Freemium',
  freemiumPoint1: 'All translation & transformation modes unlocked',
  freemiumPoint2: 'All LLM providers available (DeepL, Gemini, OpenAI…)',
  freemiumPoint3: 'Custom text transformations in Options',
  freemiumPoint4: 'All customization options (languages, shortcuts, context menu…)',
  freemiumLimitText:
    'One soft limit: the number of presets is capped for free users. Power users can unlock more (unlimited) via a beta code and a Pro plan is coming.',

  // What's New page — subscription survey
  surveyTitle: 'Help us shape the future of Power Input',
  surveyDescription:
    'Would you be interested in a monthly subscription that handles API keys for you. No setup, just works?',

  // Popup header — rotating ticker CTAs
  tickerWhatsNew: "What's new",
  tickerRateUs: 'Rate us',
  tickerFeedback: 'Bug/Feature?',

  // All-extensions cross-promo banner (popup footer)
  allExtensionsBannerTitle: 'More free extensions by Subtiltee',
  allExtensionsBannerDesc: 'Translators for WhatsApp, Discord, Reddit & more',
  allExtensionsBannerCta: 'See all extensions',

  // All-extensions link at bottom of What's New page
  allExtensionsPromoTitle: 'More free extensions by Subtiltee',
  allExtensionsPromoDesc: 'Translators for WhatsApp, Discord, Reddit & subtitle downloader',

  // Changelog entries — v1.0.0
  changelogV100TranslationPresets:
    'Translation presets with configurable source & target languages',
  changelogV100Providers: 'Support for DeepL, Gemini, OpenAI, Groq, OpenRouter & more',
  changelogV100LlmPrompt: 'LLM Prompt preset mode for custom AI transformations',
  changelogV100Unicode: 'Fun Unicode text transformers (bold, italic, cursive…)',
  changelogV100ContextMenu: 'Right-click context menu for quick pinned-preset access',
  changelogV100Shortcuts: 'Keyboard shortcuts per preset (e.g. Alt+T)',
  changelogV100WordSelection: 'Word-by-word selection modifier (Modifier + Arrow keys)',
  changelogV100CustomTransform: 'Custom text transformation builder in Options',
  changelogV100DarkMode: 'Dark mode with auto system-detection',
  changelogV100I18n: 'Multilingual UI (EN / FR / ES / DE / ZH / JA)',

  // Feature categories (What's New — Features view)
  featureCategoryTranslation: 'Translation',
  featureCategoryPresets: 'Presets & Shortcuts',
  featureCategoryTransformations: 'Transformations',
  featureCategoryInterface: 'Interface & Experience',

  // Feature items
  featureDeepL: 'DeepL API (free & pro)',
  featureGemini: 'Google Gemini API',
  featureOpenAI: 'OpenAI-compatible APIs (OpenAI, Groq, OpenRouter, Ollama…)',
  featureBuiltinAI: 'Chrome Built-in AI (on supported Chrome builds)',
  featureCustomProvider: 'Per-preset custom provider override',
  featureAutoDetect: 'Auto language detection',
  featureMultiPreset: 'Multiple presets with names & dedicated shortcuts',
  featurePinContextMenu: 'Pin a preset to the right-click context menu',
  featureKeyboardShortcutPerPreset: 'Keyboard shortcut per preset (modifier + key sequence)',
  featureWordSelectionModifier: 'Word-selection modifier (Modifier + Arrow keys)',
  featureDraftAutoSave: 'Draft auto-save so you never lose changes',
  featureLlmPromptMode: 'LLM Prompt mode with {{input}} placeholder',
  featureUnicodeEffects: 'Unicode text effects (bold, italic, fraktur, cursive…)',
  featureCustomMappings: 'Custom character-mapping transformations via Options',
  featureDarkMode: 'Dark / Light / Auto theme',
  featureI18n: '6-language UI (EN / FR / ES / DE / ZH / JA)',
  featureInlinePreview: 'Inline preview during preset editing',
  featurePendingIndicator: 'Pending-state indicator while the LLM is responding',

  // Theme mode labels
  themeAuto: 'Auto (system)',
  themeLight: 'Light mode',
  themeDark: 'Dark mode',
} as const

export type TranslationKey = keyof typeof enTranslations

const frTranslations: TranslationMap = {
  appTitle: 'Power Input',
  presetsTab: 'Presets',
  globalTab: 'Global',
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
  customModel: 'Modèle personnalisé',
  placeholderModel: 'nom-du-modèle',
  placeholderBaseUrl: 'https://api.exemple.com/v1',
  placeholderOptional: 'Optionnel',
  validationSuccess: 'Configuration valide',
  validationFailed: 'Validation échouée',
  validationLoaded: 'Configuration chargée',
  modelRequired: 'Nom du modèle requis',
  baseUrlRequired: 'URL de base requise',
  ollamaHint: 'Cliquez sur ↻ pour charger vos modèles Ollama installés',
  sourceLanguage: 'Langue source',
  sourceLanguageDescription:
    'Sélectionner "Détection auto" pour laisser le fournisseur détecter la langue source',
  targetLanguage: 'Langue cible',
  autoDetect: 'Détection auto',
  searchLanguagePlaceholder: 'Rechercher une langue...',
  translationUseCustomProvider: 'Utiliser un fournisseur personnalisé pour ce preset',
  translationCustomProviderLabel: 'Fournisseur personnalisé',
  translationCustomModelLabel: 'Modèle personnalisé (pour les fournisseurs LLM)',
  translationCustomModelPlaceholder: 'ex: gemini-1.5-flash, gpt-4o-mini',
  keyboardShortcut: 'Raccourci clavier',
  keyboardShortcutDescription:
    'Appuyez sur la combinaison de touches souhaitée (ex: Alt+T, Ctrl+Shift+T)',
  presetName: 'Nom du preset',
  presetNamePlaceholder: 'Mon preset',
  presetNameDefault: 'Preset {index}',
  addPreset: 'Ajouter un preset',
  deletePreset: 'Supprimer le preset',
  presetDeleteTitle: 'Delete Preset?',
  presetDeleteMessage: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
  presetDeleteConfirm: 'Êtes-vous sûr de vouloir supprimer "{name}" ?',
  languagesLabel: 'Languages',
  shortcutInvalidFormat:
    'Format de raccourci invalide. Doit avoir un modificateur (ex: Alt+T, Alt, Ctrl+1)',
  shortcutModifierOnly:
    'Modifier-only shortcuts (Alt, Ctrl, etc.) are not allowed to prevent conflicts',
  shortcutDuplicate: 'Raccourci déjà utilisé par "{name}"',
  shortcutConflictTitle: 'Keyboard Shortcut Conflict',
  shortcutTooManyKeys: 'Trop de touches. Maximum 2 touches après les modificateurs (ex: Alt+T+1)',
  shortcutHelp:
    'Supporte: modificateur (Alt), modificateur+touche (Alt+T), ou séquences (Alt+T+1). Max 2 touches.',
  cannotDeleteLastPreset: 'Impossible de supprimer la dernière triplette',
  saveChanges: 'Enregistrer',
  unsavedChanges: 'Modifications non enregistrées',
  cancel: 'Annuler',
  undo: 'Annuler',
  undoChanges: 'Annuler les changements',
  validationError: 'Validation error',
  ok: 'OK',
  howToUse: 'Comment utiliser :',
  usageSelect: 'Sélectionnez du texte et appuyez sur {shortcut} pour le traduire',
  usageInput:
    'Concentrez-vous sur un champ de saisie et appuyez sur {shortcut} pour traduire le contenu',
  usageWorks: 'Fonctionne sur tous les sites web !',
  themeToggle: 'Changer de thème',
  placeholderCustomModel: 'Entrez le nom du modèle personnalisé',
  enableTransformationMode: 'Transformation de texte amusante',
  transformationModeDescription: 'Appliquer des effets Unicode au lieu de la traduction',
  transformationStyle: 'Style de transformation',
  previewExample: "Exemple d'aperçu",
  previewPlaceholder: 'Tapez pour voir la transformation...',
  presetModeLabel: 'Mode',
  presetModeTranslator: 'Traducteur',
  presetModeTransformer: 'Transformateur',
  presetModeCustomTransform: 'Transform. personnalisée',
  presetModeLLMPrompt: 'Prompt LLM',
  customTransformLabel: 'Transformation',
  customTransformPlaceholder: 'Sélectionnez une transformation',
  customTransformEmpty:
    'Aucune transformation personnalisée. Ouvrez les options pour en créer une.',
  customTransformOpenOptions: 'Gérer les transformations',
  llmPromptLabel: 'Modèle de Prompt',
  llmPromptPlaceholder: 'Utilisez {{input}} pour le texte sélectionné',
  llmPromptHint: "L'espace réservé {{input}} sera remplacé par le texte sélectionné",
  llmPromptProviderLabel: 'Fournisseur LLM',
  llmPromptModelLabel: 'Modèle',
  llmPromptModelPlaceholder: 'Entrez le nom du modèle',
  validationCustomTransformRequired: 'Veuillez sélectionner une transformation personnalisée',
  validationLLMPromptRequired: 'Veuillez entrer un modèle de prompt avec {{input}}',
  validationLLMProviderRequired: 'Veuillez sélectionner un fournisseur LLM',
  validationLLMModelRequired: 'Veuillez entrer un nom de modèle',
  validationCustomProviderRequired: 'Veuillez sélectionner un fournisseur personnalisé',
  pinnedPresetLabel: 'Utiliser pour le menu contextuel',
  contextMenuTitle: '{name}',
  selectionModifierLabel: 'Modificateur de sélection de mots',
  selectionModifierHelp:
    "Maintenez Modificateur+Flèches dans n'importe quel champ de saisie pour sélectionner le texte mot par mot. Idéal pour sélectionner rapidement des mots avant de traduire avec un raccourci clavier !",
  selectionModifierExample: '{modifier}+← / {modifier}+→ sélectionne mot par mot',
  optionsTitle: 'Transformations Personnalisées',
  optionsNewTransformation: 'Nouvelle Transformation',
  optionsEmptyList: 'Aucune transformation pour le moment',
  optionsEditButton: 'Modifier',
  optionsDeleteButton: 'Supprimer',
  optionsDeleteTitle: 'Supprimer la transformation ?',
  optionsDeleteMessage: 'Êtes-vous sûr de vouloir supprimer ',
  optionsMappings: '{count} correspondances',
  optionsEditorName: 'Nom',
  optionsEditorNamePlaceholder: 'Ma transformation',
  optionsPopulateLabel: "Pré-remplir à partir d'un style intégré",
  optionsPopulateButton: 'Charger',
  optionsTableSource: 'Source',
  optionsTableTarget: 'Cible',
  optionsAddMapping: '+ Ajouter une correspondance',
  optionsPreviewLabel: 'Aperçu en direct',
  optionsPreviewPlaceholder: 'Tapez du texte pour prévisualiser...',
  optionsSaveButton: 'Enregistrer',
  optionsCancelButton: 'Annuler',
  optionsMaxReached: 'Maximum de {max} transformations atteint',
  optionsEmptyName: 'Le nom est obligatoire',
  proUpgradeTitle: 'Débloquer les presets illimités',
  proUpgradeLimitReached: 'Vous avez atteint la limite',
  proBetaTitle: 'Accès Bêta gratuit',
  proBetaDescription:
    'Soumettez votre e-mail sur le formulaire pour recevoir un code bêta gratuit.',
  proBetaGetCode: 'Obtenir un code bêta',
  proBetaCodePlaceholder: 'Entrez le code bêta',
  proBetaActivate: 'Activer',
  proBetaErrorInvalid: 'Code invalide. Veuillez vérifier et réessayer.',
  proBetaErrorExpired:
    'La période bêta est terminée. Passez à la version Pro pour des presets illimités.',
  proBetaSuccess: 'Accès bêta activé ! Presets illimités débloqués.',
  proBetaActivating: 'Activation...',
  proUpgradeButton: 'Passer à la version Pro',
  proUpgradeComingSoon: '(bientôt disponible)',
  proClose: 'Fermer',
  presetLockedTooltip: 'Verrouillé. Passez à la version Pro pour modifier ce preset',
  presetLockedMessage: 'Ce preset est verrouillé. Passez à la version Pro pour y accéder.',
  expandPrompt: "Expandre l'éditeur de texte",
}

const esTranslations: TranslationMap = {
  appTitle: 'Power Input',
  presetsTab: 'Presets',
  globalTab: 'Global',
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
  customModel: 'Modelo personalizado',
  placeholderModel: 'nombre-del-modelo',
  placeholderBaseUrl: 'https://api.ejemplo.com/v1',
  placeholderOptional: 'Opcional',
  validationSuccess: 'Configuración válida',
  validationFailed: 'Validación fallida',
  validationLoaded: 'Configuración cargada',
  modelRequired: 'Nombre del modelo requerido',
  baseUrlRequired: 'URL base requerida',
  ollamaHint: 'Haga clic en ↻ para cargar sus modelos de Ollama instalados',
  sourceLanguage: 'Idioma de origen',
  sourceLanguageDescription:
    'Seleccione "Detección automática" para que el proveedor detecte el idioma de origen',
  targetLanguage: 'Idioma de destino',
  autoDetect: 'Detección automática',
  searchLanguagePlaceholder: 'Buscar idioma...',
  translationUseCustomProvider: 'Usar proveedor personalizado para este preset',
  translationCustomProviderLabel: 'Proveedor personalizado',
  translationCustomModelLabel: 'Modelo personalizado (para proveedores LLM)',
  translationCustomModelPlaceholder: 'ej: gemini-1.5-flash, gpt-4o-mini',
  keyboardShortcut: 'Atajo de teclado',
  keyboardShortcutDescription:
    'Presione la combination de teclas deseada (ej: Alt+T, Ctrl+Shift+T)',
  presetName: 'Nombre del preset',
  presetNamePlaceholder: 'Mi preset',
  presetNameDefault: 'Preset {index}',
  addPreset: 'Agregar preset',
  deletePreset: 'Eliminar preset',
  presetDeleteTitle: 'Delete Preset?',
  presetDeleteMessage: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
  presetDeleteConfirm: '¿Está seguro de que desea eliminar "{name}"?',
  languagesLabel: 'Languages',
  shortcutInvalidFormat:
    'Formato de atajo inválido. Debe tener un modificador (ej: Alt+T, Alt, Ctrl+1)',
  shortcutModifierOnly:
    'Modifier-only shortcuts (Alt, Ctrl, etc.) are not allowed to prevent conflicts',
  shortcutDuplicate: 'Atajo ya utilizado por "{name}"',
  shortcutConflictTitle: 'Keyboard Shortcut Conflict',
  shortcutTooManyKeys:
    'Demasiadas teclas. Máximo 2 teclas después de los modificadores (ej: Alt+T+1)',
  shortcutHelp:
    'Soporta: modificador (Alt), modificador+tecla (Alt+T), o secuencias (Alt+T+1). Máx 2 teclas.',
  cannotDeleteLastPreset: 'No se puede eliminar el último preset',
  saveChanges: 'Guardar',
  unsavedChanges: 'Cambios no guardados',
  cancel: 'Cancelar',
  undo: 'Deshacer',
  undoChanges: 'Deshacer cambios',
  validationError: 'Validation error',
  ok: 'OK',
  howToUse: 'Cómo usar:',
  usageSelect: 'Seleccione texto y presione {shortcut} para traducirlo',
  usageInput: 'Enfóquese en un campo de entrada y presione {shortcut} para traducir el contenido',
  usageWorks: '¡Funciona en cualquier sitio web!',
  themeToggle: 'Cambiar tema',
  placeholderCustomModel: 'Enter custom model name',
  enableTransformationMode: 'Transformación de texto divertida',
  transformationModeDescription: 'Aplicar efectos Unicode en lugar de traducción',
  transformationStyle: 'Estilo de transformación',
  previewExample: 'Ejemplo de vista previa',
  previewPlaceholder: 'Escribe para ver la transformación...',
  presetModeLabel: 'Modo',
  presetModeTranslator: 'Traductor',
  presetModeTransformer: 'Transformador',
  presetModeCustomTransform: 'Transformación personalizada',
  presetModeLLMPrompt: 'Prompt de LLM',
  customTransformLabel: 'Transformación',
  customTransformPlaceholder: 'Seleccione una transformación',
  customTransformEmpty: 'No hay transformaciones personalizadas. Abra las opciones para crear una.',
  customTransformOpenOptions: 'Gestionar transformaciones',
  llmPromptLabel: 'Plantilla de Prompt',
  llmPromptPlaceholder: 'Use {{input}} para el texto seleccionado',
  llmPromptHint: 'El marcador {{input}} se reemplazará con el texto seleccionado',
  llmPromptProviderLabel: 'Proveedor de LLM',
  llmPromptModelLabel: 'Modelo',
  llmPromptModelPlaceholder: 'Ingrese el nombre del modelo',
  validationCustomTransformRequired: 'Por favor seleccione una transformación personalizada',
  validationLLMPromptRequired: 'Por favor ingrese una plantilla de prompt con {{input}}',
  validationLLMProviderRequired: 'Por favor seleccione un proveedor de LLM',
  validationLLMModelRequired: 'Por favor ingrese un nombre de modelo',
  validationCustomProviderRequired: 'Por favor seleccione un proveedor personalizado',
  pinnedPresetLabel: 'Usar para el menú contextual',
  contextMenuTitle: '{name}',
  selectionModifierLabel: 'Modificador de selección de palabras',
  selectionModifierHelp:
    'Mantenga presionado Modificador+Flechas en cualquier campo de entrada para seleccionar texto palabra por palabra. ¡Ideal para seleccionar palabras rápidamente antes de traducir con un atajo de teclado!',
  selectionModifierExample: '{modifier}+← / {modifier}+→ selecciona palabra por palabra',
  optionsTitle: 'Transformaciones personalizadas',
  optionsNewTransformation: 'Nueva transformación',
  optionsEmptyList: 'Aún no hay transformaciones',
  optionsEditButton: 'Editar',
  optionsDeleteButton: 'Eliminar',
  optionsDeleteTitle: '¿Eliminar transformación?',
  optionsDeleteMessage: '¿Estás seguro de que quieres eliminar ',
  optionsMappings: '{count} mapeos',
  optionsEditorName: 'Nombre',
  optionsEditorNamePlaceholder: 'Mi transformación',
  optionsPopulateLabel: 'Pre-poblar desde estilo incorporado',
  optionsPopulateButton: 'Cargar',
  optionsTableSource: 'Origen',
  optionsTableTarget: 'Destino',
  optionsAddMapping: '+ Añadir mapeo',
  optionsPreviewLabel: 'Vista previa en vivo',
  optionsPreviewPlaceholder: 'Escribe texto para previsualizar...',
  optionsSaveButton: 'Guardar',
  optionsCancelButton: 'Cancelar',
  optionsMaxReached: 'Se ha alcanzado el máximo de {max} transformaciones',
  optionsEmptyName: 'El nombre es obligatorio',
  proUpgradeTitle: 'Desbloquear presets ilimitados',
  proUpgradeLimitReached: 'Has alcanzado el límite',
  proBetaTitle: 'Acceso Beta gratuito',
  proBetaDescription:
    'Envíe su correo electrónico en el formulario para recibir un código beta gratuito.',
  proBetaGetCode: 'Obtener código beta',
  proBetaCodePlaceholder: 'Ingrese el código beta',
  proBetaActivate: 'Activar',
  proBetaErrorInvalid: 'Código inválido. Por favor, verifique e inténtelo de nuevo.',
  proBetaErrorExpired: 'El período beta ha terminado. Actualice a Pro para presets ilimitados.',
  proBetaSuccess: '¡Acceso beta activado! Presets ilimitados desbloqueados.',
  proBetaActivating: 'Activando...',
  proUpgradeButton: 'Actualizar a Pro',
  proUpgradeComingSoon: '(próximamente)',
  proClose: 'Cerrar',
  presetLockedTooltip: 'Bloqueado. Actualice a Pro para editar este preset',
  presetLockedMessage: 'Este preset está bloqueado. Actualice a Pro para acceder a él.',
  expandPrompt: 'Ampliar editor de indicaciones',
}

const deTranslations: TranslationMap = {
  appTitle: 'Power Input',
  presetsTab: 'Presets',
  globalTab: 'Global',
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
  customModel: 'Benutzerdefiniertes Modell',
  placeholderModel: 'modellname',
  placeholderBaseUrl: 'https://api.beispiel.com/v1',
  placeholderOptional: 'Optional',
  validationSuccess: 'Konfiguration gültig',
  validationFailed: 'Validierung fehgeschlagen',
  validationLoaded: 'Konfiguration geladen',
  modelRequired: 'Modellname erforderlich',
  baseUrlRequired: 'Basis-URL erforderlich',
  ollamaHint: 'Klicken Sie auf ↻, um Ihre installierten Ollama-Modelle zu laden',
  sourceLanguage: 'Quellsprache',
  sourceLanguageDescription:
    'Wählen Sie "Automatische Erkennung", damit der Anbieter die Quellsprache erkennt',
  targetLanguage: 'Zielsprache',
  autoDetect: 'Automatische Erkennung',
  searchLanguagePlaceholder: 'Sprache suchen...',
  translationUseCustomProvider: 'Benutzerdefinierten Anbieter für diese Voreinstellung verwenden',
  translationCustomProviderLabel: 'Benutzerdefinierter Anbieter',
  translationCustomModelLabel: 'Benutzerdefiniertes Modell (für LLM-Anbieter)',
  translationCustomModelPlaceholder: 'z.B.: gemini-1.5-flash, gpt-4o-mini',
  keyboardShortcut: 'Tastenkombination',
  keyboardShortcutDescription:
    'Drücken Sie die gewünschte Tastenkombination (z.B. Alt+T, Ctrl+Shift+T)',
  presetName: 'Voreinstellungsname',
  presetNamePlaceholder: 'Meine Voreinstellung',
  presetNameDefault: 'Preset {index}',
  addPreset: 'Voreinstellung hinzufügen',
  deletePreset: 'Voreinstellung löschen',
  presetDeleteTitle: 'Delete Preset?',
  presetDeleteMessage: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
  presetDeleteConfirm: 'Möchten Sie "{name}" wirklich löschen?',
  languagesLabel: 'Languages',
  shortcutInvalidFormat:
    'Ungültiges Tastenkombinationsformat. Muss einen Modifikator haben (z.B. Alt+T, Alt, Ctrl+1)',
  shortcutModifierOnly:
    'Modifier-only shortcuts (Alt, Ctrl, etc.) are not allowed to prevent conflicts',
  shortcutDuplicate: 'Tastenkombination wird bereits von "{name}" verwendet',
  shortcutConflictTitle: 'Keyboard Shortcut Conflict',
  shortcutTooManyKeys: 'Zu viele Tasten. Maximal 2 Tasten nach Modifikatoren (z.B. Alt+T+1)',
  shortcutHelp:
    'Unterstützt: Modifikator (Alt), Modifikator+Taste (Alt+T), oder Sequenzen (Alt+T+1). Max 2 Tasten.',
  cannotDeleteLastPreset: 'Die letzte Voreinstellung kann nicht gelöscht werden',
  saveChanges: 'Speichern',
  unsavedChanges: 'Nicht gespeicherte Änderungen',
  cancel: 'Abbrechen',
  undo: 'Rückgängig',
  undoChanges: 'Änderungen rückgängig machen',
  validationError: 'Validation error',
  ok: 'OK',
  howToUse: 'Verwendung:',
  usageSelect: 'Wählen Sie Text aus und drücken Sie {shortcut}, um ihn zu übersetzen',
  usageInput:
    'Fokussieren Sie ein Eingabefeld und drücken Sie {shortcut}, um den Inhalt zu übersetzen',
  usageWorks: 'Funktioniert auf jeder Website!',
  themeToggle: 'Thema wechseln',
  placeholderCustomModel: 'Namen des benutzerdefinierten Modells eingeben',
  enableTransformationMode: 'Lustige Texttransformation',
  transformationModeDescription: 'Unicode-Effekte anstelle von Übersetzung anwenden',
  transformationStyle: 'Transformationsstil',
  previewExample: 'Vorschau-Beispiel',
  previewPlaceholder: 'Tippen Sie, um die Transformation zu sehen...',
  presetModeLabel: 'Modus',
  presetModeTranslator: 'Übersetzer',
  presetModeTransformer: 'Transformator',
  presetModeCustomTransform: 'Benutzerdef. Transform.',
  presetModeLLMPrompt: 'LLM-Prompt',
  customTransformLabel: 'Transformation',
  customTransformPlaceholder: 'Wählen Sie eine Transformation',
  customTransformEmpty:
    'Keine benutzerdefinierten Transformationen. Öffnen Sie die Optionen, um eine zu erstellen.',
  customTransformOpenOptions: 'Transformationen verwalten',
  llmPromptLabel: 'Prompt-Vorlage',
  llmPromptPlaceholder: 'Verwenden Sie {{input}} für den ausgewählten Text',
  llmPromptHint: 'Der Platzhalter {{input}} wird durch den ausgewählten Text ersetzt',
  llmPromptProviderLabel: 'LLM-Anbieter',
  llmPromptModelLabel: 'Modell',
  llmPromptModelPlaceholder: 'Modellnamen eingeben',
  validationCustomTransformRequired: 'Bitte wählen Sie eine benutzerdefinierte Transformation aus',
  validationLLMPromptRequired: 'Bitte geben Sie eine Prompt-Vorlage mit {{input}} ein',
  validationLLMProviderRequired: 'Bitte wählen Sie einen LLM-Anbieter aus',
  validationLLMModelRequired: 'Bitte geben Sie einen Modellnamen ein',
  validationCustomProviderRequired: 'Bitte wählen Sie einen benutzerdefinierten Anbieter aus',
  pinnedPresetLabel: 'Für Rechtsklick-Menü verwenden',
  contextMenuTitle: '{name}',
  selectionModifierLabel: 'Wort-Auswahl-Modifikator',
  selectionModifierHelp:
    'Halten Sie Modifikator+Pfeiltasten in einem beliebig fokussierten Eingabefeld gedrückt, um Text wortweise auszuwählen. Ideal, um Wörter schnell auszuwählen, bevor Sie sie mit einem Tastenkürzel übersetzen!',
  selectionModifierExample: '{modifier}+← / {modifier}+→ wählt wortweise aus',
  optionsTitle: 'Benutzerdefinierte Transformationen',
  optionsNewTransformation: 'Neue Transformation',
  optionsEmptyList: 'Noch keine Transformationen',
  optionsEditButton: 'Bearbeiten',
  optionsDeleteButton: 'Löschen',
  optionsDeleteTitle: 'Transformation löschen?',
  optionsDeleteMessage: 'Sind Sie sicher, dass Sie löschen möchten ',
  optionsMappings: '{count} Zuordnungen',
  optionsEditorName: 'Name',
  optionsEditorNamePlaceholder: 'Meine Transformation',
  optionsPopulateLabel: 'Aus integriertem Stil vorbefüllen',
  optionsPopulateButton: 'Laden',
  optionsTableSource: 'Quelle',
  optionsTableTarget: 'Ziel',
  optionsAddMapping: '+ Zuordnung hinzufügen',
  optionsPreviewLabel: 'Live-Vorschau',
  optionsPreviewPlaceholder: 'Text für Vorschau eingeben...',
  optionsSaveButton: 'Speichern',
  optionsCancelButton: 'Abbrechen',
  optionsMaxReached: 'Maximum von {max} Transformationen erreicht',
  optionsEmptyName: 'Name ist erforderlich',
  proUpgradeTitle: 'Unbegrenzte Presets freischalten',
  proUpgradeLimitReached: 'Sie haben das Limit erreicht',
  proBetaTitle: 'Kostenloser Beta-Zugang',
  proBetaDescription:
    'Geben Sie Ihre E-Mail-Adresse im Formular ein, um einen kostenlosen Beta-Code zu erhalten.',
  proBetaGetCode: 'Beta-Code erhalten',
  proBetaCodePlaceholder: 'Beta-Code eingeben',
  proBetaActivate: 'Aktivieren',
  proBetaErrorInvalid: 'Ungültiger Code. Bitte überprüfen und erneut versuchen.',
  proBetaErrorExpired: 'Der Beta-Zeitraum ist abgelaufen. Upgrade auf Pro für unbegrenzte Presets.',
  proBetaSuccess: 'Beta-Zugang aktiviert! Unbegrenzte Presets freigeschaltet.',
  proBetaActivating: 'Aktivierung...',
  proUpgradeButton: 'Upgrade auf Pro',
  proUpgradeComingSoon: '(demnächst verfügbar)',
  proClose: 'Schließen',
  presetLockedTooltip: 'Gesperrt. Upgrade auf Pro, um dieses Preset zu bearbeiten',
  presetLockedMessage: 'Dieses Preset ist gesperrt. Upgrade auf Pro, um darauf zuzugreifen.',
  expandPrompt: 'Prompt-Editor erweitern',
}

const zhTranslations: TranslationMap = {
  appTitle: 'Power Input',
  presetsTab: '预设',
  globalTab: '全局',
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
  customModel: '自定义模型',
  placeholderModel: '模型名称',
  placeholderBaseUrl: 'https://api.example.com/v1',
  placeholderOptional: '可选',
  validationSuccess: '配置有效',
  validationFailed: '验证失败',
  validationLoaded: '配置已加载',
  modelRequired: '需要模型名称',
  baseUrlRequired: '需要基础 URL',
  ollamaHint: '点击 ↻ 加载已安装的 Ollama 模型',
  sourceLanguage: '源语言',
  sourceLanguageDescription: '选择"自动检测"让提供商检测源语言',
  targetLanguage: '目标语言',
  autoDetect: '自动检测',
  searchLanguagePlaceholder: '搜索语言...',
  translationUseCustomProvider: '为此预设使用自定义提供商',
  translationCustomProviderLabel: '自定义提供商',
  translationCustomModelLabel: '自定义模型（用于 LLM 提供商）',
  translationCustomModelPlaceholder: '例如：gemini-1.5-flash, gpt-4o-mini',
  keyboardShortcut: '键盘快捷键',
  keyboardShortcutDescription: '按下所需的键盘组合（例如：Alt+T, Ctrl+Shift+T）',
  presetName: '预设名称',
  presetNamePlaceholder: '我的预设',
  presetNameDefault: '预设 {index}',
  addPreset: '添加预设',
  deletePreset: '删除预设',
  presetDeleteTitle: 'Delete Preset?',
  presetDeleteMessage: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
  presetDeleteConfirm: '确定要删除 "{name}" 吗？',
  languagesLabel: 'Languages',
  shortcutInvalidFormat: '快捷键格式无效。必须包含修饰键（例如：Alt+T, Alt, Ctrl+1）',
  shortcutModifierOnly:
    'Modifier-only shortcuts (Alt, Ctrl, etc.) are not allowed to prevent conflicts',
  shortcutDuplicate: '快捷键已被 "{name}" 使用',
  shortcutConflictTitle: 'Keyboard Shortcut Conflict',
  shortcutTooManyKeys: '按键过多。修饰键后最多 2 个按键（例如：Alt+T+1）',
  shortcutHelp: '支持：修饰键（Alt），修饰键+按键（Alt+T），或序列（Alt+T+1）。最多 2 个按键。',
  cannotDeleteLastPreset: '无法删除最后一个预设',
  saveChanges: '保存',
  unsavedChanges: '未保存的更改',
  cancel: '取消',
  undo: '撤销',
  undoChanges: '撤销更改',
  validationError: 'Validation error',
  ok: 'OK',
  howToUse: '如何使用：',
  usageSelect: '选择文本并按 {shortcut} 翻译',
  usageInput: '聚焦输入字段并按 {shortcut} 翻译内容',
  usageWorks: '适用于任何网站！',
  themeToggle: '切换主题',
  placeholderCustomModel: '输入自定义模型名称',
  enableTransformationMode: '有趣文本转换',
  transformationModeDescription: '应用 Unicode 效果而非翻译',
  transformationStyle: '转换样式',
  previewExample: '预览示例',
  previewPlaceholder: '输入以查看转换...',
  presetModeLabel: '模式',
  presetModeTranslator: '翻译器',
  presetModeTransformer: '转换器',
  presetModeCustomTransform: '自定义转换',
  presetModeLLMPrompt: 'LLM 提示词',
  customTransformLabel: '转换',
  customTransformPlaceholder: '选择一种转换',
  customTransformEmpty: '没有自定义转换。打开选项来创建。 ',
  customTransformOpenOptions: '管理转换',
  llmPromptLabel: '提示词模板',
  llmPromptPlaceholder: '对选定文本使用 {{input}}',
  llmPromptHint: '{{input}} 占位符将被替换为选定的文本',
  llmPromptProviderLabel: 'LLM 提供商',
  llmPromptModelLabel: '模型',
  llmPromptModelPlaceholder: '输入模型名称',
  validationCustomTransformRequired: '请选择一种自定义转换',
  validationLLMPromptRequired: '请输入带有 {{input}} 的提示词模板',
  validationLLMProviderRequired: '请选择 LLM 提供商',
  validationLLMModelRequired: '请输入模型名称',
  validationCustomProviderRequired: '请选择自定义提供商',
  pinnedPresetLabel: '用于右键菜单',
  contextMenuTitle: '{name}',
  selectionModifierLabel: '词选择修饰键',
  selectionModifierHelp:
    '在任何获得焦点的输入框中按住修饰键+方向键，即可按单词选择文本。非常适合在使用键盘快捷键翻译之前快速选择单词！',
  selectionModifierExample: '{modifier}+← / {modifier}+→ 按单词选择',
  optionsTitle: '自定义转换',
  optionsNewTransformation: '新建转换',
  optionsEmptyList: '尚无转换',
  optionsEditButton: '编辑',
  optionsDeleteButton: '删除',
  optionsDeleteTitle: '删除转换？',
  optionsDeleteMessage: '您确定要删除吗 ',
  optionsMappings: '{count} 个映射',
  optionsEditorName: '名称',
  optionsEditorNamePlaceholder: '我的转换',
  optionsPopulateLabel: '从内置样式预填充',
  optionsPopulateButton: '加载',
  optionsTableSource: '源',
  optionsTableTarget: '目标',
  optionsAddMapping: '+ 添加映射',
  optionsPreviewLabel: '实时预览',
  optionsPreviewPlaceholder: '输入文本以预览...',
  optionsSaveButton: '保存',
  optionsCancelButton: '取消',
  optionsMaxReached: '已达到最大转换限制 {max} 个',
  optionsEmptyName: '名称是必填项',
  proUpgradeTitle: '解锁无限预设',
  proUpgradeLimitReached: '您已达到限制',
  proBetaTitle: '免费 Beta 测试访问权限',
  proBetaDescription: '在表单中提交您的电子邮件以获取免费的 Beta 代码。',
  proBetaGetCode: '获取 Beta 代码',
  proBetaCodePlaceholder: '输入 Beta 代码',
  proBetaActivate: '激活',
  proBetaErrorInvalid: '代码无效。请检查并重试。',
  proBetaErrorExpired: 'Beta 测试期已结束。升级到 Pro 以获得无限预设。',
  proBetaSuccess: 'Beta 访问权限已激活！无限预设已解锁。',
  proBetaActivating: '激活中...',
  proUpgradeButton: '升级到 Pro',
  proUpgradeComingSoon: '(即将推出)',
  proClose: '关闭',
  presetLockedTooltip: '已锁定 升级到 Pro 以编辑此预设',
  presetLockedMessage: '此预设已锁定。升级到 Pro 以访问它。',
  expandPrompt: '展开提示编辑器',
}

const jaTranslations: TranslationMap = {
  appTitle: 'Power Input',
  presetsTab: 'プリセット',
  globalTab: 'グローバル',
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
  customModel: 'カスタムモデル',
  placeholderModel: 'モデル名',
  placeholderBaseUrl: 'https://api.example.com/v1',
  placeholderOptional: 'オプション',
  validationSuccess: '設定が有効です',
  validationFailed: '検証に失敗しました',
  validationLoaded: '設定が読み込まれました',
  modelRequired: 'モデル名が必要です',
  baseUrlRequired: 'ベース URL が必要です',
  ollamaHint: '↻をクリックしてインストール済みのOllamaモデルを読み込む',
  sourceLanguage: 'ソース言語',
  sourceLanguageDescription: 'プロバイダーにソース言語を検出させるには「自動検出」を選択',
  targetLanguage: 'ターゲット言語',
  autoDetect: '自動検出',
  searchLanguagePlaceholder: '言語を検索...',
  translationUseCustomProvider: 'このプリセットにカスタムプロバイダーを使用',
  translationCustomProviderLabel: 'カスタムプロバイダー',
  translationCustomModelLabel: 'カスタムモデル（LLMプロバイダー用）',
  translationCustomModelPlaceholder: '例：gemini-1.5-flash, gpt-4o-mini',
  keyboardShortcut: 'キーボードショートカット',
  keyboardShortcutDescription:
    '希望のキーボード組み合わせを押してください（例：Alt+T, Ctrl+Shift+T）',
  presetName: 'プリセット名',
  presetNamePlaceholder: 'マイプリセット',
  presetNameDefault: 'プリセット {index}',
  addPreset: 'プリセットを追加',
  deletePreset: 'プリセットを削除',
  presetDeleteTitle: 'Delete Preset?',
  presetDeleteMessage: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
  presetDeleteConfirm: '"{name}" を削除してもよろしいですか？',
  languagesLabel: 'Languages',
  shortcutInvalidFormat:
    'ショートカット形式が無効です。修飾キーが必要です（例：Alt+T, Alt, Ctrl+1）',
  shortcutModifierOnly:
    'Modifier-only shortcuts (Alt, Ctrl, etc.) are not allowed to prevent conflicts',
  shortcutDuplicate: 'ショートカットは既に "{name}" で使用されています',
  shortcutConflictTitle: 'Keyboard Shortcut Conflict',
  shortcutTooManyKeys: 'キーが多すぎます。修飾キーの後に最大2つのキー（例：Alt+T+1）',
  shortcutHelp:
    'サポート：修飾キー（Alt），修飾キー+キー（Alt+T），またはシーケンス（Alt+T+1）。最大2キー。',
  cannotDeleteLastPreset: '最後のプリセットは削除できません',
  saveChanges: '保存',
  unsavedChanges: '未保存の変更',
  cancel: 'キャンセル',
  undo: '元に戻す',
  undoChanges: '変更を元に戻す',
  validationError: 'Validation error',
  ok: 'OK',
  howToUse: '使い方：',
  usageSelect: 'テキストを選択して {shortcut} を押して翻訳',
  usageInput: '入力フィールドにフォーカスして {shortcut} を押してコンテンツを翻訳',
  usageWorks: 'すべてのウェブサイトで動作します！',
  themeToggle: 'テーマを切り替え',
  placeholderCustomModel: 'カスタムモデル名を入力',
  enableTransformationMode: '楽しいテキスト変換',
  transformationModeDescription: '翻訳の代わりにUnicodeエフェクトを適用する',
  transformationStyle: '変換スタイル',
  previewExample: 'プレビュー例',
  previewPlaceholder: '入力して変換を確認...',
  presetModeLabel: 'モード',
  presetModeTranslator: '翻訳者',
  presetModeTransformer: '変換器',
  presetModeCustomTransform: 'カスタム変換',
  presetModeLLMPrompt: 'LLMプロンプト',
  customTransformLabel: '変換',
  customTransformPlaceholder: '変換を選択してください',
  customTransformEmpty: 'カスタム変換がありません。オプションを開いて作成してください。',
  customTransformOpenOptions: '変換を管理',
  llmPromptLabel: 'プロンプトテンプレート',
  llmPromptPlaceholder: '選択したテキストに {{input}} を使用してください',
  llmPromptHint: '{{input}} プレースホルダーは選択したテキストに置き換えられます',
  llmPromptProviderLabel: 'LLMプロバイダー',
  llmPromptModelLabel: 'モデル',
  llmPromptModelPlaceholder: 'モデル名を入力してください',
  validationCustomTransformRequired: 'カスタム変換を選択してください',
  validationLLMPromptRequired: '{{input}} を含むプロンプトテンプレートを入力してください',
  validationLLMProviderRequired: 'LLMプロバイダーを選択してください',
  validationLLMModelRequired: 'モデル名を入力してください',
  validationCustomProviderRequired: 'カスタムプロバイダーを選択してください',
  pinnedPresetLabel: '右クリックメニューで使用する',
  contextMenuTitle: '{name}',
  selectionModifierLabel: '単語選択修飾キー',
  selectionModifierHelp:
    'フォーカスされている入力欄で修飾キー＋矢印キーを押し続けると、単語ごとにテキストを選択できます。キーボードショートカットで翻訳する前に、素早く単語を選択するのに最適です！',
  selectionModifierExample: '{modifier}+← / {modifier}+→ で単語ごとに選択',
  optionsTitle: 'カスタム変換',
  optionsNewTransformation: '新規変換',
  optionsEmptyList: '変換はまだありません',
  optionsEditButton: '編集',
  optionsDeleteButton: '削除',
  optionsDeleteTitle: '変換を削除しますか？',
  optionsDeleteMessage: '本当に削除してもよろしいですか：',
  optionsMappings: '{count} 個のマッピング',
  optionsEditorName: '名前',
  optionsEditorNamePlaceholder: 'マイ変換',
  optionsPopulateLabel: '組み込みスタイルから事前入力',
  optionsPopulateButton: '読み込む',
  optionsTableSource: 'ソース',
  optionsTableTarget: 'ターゲット',
  optionsAddMapping: '+ マッピングを追加',
  optionsPreviewLabel: 'ライブプレビュー',
  optionsPreviewPlaceholder: 'テキストを入力してプレビュー...',
  optionsSaveButton: '保存',
  optionsCancelButton: 'キャンセル',
  optionsMaxReached: '変換の最大数（{max}）に達しました',
  optionsEmptyName: '名前は必須です',
  proUpgradeTitle: '無制限のプリセットをアンロック',
  proUpgradeLimitReached: '制限に達しました',
  proBetaTitle: '無料ベータアクセス',
  proBetaDescription:
    'フォームにメールアドレスを送信して、無料のベータコードを受け取ってください。',
  proBetaGetCode: 'ベータコードを取得',
  proBetaCodePlaceholder: 'ベータコードを入力',
  proBetaActivate: '有効化',
  proBetaErrorInvalid: '無効なコードです。確認してもう一度お試しください。',
  proBetaErrorExpired:
    'ベータ期間が終了しました。無制限のプリセットを利用するにはProにアップグレードしてください。',
  proBetaSuccess: 'ベータアクセスが有効になりました！無制限のプリセットが解除されました。',
  proBetaActivating: '有効化中...',
  proUpgradeButton: 'Proにアップグレード',
  proUpgradeComingSoon: '(近日公開)',
  proClose: '閉じる',
  presetLockedTooltip: 'ロック済み このプリセットを編集するにはProにアップグレードしてください',
  presetLockedMessage:
    'このプリセットはロックされています。アクセスするにはProにアップグレードしてください。',
  expandPrompt: 'プロンプトエディターを展開',
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

function formatMessage(
  message: string | undefined,
  params?: Record<string, string | number>
): string {
  if (!message) {
    return ''
  }
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

/**
 * Get localized name for a language code using Intl.DisplayNames API
 * @param code - ISO 639-1 language code (e.g., 'fr', 'en', 'ja')
 * @param displayLocale - UI locale to display the name in (optional, uses activeLocale by default)
 * @returns Localized language name, or uppercase code if API fails
 *
 * Examples:
 * getLanguageDisplayName('fr', 'en') // "French"
 * getLanguageDisplayName('ja', 'fr') // "japonais"
 * getLanguageDisplayName('es') // "Spanish" (if UI is in English)
 */
// displayLocale accepts any BCP-47 tag so callers can pass raw LanguageCode values
export function getLanguageDisplayName(code: string, displayLocale?: string): string {
  try {
    const locale = displayLocale || activeLocale.value
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' })
    const name = displayNames.of(code)
    return name || code.toUpperCase()
  } catch (_error) {
    // Fallback in case of API failure
    return code.toUpperCase()
  }
}
