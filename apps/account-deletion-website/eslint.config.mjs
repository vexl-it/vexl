import reactConfig from '@vexl-next/eslint-config/react'
import globals from 'globals'

export default [
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.es2021,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      formComponents: ['Form'],
      linkComponents: [
        { name: 'Link', linkAttribute: 'to' },
        { name: 'NavLink', linkAttribute: 'to' },
      ],
    },
  },
  {
    ignores: ['!**/.server', '!**/.client'],
  },
]
