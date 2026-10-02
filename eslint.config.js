import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**', 'tmp/**', '.cache/**', 'playwright-report/**', 'test-results/**']),
  { files: ['**/*.{js,mjs,ts,tsx}'], extends: [js.configs.recommended] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    files: ['*.{js,ts}', 'scripts/**/*.mjs', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
])
