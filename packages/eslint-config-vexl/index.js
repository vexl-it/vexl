module.exports = {
  root: true,
  extends: ['standard-with-typescript', 'prettier'],
  'rules': {
    'no-restricted-exports': [
      'error',
      {'restrictDefaultExports': {'namespaceFrom': true, 'namedFrom': true}},
    ],
    // https://github.com/typescript-eslint/typescript-eslint/issues/2585
    '@typescript-eslint/no-redeclare': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    // 'import/extensions': [
    //   'error',
    //   'ignorePackages',
    //   {
    //     'js': 'always',
    //     'jsx': 'always',
    //   },
    // ],
  },
}
