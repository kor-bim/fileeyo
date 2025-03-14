import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import pluginQuery from '@tanstack/eslint-plugin-query'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'plugin:prettier/recommended'),
  ...pluginQuery.configs['flat/recommended'],
  {
    rules: {
      'prettier/prettier': ['error'],
      '@tanstack/query/exhaustive-deps': 'error',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]

export default eslintConfig
