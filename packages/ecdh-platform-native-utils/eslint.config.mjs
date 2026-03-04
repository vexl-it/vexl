import baseConfig from '@vexl-next/eslint-config/index.mjs'

export default [
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/restrict-plus-operands': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'lib/'],
  },
]
