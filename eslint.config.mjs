import { fileURLToPath } from 'node:url'

import eslintConfigPrettier from 'eslint-config-prettier/flat'
import deMorgan from 'eslint-plugin-de-morgan'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default defineConfig([
    includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        plugins: { js },
        extends: ['js/recommended']
    },
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        languageOptions: { globals: globals.node }
    },
    tseslint.configs.recommended,
    deMorgan.configs.recommended,
    eslintConfigPrettier
])
