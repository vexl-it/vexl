import reactConfig from '@vexl-next/eslint-config/react.mjs'

const fetchHttpClientRestrictedMessage =
  'Every Vexl HTTP request must go through vexlGatedHttpClientLayer from ' +
  'src/api/vexlHttpClientLayer.ts — a raw FetchHttpClient bypasses the ' +
  'device-migration egress gate.'

export default [
  ...reactConfig,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: [
      // The gate itself wraps FetchHttpClient.
      'src/api/vexlHttpClientLayer.ts',
      // Tests may use FetchHttpClient internals (e.g. the Fetch tag) to mock
      // transport behavior.
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@effect/platform',
              importNames: ['FetchHttpClient'],
              message: fetchHttpClientRestrictedMessage,
            },
            {
              name: '@effect/platform/index',
              importNames: ['FetchHttpClient'],
              message: fetchHttpClientRestrictedMessage,
            },
            {
              name: '@effect/platform/FetchHttpClient',
              message: fetchHttpClientRestrictedMessage,
            },
          ],
        },
      ],
    },
  },
]
