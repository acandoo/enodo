import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import eslintConfigPrettier from 'eslint-config-prettier/flat'
import deMorgan from 'eslint-plugin-de-morgan'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'

function findGitignoreFiles(dir) {
    let results = []
    const list = fs.readdirSync(dir, { withFileTypes: true })
    for (const dirent of list) {
        const fullPath = path.join(dir, dirent.name)
        if (dirent.isDirectory()) {
            // Skip node_modules and .git for performance
            if (dirent.name === 'node_modules' || dirent.name === '.git')
                continue
            results = results.concat(findGitignoreFiles(fullPath))
        } else if (dirent.name.endsWith('.gitignore')) {
            results.push(fullPath)
        }
    }
    return results
}
const gitignorePaths = findGitignoreFiles(
    path.dirname(fileURLToPath(import.meta.url))
)

export default defineConfig([
    ...gitignorePaths.map((gitignorePath) =>
        includeIgnoreFile(gitignorePath, `Imported ${gitignorePath} patterns`)
    ),

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
