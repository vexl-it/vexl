import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import {baseConfig} from './index.mjs'

export const reactConfig = [
  ...baseConfig,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'error',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      'array-callback-return': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      'react/prop-types': 'off',
      'react/jsx-curly-brace-presence': 'error',
      'react/jsx-no-leaked-render': [
        'error',
        {validStrategies: ['coerce', 'ternary']},
      ],
    },
  },
]

export default reactConfig
