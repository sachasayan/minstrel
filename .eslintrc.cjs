module.exports = {
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime', '@electron-toolkit/eslint-config-ts/recommended', '@electron-toolkit/eslint-config-prettier'],
  rules: {
    'prettier/prettier': 'off',
    'react/no-unknown-property': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'no-extra-boolean-cast': 'off',
    'no-console': 'off',
    '@typescript-eslint/no-extra-boolean-cast': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
    // '@typescript-eslint/no-unused-vars': 'off'
  }
}
