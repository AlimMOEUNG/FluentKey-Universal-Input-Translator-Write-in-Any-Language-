import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-*/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.backup-translations/**',
    ],
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    name: 'app/custom-rules',
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for legitimate cases (private properties, build-time injections)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // Ignore parameters starting with _
          varsIgnorePattern: '^_', // Ignore variables starting with _
        },
      ],
    },
  },

  skipFormatting,
)
