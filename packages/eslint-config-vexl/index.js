module.exports = {
  root: true,
  extends: ['standard-with-typescript', 'prettier'],
  'rules': {
    'no-restricted-exports': [
      'error',
      {'restrictDefaultExports': {'namespaceFrom': true, 'namedFrom': true}},
    ],
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
