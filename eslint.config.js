import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // `_` marks intentionally ignored args/errors; `React` is a leftover default import.
      'no-unused-vars': ['error', { varsIgnorePattern: '^(_|React$)', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      // Data-loading effects here intentionally set state; the new compiler-era rule is too strict for them.
      'react-hooks/set-state-in-effect': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
])
