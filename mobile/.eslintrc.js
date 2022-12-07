module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['plugin:react/recommended', 'standard-with-typescript', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['react'],
  'overrides': [
    {
      'files': ['**/*.test.js', '**/*.test.jsx'],
      'env': {
        'jest': true,
      },
    },
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    // "@typescript-eslint/strict-boolean-expressions": "warn"
  },
}
