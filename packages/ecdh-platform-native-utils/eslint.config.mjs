import baseConfig from '@vexl-next/eslint-config'

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-plus-operands': 'off',
    },
  },
]
