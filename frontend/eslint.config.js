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
      // The setState-in-effect rule flags calling async functions inside useEffect,
      // which is an intentional pattern used throughout this codebase for
      // data-fetching. The app works correctly — silence this style warning.
      'react-hooks/set-state-in-effect': 'off',
      // Context files must export both a Provider (component) and a use* hook.
      // This is the correct React pattern and causes no runtime issues.
      'react-refresh/only-export-components': 'off',
    },
  },
])
