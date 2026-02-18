const js = require('@eslint/js')
const tseslint = require('typescript-eslint')
const reactPlugin = require('eslint-plugin-react')
const prettierConfig = require('eslint-config-prettier')
const globals = require('globals')

module.exports = tseslint.config(
  {
    ignores: ['node_modules/', 'dist/', 'out/', 'mock-projects/', '.eslintrc.cjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'off',
      'react/no-unknown-property': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-extra-boolean-cast': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-extra-boolean-cast': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  }
)
