import eslintConfig from '@vexl-next/eslint-config/index.mjs'

export default [
  ...eslintConfig,
  {
    files: ['app.plugin.js'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
]
