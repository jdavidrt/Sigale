import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `dist` is build output; `server/current-server` is a read-only vendored
  // copy of BlackCoffe's server kept only for reference -- not ours to lint.
  globalIgnores(['dist', 'server/current-server']),
  {
    // Sigale backend (server/) is a separate Node app, not browser code.
    files: ['server/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
  {
    // Context files co-locate a Provider component with its use<X> hook by
    // design -- the react-refresh/only-export-components rule fires on this
    // pattern but it's intentional. Splitting would cost more than it saves.
    files: ['src/context/*.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
